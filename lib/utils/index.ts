/**
 * Utility functions barrel export
 */

// Learning selection algorithm
export {
  selectNextPrompt,
  updateMastery,
  getWeakItems,
  calculateMasteryScore,
  getConfusionItems,
  getItemsNeedingReview,
  getCategoryStats,
  shouldPracticeConfusionPairs,
} from './learning-selector';

// Adaptive difficulty system
export {
  adjustDifficulty,
  getDifficultyMultiplier,
  getSuggestedStartingDifficulty,
  isInFlowState,
  detectFrustration,
  detectBoredom,
  getAdaptiveHintDelay,
  getAdaptiveTimeLimit,
  calculateSessionDifficultyScore,
} from './adaptive-difficulty';

// Types
export type { DifficultyMultiplier, DifficultyConfig } from './adaptive-difficulty';
