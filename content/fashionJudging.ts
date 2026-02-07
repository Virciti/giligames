/**
 * Fashion show outfit judging algorithm
 */

import type { FashionScenario, OutfitItem, OutfitCategory, OutfitJudgingResult } from './types';
import { getScenarioById } from './fashionScenarios';
import { getItemById } from './fashionItems';

/**
 * Judge an outfit for a given scenario.
 * Returns a score 0-100 and 0-3 stars.
 */
export function judgeOutfit(
  scenario: FashionScenario,
  equippedItemIds: Record<string, string | null> // category -> itemId
): OutfitJudgingResult {
  const equippedItems: OutfitItem[] = [];
  for (const itemId of Object.values(equippedItemIds)) {
    if (itemId) {
      const item = getItemById(itemId);
      if (item) equippedItems.push(item);
    }
  }

  if (equippedItems.length === 0) {
    return { completenessScore: 0, appropriatenessScore: 0, bonusScore: 0, totalScore: 0, stars: 0 };
  }

  // --- Completeness (0-40) ---
  const requiredCategories = scenario.categoryWeights.filter((cw) => cw.required);
  const optionalCategories = scenario.categoryWeights.filter((cw) => !cw.required);
  const filledCategories = new Set(equippedItems.map((i) => i.category));

  // Dress counts as top+bottom for completeness
  if (filledCategories.has('dress')) {
    filledCategories.add('top');
    filledCategories.add('bottom');
  }

  let completenessScore = 0;
  const requiredPointsPer = requiredCategories.length > 0
    ? 30 / requiredCategories.length
    : 30;
  for (const cw of requiredCategories) {
    if (filledCategories.has(cw.category)) {
      completenessScore += requiredPointsPer;
    }
  }
  const optionalPointsPer = optionalCategories.length > 0
    ? 10 / optionalCategories.length
    : 0;
  for (const cw of optionalCategories) {
    if (filledCategories.has(cw.category)) {
      completenessScore += optionalPointsPer;
    }
  }

  // --- Appropriateness (0-40) ---
  let weightedMatch = 0;
  let totalWeight = 0;

  for (const item of equippedItems) {
    const cw = scenario.categoryWeights.find((w) => w.category === item.category);
    const weight = cw?.weight ?? 1;
    const matchCount = item.tags.filter((t) => scenario.appropriateTags.includes(t)).length;
    const matchRatio = matchCount / Math.max(1, item.tags.length);
    weightedMatch += matchRatio * weight;
    totalWeight += weight;
  }

  const appropriatenessScore = totalWeight > 0
    ? (weightedMatch / totalWeight) * 40
    : 0;

  // --- Bonus (0-20) ---
  let bonusScore = 0;

  // All relevant categories filled
  const allCategoryIds = scenario.categoryWeights.map((cw) => cw.category);
  const relevantFilled = allCategoryIds.filter((c) => filledCategories.has(c)).length;
  if (relevantFilled >= allCategoryIds.length) {
    bonusScore += 8;
  }

  // High-tier items
  const avgTier = equippedItems.reduce((sum, i) => sum + i.tier, 0) / equippedItems.length;
  bonusScore += Math.min(8, avgTier * 1.6);

  // Variety (4+ distinct items)
  if (equippedItems.length >= 4) {
    bonusScore += 4;
  }

  const totalScore = Math.round(
    Math.min(100, completenessScore + appropriatenessScore + bonusScore)
  );

  const stars = totalScore >= 85 ? 3 : totalScore >= 60 ? 2 : totalScore >= 35 ? 1 : 0;

  return {
    completenessScore: Math.round(completenessScore),
    appropriatenessScore: Math.round(appropriatenessScore),
    bonusScore: Math.round(bonusScore),
    totalScore,
    stars,
  };
}

/**
 * Convenience: judge by scenario ID
 */
export function judgeOutfitByScenarioId(
  scenarioId: string,
  equippedItemIds: Record<string, string | null>
): OutfitJudgingResult {
  const scenario = getScenarioById(scenarioId as any);
  if (!scenario) {
    return { completenessScore: 0, appropriatenessScore: 0, bonusScore: 0, totalScore: 0, stars: 0 };
  }
  return judgeOutfit(scenario, equippedItemIds);
}
