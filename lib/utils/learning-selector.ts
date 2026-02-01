/**
 * Learning selection algorithm for GiiGames
 *
 * Implements adaptive spaced repetition with weighted selection
 * to optimize learning outcomes for young children.
 */

import type { LearningItem } from '../persist/schema';

// ============================================================
// Constants
// ============================================================

/** Number of recently shown items to filter out */
const RECENTLY_SHOWN_LIMIT = 3;

/** Time decay factor for recency weighting (ms) */
const RECENCY_DECAY_MS = 24 * 60 * 60 * 1000; // 24 hours

/** Maximum weight for any single factor */
const MAX_FACTOR_WEIGHT = 10;

/** Minimum attempts before mastery is considered reliable */
const MIN_ATTEMPTS_FOR_RELIABLE_MASTERY = 3;

// ============================================================
// Confusion Pairs Map
// ============================================================

/**
 * Map of commonly confused items by category
 * These are items that children frequently mix up
 */
const CONFUSION_PAIRS: Record<string, Record<string, string[]>> = {
  letters: {
    'letter-b': ['letter-d', 'letter-p'],
    'letter-d': ['letter-b', 'letter-p'],
    'letter-p': ['letter-b', 'letter-d', 'letter-q'],
    'letter-q': ['letter-p'],
    'letter-m': ['letter-n', 'letter-w'],
    'letter-n': ['letter-m'],
    'letter-w': ['letter-m', 'letter-v'],
    'letter-v': ['letter-w'],
  },
  numbers: {
    'number-6': ['number-9'],
    'number-9': ['number-6'],
    'number-12': ['number-21'],
    'number-21': ['number-12'],
    'number-13': ['number-30'],
    'number-30': ['number-13'],
    'number-14': ['number-40'],
    'number-40': ['number-14'],
    'number-15': ['number-50'],
    'number-50': ['number-15'],
    'number-16': ['number-60'],
    'number-60': ['number-16'],
    'number-17': ['number-70'],
    'number-70': ['number-17'],
    'number-18': ['number-80'],
    'number-80': ['number-18'],
    'number-19': ['number-90'],
    'number-90': ['number-19'],
  },
  sightWords: {
    'word-the': ['word-they', 'word-there', 'word-then'],
    'word-they': ['word-the', 'word-there'],
    'word-there': ['word-the', 'word-they', 'word-where'],
    'word-then': ['word-the', 'word-when'],
    'word-where': ['word-there', 'word-when', 'word-were'],
    'word-when': ['word-then', 'word-where'],
    'word-was': ['word-saw'],
    'word-saw': ['word-was'],
    'word-no': ['word-on'],
    'word-on': ['word-no'],
  },
  mathPrompts: {
    // Math confusion pairs are typically operation-based
    // Addition vs subtraction of same numbers
  },
};

// ============================================================
// Core Selection Functions
// ============================================================

/**
 * Calculate mastery score for a learning item (0-100)
 *
 * Factors:
 * - Accuracy (correct/attempts ratio): 0-50 points
 * - Current streak: 0-30 points
 * - Recency of practice: 0-20 points
 */
export function calculateMasteryScore(item: LearningItem): number {
  // Handle items with no attempts
  if (item.attempts === 0) {
    return 0;
  }

  // Accuracy component (0-50 points)
  const accuracy = item.correct / item.attempts;
  const accuracyScore = accuracy * 50;

  // Streak component (0-30 points)
  // Cap streak contribution at 5 correct in a row
  const streakScore = Math.min(item.streak / 5, 1) * 30;

  // Recency component (0-20 points)
  // Items practiced recently get higher scores
  const now = Date.now();
  const timeSinceLastSeen = now - item.lastSeen;
  const recencyFactor = Math.max(0, 1 - timeSinceLastSeen / (7 * RECENCY_DECAY_MS));
  const recencyScore = recencyFactor * 20;

  return Math.round(accuracyScore + streakScore + recencyScore);
}

/**
 * Calculate selection weight for an item
 * Higher weight = more likely to be selected
 *
 * Favors:
 * - Low mastery items
 * - Items not seen recently
 * - Items with broken streaks
 * - Confusion pairs when struggling
 */
