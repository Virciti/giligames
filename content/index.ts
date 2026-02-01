/**
 * GiiGames Content
 *
 * Educational content for the GiiGames learning adventure.
 * Includes letters, numbers, sight words, math prompts, trucks, and levels.
 */

// Types
export * from './types';

// Letters
export {
  letters,
  getLetterById,
  getLetterByChar,
  getConfusionPairs as getLetterConfusionPairs,
  getVowels,
  getConsonants,
} from './letters';

// Numbers
export {
  numbers,
  getNumberById,
  getNumberByValue,
  getNumbersInRange,
  getConfusionPairs as getNumberConfusionPairs,
  getSingleDigitNumbers,
  getTeenNumbers,
} from './numbers';

// Sight Words
export {
  sightWords,
  getSightWordById,
  getSightWordByWord,
  getWordsByTier,
  getWordsByCategory,
  getWordsUpToTier,
  getRhymingWords,
} from './sightWords';

// Math Prompts
export {
  allMathPrompts as mathPrompts,
  getMathPromptById,
  getPromptsByOperation,
  getPromptsByTier as getMathPromptsByTier,
  getPromptsByOperationAndTier,
  getPromptsUpToTier as getMathPromptsUpToTier,
  getNumberBonds,
  getWrongAnswers,
  formatPrompt,
  formatPromptWithAnswer,
} from './mathPrompts';

// Trucks
export {
  trucks,
  getTruckById,
  getDefaultTrucks,
  getStarUnlockableTrucks,
  isTruckUnlocked,
  getNextUnlockableTruck,
  getUnlockProgress,
  getTrucksSortedByUnlock,
  getUnlockMilestones,
} from './trucks';

// Levels
export {
  allLevels as levels,
  stadiumLevels,
  raceLevels,
  learnLevels,
  getLevelById,
  getLevelsByMode,
  getLevelsByTier,
  getUnlockedLevels,
  getNextUnlockableLevel,
  getLearnLevelsByCategory,
  isLevelUnlocked,
} from './levels';
