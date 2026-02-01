/**
 * Game Store - Zustand store for runtime game state
 *
 * Handles current game session, scene management, and settings.
 * Settings are persisted while game session state is transient.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  type GameSettings,
  createDefaultSettings,
  SCHEMA_VERSION,
} from '../persist/schema';
import { load, saveImmediate } from '../persist/storage';

// ============================================================
// Types
// ============================================================

export type GameType = 'stadium' | 'race' | 'learn' | null;
export type Difficulty = 'easy' | 'medium' | 'hard';
export type ControlLayout = 'left' | 'right' | 'both';

// ============================================================
// Store Interface
// ============================================================

interface GameState {
  // Runtime state (not persisted)
  currentGame: GameType;
  currentScene: string;
  isPlaying: boolean;
  isPaused: boolean;
  score: number;
  sessionStartTime: number | null;

  // Settings (persisted)
  soundEnabled: boolean;
  musicEnabled: boolean;
  voiceEnabled: boolean;
  difficulty: Difficulty;
  controlLayout: ControlLayout;
  autoAccelerate: boolean;
  assistMode: boolean;
  reducedMotion: boolean;
}

interface GameActions {
  // Game session management
  startGame: (gameType: GameType, scene?: string) => void;
  pauseGame: () => void;
  resumeGame: () => void;
  endGame: () => { score: number; duration: number };

  // Scene management
  setScene: (scene: string) => void;

  // Score management
  addScore: (points: number) => void;
  setScore: (score: number) => void;
  resetScore: () => void;

  // Settings management
  updateSettings: (settings: Partial<GameSettings>) => void;
  toggleSound: () => void;
  toggleMusic: () => void;
  toggleVoice: () => void;
  setDifficulty: (difficulty: Difficulty) => void;
  setControlLayout: (layout: ControlLayout) => void;
  toggleAutoAccelerate: () => void;
  toggleAssistMode: () => void;
  toggleReducedMotion: () => void;
  resetSettings: () => void;

  // Data management
  loadSettingsFromStorage: () => void;
}

export type GameStore = GameState & GameActions;

// ============================================================
// Default State
// ============================================================

const defaultSettings = createDefaultSettings();

const defaultGameState: GameState = {
  // Runtime state
  currentGame: null,
  currentScene: '',
  isPlaying: false,
  isPaused: false,
  score: 0,
  sessionStartTime: null,

  // Settings from defaults
  soundEnabled: defaultSettings.soundEnabled,
  musicEnabled: defaultSettings.musicEnabled,
  voiceEnabled: defaultSettings.voiceEnabled,
  difficulty: defaultSettings.difficulty,
  controlLayout: defaultSettings.controlLayout,
  autoAccelerate: defaultSettings.autoAccelerate,
  assistMode: defaultSettings.assistMode,
  reducedMotion: defaultSettings.reducedMotion,
};

// ============================================================
// SSR-Safe Storage for Settings
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
const settingsStorage = {
  getItem: (name: string): string | null => {
    if (!isBrowser()) return null;

    try {
      const saveData = load();
      return JSON.stringify({ state: saveData.settings, version: SCHEMA_VERSION });
    } catch (error) {
      console.error('Failed to load game settings:', error);
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    if (!isBrowser()) return;

    try {
      const parsed = JSON.parse(value) as { state: GameSettings };
      const saveData = load();

      saveImmediate({
        ...saveData,
        settings: parsed.state,
        lastSaved: Date.now(),
      });
    } catch (error) {
      console.error('Failed to save game settings:', error);
    }
  },
  removeItem: (name: string): void => {
    if (!isBrowser()) return;

    try {
      localStorage.removeItem(name);
    } catch (error) {
      console.error('Failed to remove game settings:', error);
    }
  },
};

// ============================================================
// Store Creation
// ============================================================

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...defaultGameState,

      // --------------------------------------------------------
      // Game Session Management
      // --------------------------------------------------------

      startGame: (gameType: GameType, scene?: string) => {
        set({
          currentGame: gameType,
          currentScene: scene ?? '',
          isPlaying: true,
          isPaused: false,
          score: 0,
          sessionStartTime: Date.now(),
        });
      },

      pauseGame: () => {
        const state = get();
        if (!state.isPlaying || state.isPaused) return;

        set({ isPaused: true });
      },

      resumeGame: () => {
        const state = get();
        if (!state.isPlaying || !state.isPaused) return;

        set({ isPaused: false });
      },

      endGame: () => {
        const state = get();
        const duration = state.sessionStartTime
          ? Math.floor((Date.now() - state.sessionStartTime) / 1000)
          : 0;
        const finalScore = state.score;

        set({
          currentGame: null,
          currentScene: '',
          isPlaying: false,
          isPaused: false,
          score: 0,
          sessionStartTime: null,
        });

        return { score: finalScore, duration };
      },

      // --------------------------------------------------------
      // Scene Management
      // --------------------------------------------------------

      setScene: (scene: string) => {
        set({ currentScene: scene });
      },

      // --------------------------------------------------------
      // Score Management
      // --------------------------------------------------------

      addScore: (points: number) => {
        if (points === 0) return;

        set((state) => ({
          score: Math.max(0, state.score + points),
        }));
      },

      setScore: (score: number) => {
        set({ score: Math.max(0, score) });
      },

      resetScore: () => {
        set({ score: 0 });
      },

      // --------------------------------------------------------
      // Settings Management
      // --------------------------------------------------------

      updateSettings: (settings: Partial<GameSettings>) => {
        set((state) => ({
          soundEnabled: settings.soundEnabled ?? state.soundEnabled,
          musicEnabled: settings.musicEnabled ?? state.musicEnabled,
          voiceEnabled: settings.voiceEnabled ?? state.voiceEnabled,
          difficulty: settings.difficulty ?? state.difficulty,
          controlLayout: settings.controlLayout ?? state.controlLayout,
          autoAccelerate: settings.autoAccelerate ?? state.autoAccelerate,
          assistMode: settings.assistMode ?? state.assistMode,
          reducedMotion: settings.reducedMotion ?? state.reducedMotion,
        }));
      },

      toggleSound: () => {
        set((state) => ({ soundEnabled: !state.soundEnabled }));
      },

      toggleMusic: () => {
        set((state) => ({ musicEnabled: !state.musicEnabled }));
      },

      toggleVoice: () => {
        set((state) => ({ voiceEnabled: !state.voiceEnabled }));
      },

      setDifficulty: (difficulty: Difficulty) => {
        set({ difficulty });
      },

      setControlLayout: (layout: ControlLayout) => {
        set({ controlLayout: layout });
      },

      toggleAutoAccelerate: () => {
        set((state) => ({ autoAccelerate: !state.autoAccelerate }));
      },

      toggleAssistMode: () => {
        set((state) => ({ assistMode: !state.assistMode }));
      },

      toggleReducedMotion: () => {
        set((state) => ({ reducedMotion: !state.reducedMotion }));
      },

      resetSettings: () => {
        const defaults = createDefaultSettings();
        set({
          soundEnabled: defaults.soundEnabled,
          musicEnabled: defaults.musicEnabled,
          voiceEnabled: defaults.voiceEnabled,
          difficulty: defaults.difficulty,
          controlLayout: defaults.controlLayout,
          autoAccelerate: defaults.autoAccelerate,
          assistMode: defaults.assistMode,
          reducedMotion: defaults.reducedMotion,
        });
      },

      // --------------------------------------------------------
      // Data Management
      // --------------------------------------------------------

      loadSettingsFromStorage: () => {
        try {
          const saveData = load();
          set({
            soundEnabled: saveData.settings.soundEnabled,
            musicEnabled: saveData.settings.musicEnabled,
            voiceEnabled: saveData.settings.voiceEnabled,
            difficulty: saveData.settings.difficulty,
            controlLayout: saveData.settings.controlLayout,
            autoAccelerate: saveData.settings.autoAccelerate,
            assistMode: saveData.settings.assistMode,
            reducedMotion: saveData.settings.reducedMotion,
          });
        } catch (error) {
          console.error('Failed to load settings from storage:', error);
        }
      },
    }),
    {
      name: 'giigames-settings',
      storage: createJSONStorage(() => settingsStorage),
      version: SCHEMA_VERSION,
      partialize: (state) => ({
        // Only persist settings, not runtime state
        soundEnabled: state.soundEnabled,
        musicEnabled: state.musicEnabled,
        voiceEnabled: state.voiceEnabled,
        difficulty: state.difficulty,
        controlLayout: state.controlLayout,
        autoAccelerate: state.autoAccelerate,
        assistMode: state.assistMode,
        reducedMotion: state.reducedMotion,
      }),
    }
  )
);

// ============================================================
// Selector Hooks
// ============================================================

/**
 * Check if any audio is enabled
 */
