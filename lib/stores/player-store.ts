/**
 * Player Store - Zustand store for player state management
 *
 * Handles player profiles, progress, achievements, and learning mastery.
 * Integrated with the persistence layer for automatic save/load.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  type PlayerState,
  type PlayerProfile,
  type LearningItem,
  type LevelCompletion,
  type Achievement,
  createDefaultPlayerState,
  createDefaultProfile,
  createDefaultLearningItem,
  generateId,
  SCHEMA_VERSION,
} from '../persist/schema';
import { load, saveImmediate } from '../persist/storage';

// ============================================================
// Store Interface
// ============================================================

interface PlayerActions {
  // Star management
  addStars: (amount: number) => void;

  // Truck management
  unlockTruck: (truckId: string) => void;
  selectTruck: (truckId: string) => void;

  // Learning mastery
  updateMastery: (
    itemId: string,
    correct: boolean,
    difficulty?: number
  ) => void;

  // Level completion
  completeLevel: (levelId: string, stars: number, score: number) => void;

  // Profile management
  createProfile: (name: string, avatarTruck?: string) => string;
  deleteProfile: (profileId: string) => boolean;
  switchProfile: (profileId: string) => boolean;
  updateProfile: (profileId: string, updates: Partial<Omit<PlayerProfile, 'id' | 'createdAt'>>) => void;

  // Achievement management
  addAchievement: (achievementId: string) => void;
  hasAchievement: (achievementId: string) => boolean;

  // Play time and streak tracking
  updatePlayTime: (seconds: number) => void;
  updateStreak: () => void;

  // Profile seeding
  ensureProfiles: () => void;

  // Data management
  resetProgress: () => void;
  loadFromStorage: () => void;
}

export type PlayerStore = PlayerState & PlayerActions;

// ============================================================
// SSR-Safe Storage
// ============================================================

/**
 * Check if we're in a browser environment
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Custom storage that integrates with our persistence layer.
 * Uses StateStorage interface directly for proper typing with partialize.
 */