function calculateSelectionWeight(
  item: LearningItem,
  category: string,
  allItems: LearningItem[]
): number {
  let weight = 1;

  // Factor 1: Low mastery = higher weight
  const mastery = calculateMasteryScore(item);
  const masteryWeight = MAX_FACTOR_WEIGHT - (mastery / 100) * MAX_FACTOR_WEIGHT;
  weight += masteryWeight;

  // Factor 2: Not seen recently = higher weight
  const now = Date.now();
  const timeSinceLastSeen = now - item.lastSeen;
  const recencyWeight = Math.min(
    MAX_FACTOR_WEIGHT,
    (timeSinceLastSeen / RECENCY_DECAY_MS) * 2
  );
  weight += recencyWeight;

  // Factor 3: Broken streak = higher weight
  // If they were doing well but made a mistake, prioritize review
  if (item.attempts > 0 && item.streak === 0 && item.correct > 0) {
    // Had correct answers before but streak is now broken
    weight += 3;
  }

  // Factor 4: Confusion pair bonus when struggling
  // If player is struggling with this item, also practice confusion pairs
  if (item.attempts >= MIN_ATTEMPTS_FOR_RELIABLE_MASTERY) {
    const accuracy = item.correct / item.attempts;
    if (accuracy < 0.6) {
      // Player is struggling
      const confusionPairs = getConfusionItems(item.id, category);
      const isConfusionPairStruggling = confusionPairs.some((pairId) => {
        const pairItem = allItems.find((i) => i.id === pairId);
        if (!pairItem || pairItem.attempts < MIN_ATTEMPTS_FOR_RELIABLE_MASTERY) {
          return false;
        }
        return pairItem.correct / pairItem.attempts < 0.6;
      });

      if (isConfusionPairStruggling) {
        weight += 4; // Boost weight when confusion pairs are both struggling
      }
    }
  }

  // Factor 5: New items get moderate boost
  if (item.attempts === 0) {
    weight += 2;
  }

  // Factor 6: Difficulty scaling
  // Higher difficulty items that haven't been mastered need more practice
  if (mastery < 70) {
    weight += (item.difficulty - 1) * 0.5;
  }

  return weight;
}

/**
 * Select the next prompt using weighted random selection
 *
 * @param items - All learning items for the category
 * @param category - The content category (letters, numbers, etc.)
 * @param recentlyShown - IDs of recently shown items to filter out
 * @returns The selected learning item
 */
export function selectNextPrompt(
  items: LearningItem[],
  category: string,
  recentlyShown: string[]
): LearningItem {
  if (items.length === 0) {
    throw new Error('No items available for selection');
  }

  // Filter out recently shown items (last N)
  const recentSet = new Set(recentlyShown.slice(-RECENTLY_SHOWN_LIMIT));
  let availableItems = items.filter((item) => !recentSet.has(item.id));

  // If all items were recently shown, allow all items
  if (availableItems.length === 0) {
    availableItems = items;
  }

  // Calculate weights for all available items
  const weightedItems = availableItems.map((item) => ({
    item,
    weight: calculateSelectionWeight(item, category, items),
  }));

  // Calculate total weight
  const totalWeight = weightedItems.reduce((sum, { weight }) => sum + weight, 0);

  // Perform weighted random selection
  let random = Math.random() * totalWeight;
  for (const { item, weight } of weightedItems) {
    random -= weight;
    if (random <= 0) {
      return item;
    }
  }

  // Fallback to last item (should not normally reach here)
  return weightedItems[weightedItems.length - 1].item;
}

// ============================================================
// Mastery Update Functions
// ============================================================

/**
 * Update mastery data after an answer attempt
 *
 * @param item - The learning item that was attempted
 * @param wasCorrect - Whether the answer was correct
 * @returns Updated learning item
 */
export function updateMastery(
  item: LearningItem,
  wasCorrect: boolean
): LearningItem {
  const now = Date.now();

  // Update attempts count
  const attempts = item.attempts + 1;

  // Update correct count
  const correct = wasCorrect ? item.correct + 1 : item.correct;

  // Update streak
  const streak = wasCorrect ? item.streak + 1 : 0;

  // Calculate new difficulty based on performance
  const difficulty = calculateNewDifficulty(item, wasCorrect, attempts, correct);

  return {
    ...item,
    attempts,
    correct,
    streak,
    lastSeen: now,
    difficulty,
  };
}

/**
 * Calculate new difficulty level based on performance
 */