export function useAnyAudioEnabled(): boolean {
  return useGameStore(
    (state) => state.soundEnabled || state.musicEnabled || state.voiceEnabled
  );
}

/**
 * Get all audio settings
 */
export function useAudioSettings(): {
  soundEnabled: boolean;
  musicEnabled: boolean;
  voiceEnabled: boolean;
} {
  return useGameStore((state) => ({
    soundEnabled: state.soundEnabled,
    musicEnabled: state.musicEnabled,
    voiceEnabled: state.voiceEnabled,
  }));
}

/**
 * Get all accessibility settings
 */
export function useAccessibilitySettings(): {
  assistMode: boolean;
  reducedMotion: boolean;
  autoAccelerate: boolean;
} {
  return useGameStore((state) => ({
    assistMode: state.assistMode,
    reducedMotion: state.reducedMotion,
    autoAccelerate: state.autoAccelerate,
  }));
}

/**
 * Get current game session info
 */
export function useGameSession(): {
  gameType: GameType;
  scene: string;
  isPlaying: boolean;
  isPaused: boolean;
  score: number;
} {
  return useGameStore((state) => ({
    gameType: state.currentGame,
    scene: state.currentScene,
    isPlaying: state.isPlaying,
    isPaused: state.isPaused,
    score: state.score,
  }));
}

/**
 * Get session duration in seconds
 */
export function useSessionDuration(): number {
  const sessionStartTime = useGameStore((state) => state.sessionStartTime);
  if (!sessionStartTime) return 0;
  return Math.floor((Date.now() - sessionStartTime) / 1000);
}

/**
 * Check if game is actively running (playing and not paused)
 */
export function useIsGameActive(): boolean {
  return useGameStore((state) => state.isPlaying && !state.isPaused);
}
