/**
 * Save data migrations
 *
 * When the save data schema changes, add a migration function here
 * to update old save data to the new format.
 */

import { SCHEMA_VERSION, createDefaultSaveData, type SaveData } from './schema';

// Type for migration functions
type MigrationFn = (data: Record<string, unknown>) => Record<string, unknown>;

// Migration registry: version -> migration function
const migrations: Map<number, MigrationFn> = new Map();

// ============================================================
// Migration Functions
// ============================================================

// Example migration from v0 to v1 (placeholder for future migrations)
// migrations.set(0, (data) => {
//   // Transform v0 data to v1 format
//   return {
//     ...data,
//     version: 1,
//     // Add new fields, transform existing ones, etc.
//   };
// });

// ============================================================
// Migration Runner
// ============================================================

/**
 * Check if data needs migration
 */
export function needsMigration(data: Record<string, unknown>): boolean {
  const version = typeof data.version === 'number' ? data.version : 0;
  return version < SCHEMA_VERSION;
}

/**
 * Get the current schema version
 */
export function getCurrentVersion(): number {
  return SCHEMA_VERSION;
}

/**
 * Get the version of the save data
 */
export function getDataVersion(data: Record<string, unknown>): number {
  return typeof data.version === 'number' ? data.version : 0;
}

/**
 * Run migrations on save data to bring it up to the current version
 */
export function migrateData(data: Record<string, unknown>): SaveData {
  let currentData = { ...data };
  let currentVersion = getDataVersion(currentData);

  // If data has no version or is completely invalid, return defaults
  if (currentVersion === 0 && !data.player) {
    console.log('No valid save data found, using defaults');
    return createDefaultSaveData();
  }

  // Run migrations sequentially
  while (currentVersion < SCHEMA_VERSION) {
    const migration = migrations.get(currentVersion);

    if (migration) {
      console.log(`Migrating save data from v${currentVersion} to v${currentVersion + 1}`);
      try {
        currentData = migration(currentData);
        currentVersion = getDataVersion(currentData);
      } catch (error) {
        console.error(`Migration from v${currentVersion} failed:`, error);
        // Return defaults if migration fails
        return createDefaultSaveData();
      }
    } else {
      // No migration defined, just bump version
      currentData.version = currentVersion + 1;
      currentVersion = currentVersion + 1;
    }
  }

  // Ensure version is set correctly
  currentData.version = SCHEMA_VERSION;

  return currentData as SaveData;
}

/**
 * Merge new default fields into existing data
 * Useful when adding new optional fields
 */
export function mergeWithDefaults(data: Partial<SaveData>): SaveData {
  const defaults = createDefaultSaveData();

  return {
    version: SCHEMA_VERSION,
    player: {
      ...defaults.player,
      ...data.player,
      // Merge nested objects carefully
      learningMastery: {
        ...defaults.player.learningMastery,
        ...(data.player?.learningMastery ?? {}),
      },
      completedLevels: {
        ...defaults.player.completedLevels,
        ...(data.player?.completedLevels ?? {}),
      },
      profiles: data.player?.profiles ?? defaults.player.profiles,
      unlockedTrucks: data.player?.unlockedTrucks ?? defaults.player.unlockedTrucks,
      achievements: data.player?.achievements ?? defaults.player.achievements,
    },
    settings: {
      ...defaults.settings,
      ...data.settings,
    },
    lastSaved: Date.now(),
  };
}

/**
 * Check if save data is corrupted beyond repair
 */
export function isCorrupted(data: unknown): boolean {
  if (typeof data !== 'object' || data === null) {
    return true;
  }

  const obj = data as Record<string, unknown>;

  // Basic structure check
  if (typeof obj.player !== 'object' || obj.player === null) {
    return true;
  }

  const player = obj.player as Record<string, unknown>;

  // Check for essential fields
  if (typeof player.activeProfileId !== 'string') {
    return true;
  }

  if (!Array.isArray(player.profiles) || player.profiles.length === 0) {
    return true;
  }

  return false;
}

/**
 * Attempt to repair corrupted data
 */
export function repairData(data: Record<string, unknown>): SaveData {
  const defaults = createDefaultSaveData();

  try {
    // Try to preserve what we can
    const player = (data.player as Record<string, unknown>) ?? {};
    const settings = (data.settings as Record<string, unknown>) ?? {};

    return {
      version: SCHEMA_VERSION,
      player: {
        activeProfileId:
          typeof player.activeProfileId === 'string'
            ? player.activeProfileId
            : defaults.player.activeProfileId,
        profiles: Array.isArray(player.profiles)
          ? (player.profiles as typeof defaults.player.profiles)
          : defaults.player.profiles,
        selectedTruck:
          typeof player.selectedTruck === 'string'
            ? player.selectedTruck
            : defaults.player.selectedTruck,
        totalStars:
          typeof player.totalStars === 'number' && player.totalStars >= 0
            ? player.totalStars
            : defaults.player.totalStars,
        unlockedTrucks: Array.isArray(player.unlockedTrucks)
          ? (player.unlockedTrucks as string[])
          : defaults.player.unlockedTrucks,
        learningMastery:
          typeof player.learningMastery === 'object' && player.learningMastery !== null
            ? (player.learningMastery as typeof defaults.player.learningMastery)
            : defaults.player.learningMastery,
        completedLevels:
          typeof player.completedLevels === 'object' && player.completedLevels !== null
            ? (player.completedLevels as typeof defaults.player.completedLevels)
            : defaults.player.completedLevels,
        achievements: Array.isArray(player.achievements)
          ? (player.achievements as typeof defaults.player.achievements)
          : defaults.player.achievements,
        totalPlayTime:
          typeof player.totalPlayTime === 'number'
            ? player.totalPlayTime
            : defaults.player.totalPlayTime,
        currentStreak:
          typeof player.currentStreak === 'number'
            ? player.currentStreak
            : defaults.player.currentStreak,
        lastPlayedDate:
          typeof player.lastPlayedDate === 'string'
            ? player.lastPlayedDate
            : defaults.player.lastPlayedDate,
      },
      settings: {
        soundEnabled:
          typeof settings.soundEnabled === 'boolean'
            ? settings.soundEnabled
            : defaults.settings.soundEnabled,
        musicEnabled:
          typeof settings.musicEnabled === 'boolean'
            ? settings.musicEnabled
            : defaults.settings.musicEnabled,
        voiceEnabled:
          typeof settings.voiceEnabled === 'boolean'
            ? settings.voiceEnabled
            : defaults.settings.voiceEnabled,
        difficulty:
          ['easy', 'medium', 'hard'].includes(settings.difficulty as string)
            ? (settings.difficulty as typeof defaults.settings.difficulty)
            : defaults.settings.difficulty,
        controlLayout:
          ['left', 'right', 'both'].includes(settings.controlLayout as string)
            ? (settings.controlLayout as typeof defaults.settings.controlLayout)
            : defaults.settings.controlLayout,
        autoAccelerate:
          typeof settings.autoAccelerate === 'boolean'
            ? settings.autoAccelerate
            : defaults.settings.autoAccelerate,
        assistMode:
          typeof settings.assistMode === 'boolean'
            ? settings.assistMode
            : defaults.settings.assistMode,
        reducedMotion:
          typeof settings.reducedMotion === 'boolean'
            ? settings.reducedMotion
            : defaults.settings.reducedMotion,
      },
      lastSaved: Date.now(),
    };
  } catch {
    // If repair fails, return defaults
    return defaults;
  }
}