function calculateNewDifficulty(
  item: LearningItem,
  wasCorrect: boolean,
  totalAttempts: number,
  totalCorrect: number
): number {
  // Need minimum attempts for reliable adjustment
  if (totalAttempts < MIN_ATTEMPTS_FOR_RELIABLE_MASTERY) {
    return item.difficulty;
  }

  const accuracy = totalCorrect / totalAttempts;
  let newDifficulty = item.difficulty;

  // High accuracy with good streak = can increase difficulty
  if (accuracy >= 0.85 && item.streak >= 3 && wasCorrect) {
    newDifficulty = Math.min(5, item.difficulty + 1);
  }

  // Low accuracy = decrease difficulty
  if (accuracy < 0.5 && totalAttempts >= 5) {
    newDifficulty = Math.max(1, item.difficulty - 1);
  }

  return newDifficulty;
}

// ============================================================
// Analytics Functions
// ============================================================

/**
 * Get items sorted by weakness (lowest mastery first)
 *
 * @param items - All learning items
 * @param limit - Maximum number of items to return (default: 10)
 * @returns Array of weakest items
 */
export function getWeakItems(
  items: LearningItem[],
  limit: number = 10
): LearningItem[] {
  // Calculate mastery for each item and sort ascending
  const itemsWithMastery = items.map((item) => ({
    item,
    mastery: calculateMasteryScore(item),
  }));

  // Sort by mastery score (lowest first)
  itemsWithMastery.sort((a, b) => a.mastery - b.mastery);

  // Return top N weakest items
  return itemsWithMastery.slice(0, limit).map(({ item }) => item);
}

/**
 * Get IDs of commonly confused items for a given item
 *
 * @param itemId - The ID of the item to check
 * @param category - The content category
 * @returns Array of IDs that are commonly confused with this item
 */
export function getConfusionItems(itemId: string, category: string): string[] {
  const categoryPairs = CONFUSION_PAIRS[category];
  if (!categoryPairs) {
    return [];
  }

  return categoryPairs[itemId] || [];
}

/**
 * Get items that need immediate review
 * These are items with low mastery that were seen recently
 *
 * @param items - All learning items
 * @param limit - Maximum number of items to return
 * @returns Array of items needing immediate review
 */
export function getItemsNeedingReview(
  items: LearningItem[],
  limit: number = 5
): LearningItem[] {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;

  // Find items that were attempted recently but have low mastery
  const recentStruggles = items.filter((item) => {
    if (item.lastSeen < oneHourAgo) return false;
    if (item.attempts < MIN_ATTEMPTS_FOR_RELIABLE_MASTERY) return false;

    const accuracy = item.correct / item.attempts;
    return accuracy < 0.6;
  });

  // Sort by mastery (lowest first)
  recentStruggles.sort(
    (a, b) => calculateMasteryScore(a) - calculateMasteryScore(b)
  );

  return recentStruggles.slice(0, limit);
}

/**
 * Get mastery statistics for a category
 *
 * @param items - All learning items for the category
 * @returns Statistics object
 */
export function getCategoryStats(items: LearningItem[]): {
  totalItems: number;
  attemptedItems: number;
  masteredItems: number;
  averageMastery: number;
  totalAttempts: number;
  totalCorrect: number;
} {
  const attemptedItems = items.filter((item) => item.attempts > 0);
  const masteredItems = items.filter((item) => calculateMasteryScore(item) >= 80);

  const totalAttempts = items.reduce((sum, item) => sum + item.attempts, 0);
  const totalCorrect = items.reduce((sum, item) => sum + item.correct, 0);

  const averageMastery =
    attemptedItems.length > 0
      ? attemptedItems.reduce(
          (sum, item) => sum + calculateMasteryScore(item),
          0
        ) / attemptedItems.length
      : 0;

  return {
    totalItems: items.length,
    attemptedItems: attemptedItems.length,
    masteredItems: masteredItems.length,
    averageMastery: Math.round(averageMastery),
    totalAttempts,
    totalCorrect,
  };
}

/**
 * Check if an item should be included in confusion pair training
 *
 * @param itemId - The ID of the item
 * @param category - The content category
 * @param items - All learning items
 * @returns True if confusion pair training is recommended
 */
export function shouldPracticeConfusionPairs(
  itemId: string,
  category: string,
  items: LearningItem[]
): boolean {
  const item = items.find((i) => i.id === itemId);
  if (!item || item.attempts < MIN_ATTEMPTS_FOR_RELIABLE_MASTERY) {
    return false;
  }

  const accuracy = item.correct / item.attempts;
  if (accuracy >= 0.7) {
    return false; // Not struggling with this item
  }

  const confusionPairs = getConfusionItems(itemId, category);
  return confusionPairs.length > 0;
}
