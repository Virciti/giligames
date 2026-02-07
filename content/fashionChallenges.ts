/**
 * Fashion challenge types and point calculation
 */

import type { FashionChallenge, FashionChallengeType } from './types';

export const fashionChallenges: FashionChallenge[] = [
  {
    type: 'counting-closet',
    displayName: 'Counting Closet',
    description: 'Count the hangers to earn fashion points!',
    icon: '👗',
    gradient: ['#FF6B6B', '#E85D75'],
    basePoints: 3,
    tierMultiplier: 1,
    contentSource: 'numbers',
    minScenarioTier: 1,
  },
  {
    type: 'letter-stitch',
    displayName: 'Letter Stitch',
    description: 'Find the letters to sew your outfit!',
    icon: '🧵',
    gradient: ['#4ECDC4', '#2A9D8F'],
    basePoints: 3,
    tierMultiplier: 1,
    contentSource: 'letters',
    minScenarioTier: 1,
  },
  {
    type: 'color-mix',
    displayName: 'Color Mix Studio',
    description: 'Mix colors to match the design!',
    icon: '🎨',
    gradient: ['#FFE66D', '#FF9F43'],
    basePoints: 4,
    tierMultiplier: 1.2,
    contentSource: 'custom',
    minScenarioTier: 1,
  },
  {
    type: 'math-sparkle',
    displayName: 'Math Sparkle',
    description: 'Solve sparkly math to earn gems!',
    icon: '✨',
    gradient: ['#9B5DE5', '#7B2FF7'],
    basePoints: 4,
    tierMultiplier: 1.5,
    contentSource: 'math',
    minScenarioTier: 2,
  },
  {
    type: 'pattern-match',
    displayName: 'Pattern Designer',
    description: 'Complete the fashion pattern!',
    icon: '🔶',
    gradient: ['#7BC74D', '#4CAF50'],
    basePoints: 5,
    tierMultiplier: 1.3,
    contentSource: 'custom',
    minScenarioTier: 2,
  },
  {
    type: 'word-runway',
    displayName: 'Word Runway',
    description: 'Spot the word to strut the runway!',
    icon: '📖',
    gradient: ['#FF9F43', '#E8851E'],
    basePoints: 4,
    tierMultiplier: 1.5,
    contentSource: 'words',
    minScenarioTier: 2,
  },
];

export function getChallengeByType(type: FashionChallengeType): FashionChallenge | undefined {
  return fashionChallenges.find((c) => c.type === type);
}

export function getChallengesForScenarioTier(tier: number): FashionChallenge[] {
  return fashionChallenges.filter((c) => c.minScenarioTier <= tier);
}

/**
 * Calculate fashion points earned for a correct answer.
 * Formula: basePoints * (1 + (tier - 1) * tierMultiplier) * streakBonus
 */
export function calculateFashionPoints(
  challenge: FashionChallenge,
  tier: number,
  currentStreak: number
): number {
  const streakBonus = currentStreak >= 3 ? 1.5 : currentStreak >= 2 ? 1.2 : 1.0;
  const tierFactor = 1 + (tier - 1) * challenge.tierMultiplier;
  return Math.round(challenge.basePoints * tierFactor * streakBonus);
}