const playerStorage = {
  getItem: (name: string): string | null => {
    if (!isBrowser()) return null;

    try {
      // Load from our persistence layer and extract player state
      const saveData = load();
      const playerState: PlayerState = saveData.player;
      return JSON.stringify({ state: playerState, version: SCHEMA_VERSION });
    } catch (error) {
      console.error('Failed to load player state:', error);
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    if (!isBrowser()) return;

    try {
      const parsed = JSON.parse(value) as { state: PlayerState };
      const saveData = load();

      // Update the player portion of save data
      saveImmediate({
        ...saveData,
        player: parsed.state,
        lastSaved: Date.now(),
      });
    } catch (error) {
      console.error('Failed to save player state:', error);
    }
  },
  removeItem: (name: string): void => {
    if (!isBrowser()) return;

    try {
      localStorage.removeItem(name);
    } catch (error) {
      console.error('Failed to remove player state:', error);
    }
  },
};

// ============================================================
// Store Creation
// ============================================================

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => ({
      // Initial state from defaults
      ...createDefaultPlayerState(),

      // --------------------------------------------------------
      // Star Management
      // --------------------------------------------------------

      addStars: (amount: number) => {
        if (amount <= 0) return;

        set((state) => ({
          totalStars: state.totalStars + amount,
        }));
      },

      // --------------------------------------------------------
      // Truck Management
      // --------------------------------------------------------

      unlockTruck: (truckId: string) => {
        set((state) => {
          if (state.unlockedTrucks.includes(truckId)) {
            return state;
          }

          return {
            unlockedTrucks: [...state.unlockedTrucks, truckId],
          };
        });
      },

      selectTruck: (truckId: string) => {
        const state = get();

        // Can only select unlocked trucks
        if (!state.unlockedTrucks.includes(truckId)) {
          console.warn(`Cannot select locked truck: ${truckId}`);
          return;
        }

        set({ selectedTruck: truckId });
      },

      // --------------------------------------------------------
      // Learning Mastery
      // --------------------------------------------------------

      updateMastery: (itemId: string, correct: boolean, difficulty?: number) => {
        set((state) => {
          const existing = state.learningMastery[itemId];
          const item = existing ?? createDefaultLearningItem(itemId);

          const newStreak = correct ? item.streak + 1 : 0;
          const newDifficulty =
            difficulty ??
            (correct && newStreak >= 3
              ? Math.min(item.difficulty + 1, 5)
              : !correct && item.streak === 0
                ? Math.max(item.difficulty - 1, 1)
                : item.difficulty);

          const updatedItem: LearningItem = {
            ...item,
            attempts: item.attempts + 1,
            correct: correct ? item.correct + 1 : item.correct,
            streak: newStreak,
            lastSeen: Date.now(),
            difficulty: newDifficulty,
          };

          return {
            learningMastery: {
              ...state.learningMastery,
              [itemId]: updatedItem,
            },
          };
        });
      },

      // --------------------------------------------------------
      // Level Completion
      // --------------------------------------------------------

      completeLevel: (levelId: string, stars: number, score: number) => {
        // Validate stars
        const validStars = Math.max(0, Math.min(3, stars));

        set((state) => {
          const existing = state.completedLevels[levelId];

          // Calculate new total stars
          const previousStars = existing?.stars ?? 0;
          const starDelta = Math.max(0, validStars - previousStars);

          const completion: LevelCompletion = {
            stars: Math.max(validStars, existing?.stars ?? 0),
            bestScore: Math.max(score, existing?.bestScore ?? 0),
            completedAt: Date.now(),
          };

          return {
            completedLevels: {
              ...state.completedLevels,
              [levelId]: completion,
            },
            totalStars: state.totalStars + starDelta,
          };
        });
      },

      // --------------------------------------------------------
      // Profile Management
      // --------------------------------------------------------

      createProfile: (name: string, avatarTruck?: string): string => {
        const profile: PlayerProfile = {
          id: generateId(),
          name: name.slice(0, 20), // Enforce max length
          avatarTruck: avatarTruck ?? 'truck-red-rocket',
          createdAt: Date.now(),
        };

        set((state) => ({
          profiles: [...state.profiles, profile],
        }));

        return profile.id;
      },

      deleteProfile: (profileId: string): boolean => {
        const state = get();

        // Cannot delete the last profile
        if (state.profiles.length <= 1) {
          console.warn('Cannot delete the last profile');
          return false;
        }

        // Cannot delete the active profile without switching first
        if (state.activeProfileId === profileId) {
          console.warn('Cannot delete the active profile');
          return false;
        }

        set((state) => ({
          profiles: state.profiles.filter((p) => p.id !== profileId),
        }));

        return true;
      },

      switchProfile: (profileId: string): boolean => {
        const state = get();
        const profile = state.profiles.find((p) => p.id === profileId);

        if (!profile) {
          console.warn(`Profile not found: ${profileId}`);
          return false;
        }

        set({ activeProfileId: profileId });
        return true;
      },

      updateProfile: (
        profileId: string,
        updates: Partial<Omit<PlayerProfile, 'id' | 'createdAt'>>
      ) => {
        set((state) => ({
          profiles: state.profiles.map((p) =>
            p.id === profileId
              ? {
                  ...p,
                  ...updates,
                  name: updates.name ? updates.name.slice(0, 20) : p.name,
                }
              : p
          ),
        }));
      },

      // --------------------------------------------------------
      // Achievement Management
      // --------------------------------------------------------

      addAchievement: (achievementId: string) => {
        set((state) => {
          // Check if already earned
          if (state.achievements.some((a) => a.id === achievementId)) {
            return state;
          }

          const achievement: Achievement = {
            id: achievementId,
            earnedAt: Date.now(),
          };

          return {
            achievements: [...state.achievements, achievement],
          };
        });
      },

      hasAchievement: (achievementId: string): boolean => {
        return get().achievements.some((a) => a.id === achievementId);
      },

      // --------------------------------------------------------
      // Play Time and Streak Tracking
      // --------------------------------------------------------

      updatePlayTime: (seconds: number) => {
        if (seconds <= 0) return;

        set((state) => ({
          totalPlayTime: state.totalPlayTime + seconds,
        }));
      },

      updateStreak: () => {
        const today = new Date().toISOString().split('T')[0];

        set((state) => {
          const lastPlayed = state.lastPlayedDate;

          if (lastPlayed === today) {
            // Already played today
            return state;
          }

          // Calculate days since last play
          const lastDate = new Date(lastPlayed);
          const todayDate = new Date(today);
          const diffTime = todayDate.getTime() - lastDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            // Consecutive day - increase streak
            return {
              currentStreak: state.currentStreak + 1,
              lastPlayedDate: today,
            };
          } else {
            // Streak broken - reset to 1
            return {
              currentStreak: 1,
              lastPlayedDate: today,
            };
          }
        });
      },

      // --------------------------------------------------------
      // Profile Seeding
      // --------------------------------------------------------

      ensureProfiles: () => {
        const state = get();
        const hasLiam = state.profiles.some((p) => p.id === 'profile-liam');
        const hasGianna = state.profiles.some((p) => p.id === 'profile-gianna');

        if (!hasLiam || !hasGianna) {
          const profiles = [...state.profiles];
          if (!hasLiam) {
            profiles.push({
              id: 'profile-liam',
              name: 'Liam',
              avatarTruck: 'truck-red-rocket',
              createdAt: Date.now(),
            });
          }
          if (!hasGianna) {
            profiles.push({
              id: 'profile-gianna',
              name: 'Gianna',
              avatarTruck: 'truck-blue-thunder',
              createdAt: Date.now(),
            });
          }
          set({ profiles });
        }
      },

      // --------------------------------------------------------
      // Data Management
      // --------------------------------------------------------

      resetProgress: () => {
        const state = get();

        // Keep profiles but reset progress
        set({
          totalStars: 0,
          selectedTruck: 'truck-red-rocket',
          unlockedTrucks: ['truck-red-rocket', 'truck-blue-thunder'],
          learningMastery: {},
          completedLevels: {},
          achievements: [],
          totalPlayTime: 0,
          currentStreak: 0,
          lastPlayedDate: new Date().toISOString().split('T')[0],
          // Keep profiles
          profiles: state.profiles,
          activeProfileId: state.activeProfileId,
        });
      },

      loadFromStorage: () => {
        // This triggers a re-hydration from storage
        try {
          const saveData = load();
          set(saveData.player);
        } catch (error) {
          console.error('Failed to load from storage:', error);
        }
      },
    }),
    {
      name: 'giigames-player',
      storage: createJSONStorage(() => playerStorage),
      version: SCHEMA_VERSION,
      partialize: (state) => ({
        // Only persist these fields
        activeProfileId: state.activeProfileId,
        profiles: state.profiles,
        selectedTruck: state.selectedTruck,
        totalStars: state.totalStars,
        unlockedTrucks: state.unlockedTrucks,
        learningMastery: state.learningMastery,
        completedLevels: state.completedLevels,
        achievements: state.achievements,
        totalPlayTime: state.totalPlayTime,
        currentStreak: state.currentStreak,
        lastPlayedDate: state.lastPlayedDate,
      }),
    }
  )
);

