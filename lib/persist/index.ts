/**
 * GiiGames Persistence Layer
 *
 * Provides validated, versioned save data storage with migration support.
 */

// Schema and types
export {
  SCHEMA_VERSION,
  type SaveData,
  type PlayerState,
  type GameSettings,
  type PlayerProfile,
  type LearningItem,
  type LevelCompletion,
  type Achievement,
  createDefaultSaveData,
  createDefaultPlayerState,
  createDefaultSettings,
  createDefaultProfile,
  createDefaultLearningItem,
  validateSaveData,
  validatePlayerState,
  validateSettings,
  generateId,
} from './schema';

// Migrations
export {
  needsMigration,
  getCurrentVersion,
  getDataVersion,
  migrateData,
  mergeWithDefaults,
  isCorrupted,
  repairData,
} from './migrations';

// Storage operations
export {
  load,
  save,
  saveImmediate,
  reset,
  exportData,
  importData,
  updatePlayer,
  updateSettings,
  addStars,
  updateLearningMastery,
  completeLevel,
  getStars,
  getActiveProfile,
  isTruckUnlocked,
  getLearningMastery,
  getLevelCompletion,
  isStorageAvailable,
  getSaveDataSize,
} from './storage';
