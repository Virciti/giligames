/**
 * Zod schemas for save data validation
 */

import { z } from 'zod';

// Current schema version
export const SCHEMA_VERSION = 1;

// ============================================================
// Learning Item Schema
// ============================================================

export const LearningItemSchema = z.object({
  id: z.string(),
  attempts: z.number().min(0),
  correct: z.number().min(0),
  streak: z.number().min(0),
  lastSeen: z.number(), // timestamp
  difficulty: z.number().min(1).max(5),
});

export type LearningItem = z.infer<typeof LearningItemSchema>;

// ============================================================
// Player Profile Schema
// ============================================================

export const PlayerProfileSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(20),
  avatarTruck: z.string(),
  createdAt: z.number(),
});

export type PlayerProfile = z.infer<typeof PlayerProfileSchema>;

// ============================================================
// Level Completion Schema
// ============================================================

export const LevelCompletionSchema = z.object({
  stars: z.number().min(0).max(3),
  bestScore: z.number().min(0),
  completedAt: z.number().optional(),
});

export type LevelCompletion = z.infer<typeof LevelCompletionSchema>;

// ============================================================
// Achievement Schema
// ============================================================

export const AchievementSchema = z.object({
  id: z.string(),
  earnedAt: z.number(),
});

export type Achievement = z.infer<typeof AchievementSchema>;

// ============================================================
// Player State Schema
// ============================================================

export const PlayerStateSchema = z.object({
  activeProfileId: z.string(),
  profiles: z.array(PlayerProfileSchema),
  selectedTruck: z.string(),
  totalStars: z.number().min(0),
  unlockedTrucks: z.array(z.string()),
  learningMastery: z.record(z.string(), LearningItemSchema),
  completedLevels: z.record(z.string(), LevelCompletionSchema),
  achievements: z.array(AchievementSchema),
  totalPlayTime: z.number().min(0), // seconds
  currentStreak: z.number().min(0), // days
  lastPlayedDate: z.string(), // ISO date string
});

export type PlayerState = z.infer<typeof PlayerStateSchema>;

// ============================================================
// Game Settings Schema
// ============================================================

export const GameSettingsSchema = z.object({
  soundEnabled: z.boolean(),
  musicEnabled: z.boolean(),
  voiceEnabled: z.boolean(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  controlLayout: z.enum(['left', 'right', 'both']),
  autoAccelerate: z.boolean(),
  assistMode: z.boolean(),
  reducedMotion: z.boolean(),
});

export type GameSettings = z.infer<typeof GameSettingsSchema>;

// ============================================================
// Complete Save Data Schema
// ============================================================

export const SaveDataSchema = z.object({
  version: z.number(),
  player: PlayerStateSchema,
  settings: GameSettingsSchema,
  lastSaved: z.number(), // timestamp
});

export type SaveData = z.infer<typeof SaveDataSchema>;

// ============================================================
// Default Values
// ============================================================

export function createDefaultProfile(name: string = 'Player 1'): PlayerProfile {
  return {
    id: generateId(),
    name,
    avatarTruck: 'truck-red-rocket',
    createdAt: Date.now(),
  };
}

export function createDefaultPlayerState(): PlayerState {
  const defaultProfile = createDefaultProfile();
  return {
    activeProfileId: defaultProfile.id,
    profiles: [defaultProfile],
    selectedTruck: 'truck-red-rocket',
    totalStars: 0,
    unlockedTrucks: ['truck-red-rocket', 'truck-blue-thunder'],
    learningMastery: {},
    completedLevels: {},
    achievements: [],
    totalPlayTime: 0,
    currentStreak: 0,
    lastPlayedDate: new Date().toISOString().split('T')[0],
  };
}

export function createDefaultSettings(): GameSettings {
  return {
    soundEnabled: true,
    musicEnabled: true,
    voiceEnabled: true,
    difficulty: 'medium',
    controlLayout: 'right',
    autoAccelerate: false,
    assistMode: false,
    reducedMotion: false,
  };
}

export function createDefaultSaveData(): SaveData {
  return {
    version: SCHEMA_VERSION,
    player: createDefaultPlayerState(),
    settings: createDefaultSettings(),
    lastSaved: Date.now(),
  };
}

export function createDefaultLearningItem(id: string): LearningItem {
  return {
    id,
    attempts: 0,
    correct: 0,
    streak: 0,
    lastSeen: 0,
    difficulty: 1,
  };
}

// ============================================================
// Validation Functions
// ============================================================

export function validateSaveData(data: unknown): SaveData | null {
  const result = SaveDataSchema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  console.error('Save data validation failed:', result.error.issues);
  return null;
}

export function validatePlayerState(data: unknown): PlayerState | null {
  const result = PlayerStateSchema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  return null;
}

export function validateSettings(data: unknown): GameSettings | null {
  const result = GameSettingsSchema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  return null;
}

// ============================================================
// Utility Functions
// ============================================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export { generateId };
