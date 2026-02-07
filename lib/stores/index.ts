/**
 * GiiGames State Management Stores
 *
 * Zustand stores for player state and game runtime state.
 * Both stores integrate with the persistence layer for automatic save/load.
 */

// Player Store - profiles, progress, achievements, mastery
export {
  usePlayerStore,
  useActiveProfile,
  useLearningMastery,
  useLevelCompletion,
  useIsTruckUnlocked,
  useLearningAccuracy,
  useTotalLevelStars,
  type PlayerStore,
} from './player-store';

// Learning Challenge Store - in-race educational challenge state
export {
  useLearningChallengeStore,
  type LearningCategory,
  type LearningChallengeStore,
} from './learning-game-store';

// Game Store - runtime state and settings
export {
  useGameStore,
  useAnyAudioEnabled,
  useAudioSettings,
  useAccessibilitySettings,
  useGameSession,
  useSessionDuration,
  useIsGameActive,
  type GameStore,
  type GameType,
  type Difficulty,
  type ControlLayout,
} from './game-store';
