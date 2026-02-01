/**
 * Content types for GiiGames educational content
 */

// ============================================================
// Letter Content
// ============================================================

export interface Letter {
  id: string; // 'letter-a', 'letter-b', etc.
  uppercase: string;
  lowercase: string;
  phoneme: string; // Primary sound: "ah", "buh", etc.
  alternatePhonemes?: string[]; // Other sounds the letter can make
  audioPath: string; // Path to audio file
  exampleWord: string; // Example word starting with this letter
  confusesWith?: string[]; // Letters commonly confused with this one
}

// ============================================================
// Number Content
// ============================================================

export interface NumberContent {
  id: string; // 'number-1', 'number-2', etc.
  value: number;
  word: string; // 'one', 'two', etc.
  audioPath: string;
  quantity: string; // Description for counting: "one apple", "two apples"
  confusesWith?: string[]; // Numbers commonly confused with this one
}

// ============================================================
// Sight Words
// ============================================================

export interface SightWord {
  id: string;
  word: string;
  tier: number; // 1-5, difficulty tier
  audioPath: string;
  category: string; // 'common', 'dolch', 'fry', etc.
}

// ============================================================
// Math Prompts
// ============================================================

export type MathOperation = 'addition' | 'subtraction';

export interface MathPrompt {
  id: string;
  operation: MathOperation;
  operand1: number;
  operand2: number;
  answer: number;
  tier: number; // 1-5, difficulty tier
  audioPath: string;
}

// ============================================================
// Trucks
// ============================================================

export interface TruckStats {
  speed: number; // 1-5
  jump: number; // 1-5
  handling: number; // 1-5
}

export type TruckUnlockType = 'default' | 'stars' | 'achievement';

export interface TruckUnlockRequirement {
  type: TruckUnlockType;
  value?: number; // Stars required if type is 'stars'
  achievementId?: string; // Achievement ID if type is 'achievement'
}

export interface Truck {
  id: string;
  name: string;
  tagline: string;
  color: string; // CSS color
  secondaryColor?: string;
  stats: TruckStats;
  unlockRequirement: TruckUnlockRequirement;
  imagePath: string;
}

// ============================================================
// Levels
// ============================================================

export type GameMode = 'stadium' | 'race' | 'learn';

export interface LevelBase {
  id: string;
  name: string;
  mode: GameMode;
  tier: number; // 1-5, difficulty/progression
  unlockStars: number; // Stars required to unlock
}

export interface StadiumLevel extends LevelBase {
  mode: 'stadium';
  config: {
    width: number;
    height: number;
    groundY: number;
    platforms: Array<{
      x: number;
      y: number;
      width: number;
      height: number;
    }>;
    ramps: Array<{
      x: number;
      y: number;
      width: number;
      height: number;
      angle: number;
    }>;
    starPositions: Array<{ x: number; y: number }>;
    obstacles: Array<{
      x: number;
      y: number;
      type: 'box' | 'barrel';
    }>;
    challenges: Array<{
      type: 'collect' | 'crush' | 'time';
      target: number;
      timeLimit?: number;
    }>;
  };
}

export interface RaceLevel extends LevelBase {
  mode: 'race';
  config: {
    trackType: 'oval' | 'figure8' | 'winding' | 'stadium';
    laps: number;
    aiCount: number;
    waypoints: Array<{ x: number; y: number }>;
    trackWidth: number;
    boostPads: Array<{
      x: number;
      y: number;
      width: number;
      height: number;
    }>;
  };
}

export interface LearnLevel extends LevelBase {
  mode: 'learn';
  config: {
    category: 'numbers' | 'letters' | 'math' | 'words';
    gameType: string; // e.g., 'number-crush', 'letter-find'
    promptCount: number;
    timeLimit?: number;
  };
}

export type Level = StadiumLevel | RaceLevel | LearnLevel;

// ============================================================
// Helper Types for Content Selection
// ============================================================

export interface LearningItem {
  id: string;
  type: 'letter' | 'number' | 'word' | 'math';
  display: string;
  audioPath: string;
  tier: number;
  confusesWith?: string[];
}