// ============================================================
// Selector Hooks
// ============================================================

/**
 * Get the active player profile
 */
export function useActiveProfile(): PlayerProfile | undefined {
  return usePlayerStore((state) =>
    state.profiles.find((p) => p.id === state.activeProfileId)
  );
}

/**
 * Get learning mastery for a specific item
 */
export function useLearningMastery(itemId: string): LearningItem | undefined {
  return usePlayerStore((state) => state.learningMastery[itemId]);
}

/**
 * Get completion data for a specific level
 */
export function useLevelCompletion(levelId: string): LevelCompletion | undefined {
  return usePlayerStore((state) => state.completedLevels[levelId]);
}

/**
 * Check if a truck is unlocked
 */
export function useIsTruckUnlocked(truckId: string): boolean {
  return usePlayerStore((state) => state.unlockedTrucks.includes(truckId));
}

/**
 * Get accuracy percentage for a learning item
 */
export function useLearningAccuracy(itemId: string): number {
  return usePlayerStore((state) => {
    const item = state.learningMastery[itemId];
    if (!item || item.attempts === 0) return 0;
    return Math.round((item.correct / item.attempts) * 100);
  });
}

/**
 * Get total star count across all completed levels
 */
export function useTotalLevelStars(): number {
  return usePlayerStore((state) =>
    Object.values(state.completedLevels).reduce(
      (sum, level) => sum + level.stars,
      0
    )
  );
}
