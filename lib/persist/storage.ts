/**
 * Persistent storage for game save data
 *
 * Uses localStorage with validation, migration, and error handling.
 * SSR-safe (checks for window).
 */

import {
  type SaveData,
  validateSaveData,
  createDefaultSaveData,
  SCHEMA_VERSION,
} from './schema';
import {
  needsMigration,
  migrateData,
  isCorrupted,
  repairData,
} from './migrations';

// Storage key
const STORAGE_KEY = 'giigames-save';
const BACKUP_KEY = 'giigames-save-backup';

// Debounce timer for saves
let saveDebounceTimer: ReturnType<typeof setTimeout> | null = null;
const SAVE_DEBOUNCE_MS = 200;

// ============================================================
// Core Functions
// ============================================================

/**
 * Check if we're in a browser environment
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

/**
 * Load save data from localStorage
 */
export function load(): SaveData {
  if (!isBrowser()) {
    return createDefaultSaveData();
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      console.log('No save data found, using defaults');
      return createDefaultSaveData();
    }

    const parsed = JSON.parse(raw) as Record<string, unknown>;

    // Check for corruption
    if (isCorrupted(parsed)) {
      console.warn('Save data appears corrupted, attempting repair');
      const repaired = repairData(parsed);
      save(repaired); // Save the repaired data
      return repaired;
    }

    // Check if migration is needed
    if (needsMigration(parsed)) {
      console.log('Save data needs migration');
      const migrated = migrateData(parsed);
      save(migrated); // Save the migrated data
      return migrated;
    }

    // Validate the data
    const validated = validateSaveData(parsed);

    if (!validated) {
      console.warn('Save data validation failed, attempting repair');
      const repaired = repairData(parsed);
      save(repaired);
      return repaired;
    }

    return validated;
  } catch (error) {
    console.error('Failed to load save data:', error);

    // Try to load backup
    try {
      const backup = localStorage.getItem(BACKUP_KEY);
      if (backup) {
        const parsed = JSON.parse(backup) as Record<string, unknown>;
        const validated = validateSaveData(parsed);
        if (validated) {
          console.log('Restored from backup');
          save(validated);
          return validated;
        }
      }
    } catch {
      // Backup also failed
    }

    return createDefaultSaveData();
  }
}

/**
 * Save data to localStorage (immediate, no debounce)
 */
export function saveImmediate(data: SaveData): boolean {
  if (!isBrowser()) {
    return false;
  }

  try {
    // Validate before saving
    const validated = validateSaveData(data);
    if (!validated) {
      console.error('Cannot save invalid data');
      return false;
    }

    // Create backup of current data
    const current = localStorage.getItem(STORAGE_KEY);
    if (current) {
      localStorage.setItem(BACKUP_KEY, current);
    }

    // Update timestamp and version
    const toSave: SaveData = {
      ...validated,
      version: SCHEMA_VERSION,
      lastSaved: Date.now(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    return true;
  } catch (error) {
    console.error('Failed to save data:', error);
    return false;
  }
}

/**
 * Save data to localStorage (debounced)
 */
export function save(data: SaveData): boolean {
  if (!isBrowser()) {
    return false;
  }

  // Cancel any pending save
  if (saveDebounceTimer) {
    clearTimeout(saveDebounceTimer);
  }

  // Schedule the save
  saveDebounceTimer = setTimeout(() => {
    saveImmediate(data);
    saveDebounceTimer = null;
  }, SAVE_DEBOUNCE_MS);

  return true;
}

/**
 * Reset all save data to defaults
 */
export function reset(): SaveData {
  if (!isBrowser()) {
    return createDefaultSaveData();
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(BACKUP_KEY);
  } catch (error) {
    console.error('Failed to clear storage:', error);
  }

  return createDefaultSaveData();
}

/**
 * Export save data as JSON string
 */
export function exportData(): string {
  const data = load();
  return JSON.stringify(data, null, 2);
}

/**
 * Import save data from JSON string
 */
export function importData(jsonString: string): SaveData | null {
  try {
    const parsed = JSON.parse(jsonString) as unknown;
    const validated = validateSaveData(parsed);

    if (!validated) {
      console.error('Imported data validation failed');
      return null;
    }

    save(validated);
    return validated;
  } catch (error) {
    console.error('Failed to import data:', error);
    return null;
  }
}

// ============================================================
// Partial Update Functions
// ============================================================

/**
 * Update just the player state
 */
export function updatePlayer(
  updater: (player: SaveData['player']) => SaveData['player']
): boolean {
  const data = load();
  const updatedPlayer = updater(data.player);

  return save({
    ...data,
    player: updatedPlayer,
  });
}

/**
 * Update just the settings
 */
export function updateSettings(
  updater: (settings: SaveData['settings']) => SaveData['settings']
): boolean {
  const data = load();
  const updatedSettings = updater(data.settings);

  return save({
    ...data,
    settings: updatedSettings,
  });
}

/**
 * Add stars to the player's total
 */
export function addStars(amount: number): number {
  const data = load();
  const newTotal = data.player.totalStars + amount;

  save({
    ...data,
    player: {
      ...data.player,
      totalStars: newTotal,
    },
  });

  return newTotal;
}

/**
 * Update learning mastery for an item
 */
export function updateLearningMastery(
  itemId: string,
  updater: (item: SaveData['player']['learningMastery'][string] | undefined) =>
    SaveData['player']['learningMastery'][string]
): boolean {
  return updatePlayer((player) => ({
    ...player,
    learningMastery: {
      ...player.learningMastery,
      [itemId]: updater(player.learningMastery[itemId]),
    },
  }));
}

/**
 * Complete a level and record the score
 */
export function completeLevel(
  levelId: string,
  stars: number,
  score: number
): boolean {
  return updatePlayer((player) => {
    const existing = player.completedLevels[levelId];
    const shouldUpdate = !existing || stars > existing.stars || score > existing.bestScore;

    if (!shouldUpdate && existing) {
      return player;
    }

    return {
      ...player,
      completedLevels: {
        ...player.completedLevels,
        [levelId]: {
          stars: Math.max(stars, existing?.stars ?? 0),
          bestScore: Math.max(score, existing?.bestScore ?? 0),
          completedAt: Date.now(),
        },
      },
    };
  });
}

// ============================================================
// Query Functions
// ============================================================

/**
 * Get the current star count
 */
export function getStars(): number {
  return load().player.totalStars;
}

/**
 * Get the active profile
 */
export function getActiveProfile(): SaveData['player']['profiles'][0] | undefined {
  const data = load();
  return data.player.profiles.find((p) => p.id === data.player.activeProfileId);
}

/**
 * Check if a truck is unlocked
 */
export function isTruckUnlocked(truckId: string): boolean {
  const data = load();
  return data.player.unlockedTrucks.includes(truckId);
}

/**
 * Get learning mastery for an item
 */
export function getLearningMastery(
  itemId: string
): SaveData['player']['learningMastery'][string] | undefined {
  return load().player.learningMastery[itemId];
}

/**
 * Get completion data for a level
 */
export function getLevelCompletion(
  levelId: string
): SaveData['player']['completedLevels'][string] | undefined {
  return load().player.completedLevels[levelId];
}

/**
 * Check if storage is available
 */
export function isStorageAvailable(): boolean {
  if (!isBrowser()) {
    return false;
  }

  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the size of saved data in bytes
 */
export function getSaveDataSize(): number {
  if (!isBrowser()) {
    return 0;
  }

  const data = localStorage.getItem(STORAGE_KEY);
  return data ? new Blob([data]).size : 0;
}
