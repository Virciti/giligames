/**
 * Level configurations for all game modes
 */

import type { Level, StadiumLevel, RaceLevel, LearnLevel, GameMode } from './types';

// ============================================================
// Stadium Levels
// ============================================================

export const stadiumLevels: StadiumLevel[] = [
  {
    id: 'stadium-beginner',
    name: 'Beginner Arena',
    mode: 'stadium',
    tier: 1,
    unlockStars: 0,
    config: {
      width: 1200,
      height: 600,
      groundY: 500,
      platforms: [
        { x: 200, y: 400, width: 150, height: 20 },
        { x: 500, y: 350, width: 150, height: 20 },
        { x: 850, y: 400, width: 150, height: 20 },
      ],
      ramps: [
        { x: 100, y: 480, width: 100, height: 20, angle: 15 },
        { x: 700, y: 480, width: 100, height: 20, angle: -15 },
      ],
      starPositions: [
        { x: 150, y: 350 },
        { x: 350, y: 300 },
        { x: 550, y: 250 },
        { x: 750, y: 300 },
        { x: 950, y: 350 },
      ],
      obstacles: [
        { x: 400, y: 470, type: 'box' },
        { x: 600, y: 470, type: 'barrel' },
      ],
      challenges: [
        { type: 'collect', target: 5, timeLimit: 60 },
        { type: 'crush', target: 2, timeLimit: 45 },
      ],
    },
  },
  {
    id: 'stadium-intermediate',
    name: 'Mega Stadium',
    mode: 'stadium',
    tier: 2,
    unlockStars: 15,
    config: {
      width: 1600,
      height: 700,
      groundY: 600,
      platforms: [
        { x: 150, y: 500, width: 120, height: 20 },
        { x: 400, y: 420, width: 120, height: 20 },
        { x: 650, y: 340, width: 120, height: 20 },
        { x: 900, y: 420, width: 120, height: 20 },
        { x: 1150, y: 500, width: 120, height: 20 },
      ],
      ramps: [
        { x: 50, y: 580, width: 120, height: 20, angle: 20 },
        { x: 550, y: 580, width: 120, height: 20, angle: 25 },
        { x: 1050, y: 580, width: 120, height: 20, angle: -20 },
      ],
      starPositions: [
        { x: 200, y: 400 },
        { x: 450, y: 320 },
        { x: 700, y: 240 },
        { x: 950, y: 320 },
        { x: 1200, y: 400 },
        { x: 600, y: 500 },
        { x: 800, y: 500 },
      ],
      obstacles: [
        { x: 300, y: 570, type: 'box' },
        { x: 500, y: 570, type: 'barrel' },
        { x: 700, y: 570, type: 'box' },
        { x: 900, y: 570, type: 'barrel' },
      ],
      challenges: [
        { type: 'collect', target: 7, timeLimit: 75 },
        { type: 'crush', target: 4, timeLimit: 60 },
      ],
    },
  },
  {
    id: 'stadium-advanced',
    name: 'Champion Arena',
    mode: 'stadium',
    tier: 3,
    unlockStars: 40,
    config: {
      width: 2000,
      height: 800,
      groundY: 700,
      platforms: [
        { x: 100, y: 600, width: 100, height: 20 },
        { x: 300, y: 500, width: 100, height: 20 },
        { x: 550, y: 400, width: 100, height: 20 },
        { x: 800, y: 300, width: 150, height: 20 },
        { x: 1050, y: 400, width: 100, height: 20 },
        { x: 1300, y: 500, width: 100, height: 20 },
        { x: 1550, y: 600, width: 100, height: 20 },
      ],
      ramps: [
        { x: 50, y: 680, width: 150, height: 20, angle: 25 },
        { x: 450, y: 680, width: 150, height: 20, angle: 30 },
        { x: 900, y: 680, width: 150, height: 20, angle: 30 },
        { x: 1400, y: 680, width: 150, height: 20, angle: -25 },
      ],
      starPositions: [
        { x: 150, y: 500 },
        { x: 350, y: 400 },
        { x: 600, y: 300 },
        { x: 875, y: 200 },
        { x: 1100, y: 300 },
        { x: 1350, y: 400 },
        { x: 1600, y: 500 },
        { x: 500, y: 600 },
        { x: 1000, y: 600 },
      ],
      obstacles: [
        { x: 250, y: 670, type: 'box' },
        { x: 650, y: 670, type: 'barrel' },
        { x: 750, y: 670, type: 'box' },
        { x: 1100, y: 670, type: 'barrel' },
        { x: 1250, y: 670, type: 'box' },
      ],
      challenges: [
        { type: 'collect', target: 9, timeLimit: 90 },
        { type: 'crush', target: 5, timeLimit: 75 },
      ],
    },
  },
];

// ============================================================
// Race Levels
// ============================================================

export const raceLevels: RaceLevel[] = [
  {
    id: 'race-oval',
    name: 'Starter Oval',
    mode: 'race',
    tier: 1,
    unlockStars: 0,
    config: {
      trackType: 'oval',
      laps: 2,
      aiCount: 2,
      trackWidth: 100,
      waypoints: [
        { x: 200, y: 400 },
        { x: 200, y: 200 },
        { x: 600, y: 200 },
        { x: 600, y: 400 },
      ],
      boostPads: [
        { x: 350, y: 180, width: 60, height: 40 },
        { x: 350, y: 380, width: 60, height: 40 },
      ],
    },
  },
  {
    id: 'race-figure8',
    name: 'Figure 8',
    mode: 'race',
    tier: 2,
    unlockStars: 20,
    config: {
      trackType: 'figure8',
      laps: 2,
      aiCount: 2,
      trackWidth: 90,
      waypoints: [
        { x: 150, y: 300 },
        { x: 300, y: 150 },
        { x: 450, y: 300 },
        { x: 300, y: 450 },
        { x: 450, y: 300 },
        { x: 600, y: 150 },
        { x: 750, y: 300 },
        { x: 600, y: 450 },
      ],
      boostPads: [
        { x: 280, y: 130, width: 60, height: 40 },
        { x: 580, y: 430, width: 60, height: 40 },
      ],
    },
  },
  {
    id: 'race-winding',
    name: 'Winding Road',
    mode: 'race',
    tier: 3,
    unlockStars: 45,
    config: {
      trackType: 'winding',
      laps: 2,
      aiCount: 3,
      trackWidth: 85,
      waypoints: [
        { x: 100, y: 500 },
        { x: 200, y: 300 },
        { x: 350, y: 400 },
        { x: 500, y: 200 },
        { x: 650, y: 350 },
        { x: 800, y: 150 },
        { x: 900, y: 400 },
        { x: 750, y: 500 },
        { x: 500, y: 550 },
        { x: 250, y: 550 },
      ],
      boostPads: [
        { x: 480, y: 180, width: 60, height: 40 },
        { x: 780, y: 130, width: 60, height: 40 },
        { x: 480, y: 530, width: 60, height: 40 },
      ],
    },
  },
  {
    id: 'race-stadium',
    name: 'Stadium Circuit',
    mode: 'race',
    tier: 4,
    unlockStars: 75,
    config: {
      trackType: 'stadium',
      laps: 3,
      aiCount: 3,
      trackWidth: 80,
      waypoints: [
        { x: 150, y: 550 },
        { x: 100, y: 350 },
        { x: 200, y: 150 },
        { x: 400, y: 100 },
        { x: 550, y: 200 },
        { x: 500, y: 400 },
        { x: 650, y: 500 },
        { x: 850, y: 400 },
        { x: 900, y: 200 },
        { x: 800, y: 100 },
        { x: 650, y: 150 },
        { x: 750, y: 300 },
        { x: 600, y: 550 },
        { x: 350, y: 550 },
      ],
      boostPads: [
        { x: 380, y: 80, width: 60, height: 40 },
        { x: 880, y: 180, width: 60, height: 40 },
        { x: 330, y: 530, width: 60, height: 40 },
      ],
    },
  },
];

// ============================================================
// Learning Levels
// ============================================================

export const learnLevels: LearnLevel[] = [
  // Number games
  {
    id: 'learn-number-crush',
    name: 'Number Crush',
    mode: 'learn',
    tier: 1,
    unlockStars: 0,
    config: {
      category: 'numbers',
      gameType: 'number-crush',
      promptCount: 10,
    },
  },
  {
    id: 'learn-count-trucks',
    name: 'Count the Trucks',
    mode: 'learn',
    tier: 1,
    unlockStars: 0,
    config: {
      category: 'numbers',
      gameType: 'count-trucks',
      promptCount: 10,
    },
  },
  {
    id: 'learn-number-order',
    name: 'Number Order',
    mode: 'learn',
    tier: 2,
    unlockStars: 5,
    config: {
      category: 'numbers',
      gameType: 'number-order',
      promptCount: 8,
    },
  },
  {
    id: 'learn-compare',
    name: 'Compare Numbers',
    mode: 'learn',
    tier: 2,
    unlockStars: 10,
    config: {
      category: 'numbers',
      gameType: 'compare',
      promptCount: 10,
    },
  },

  // Letter games
  {
    id: 'learn-letter-find',
    name: 'Letter Find',
    mode: 'learn',
    tier: 1,
    unlockStars: 0,
    config: {
      category: 'letters',
      gameType: 'letter-find',
      promptCount: 10,
    },
  },
  {
    id: 'learn-alphabet-road',
    name: 'Alphabet Road',
    mode: 'learn',
    tier: 2,
    unlockStars: 5,
    config: {
      category: 'letters',
      gameType: 'alphabet-road',
      promptCount: 26,
      timeLimit: 120,
    },
  },
  {
    id: 'learn-match-up',
    name: 'Match Up',
    mode: 'learn',
    tier: 2,
    unlockStars: 10,
    config: {
      category: 'letters',
      gameType: 'match-up',
      promptCount: 10,
    },
  },
  {
    id: 'learn-letter-sounds',
    name: 'Letter Sounds',
    mode: 'learn',
    tier: 3,
    unlockStars: 20,
    config: {
      category: 'letters',
      gameType: 'letter-sounds',
      promptCount: 10,
    },
  },

  // Math games
  {
    id: 'learn-addition',
    name: 'Addition Arena',
    mode: 'learn',
    tier: 2,
    unlockStars: 15,
    config: {
      category: 'math',
      gameType: 'addition',
      promptCount: 10,
    },
  },
  {
    id: 'learn-subtraction',
    name: 'Subtraction Stadium',
    mode: 'learn',
    tier: 2,
    unlockStars: 20,
    config: {
      category: 'math',
      gameType: 'subtraction',
      promptCount: 10,
    },
  },
  {
    id: 'learn-math-match',
    name: 'Math Match',
    mode: 'learn',
    tier: 3,
    unlockStars: 30,
    config: {
      category: 'math',
      gameType: 'math-match',
      promptCount: 8,
    },
  },
  {
    id: 'learn-number-bonds',
    name: 'Number Bonds',
    mode: 'learn',
    tier: 3,
    unlockStars: 35,
    config: {
      category: 'math',
      gameType: 'number-bonds',
      promptCount: 10,
    },
  },

  // Word games
  {
    id: 'learn-word-builder',
    name: 'Word Builder',
    mode: 'learn',
    tier: 2,
    unlockStars: 15,
    config: {
      category: 'words',
      gameType: 'word-builder',
      promptCount: 8,
    },
  },
  {
    id: 'learn-rhyme-race',
    name: 'Rhyme Race',
    mode: 'learn',
    tier: 3,
    unlockStars: 25,
    config: {
      category: 'words',
      gameType: 'rhyme-race',
      promptCount: 10,
    },
  },
  {
    id: 'learn-sight-words',
    name: 'Sight Words',
    mode: 'learn',
    tier: 2,
    unlockStars: 10,
    config: {
      category: 'words',
      gameType: 'sight-words',
      promptCount: 10,
    },
  },
  {
    id: 'learn-picture-match',
    name: 'Picture Match',
    mode: 'learn',
    tier: 1,
    unlockStars: 0,
    config: {
      category: 'words',
      gameType: 'picture-match',
      promptCount: 10,
    },
  },
];

// ============================================================
// Combined Levels
// ============================================================

export const allLevels: Level[] = [...stadiumLevels, ...raceLevels, ...learnLevels];

/**
 * Get a level by its ID
 */
export function getLevelById(id: string): Level | undefined {
  return allLevels.find((l) => l.id === id);
}

/**
 * Get all levels for a specific mode
 */
export function getLevelsByMode(mode: GameMode): Level[] {
  return allLevels.filter((l) => l.mode === mode);
}

/**
 * Get levels by tier
 */
export function getLevelsByTier(tier: number): Level[] {
  return allLevels.filter((l) => l.tier === tier);
}

/**
 * Get levels that are unlocked based on current stars
 */
export function getUnlockedLevels(currentStars: number): Level[] {
  return allLevels.filter((l) => l.unlockStars <= currentStars);
}

/**
 * Get the next level to unlock for a given mode
 */
export function getNextUnlockableLevel(mode: GameMode, currentStars: number): Level | undefined {
  const modeLevels = getLevelsByMode(mode)
    .filter((l) => l.unlockStars > currentStars)
    .sort((a, b) => a.unlockStars - b.unlockStars);

  return modeLevels[0];
}

/**
 * Get learning levels by category
 */
export function getLearnLevelsByCategory(category: LearnLevel['config']['category']): LearnLevel[] {
  return learnLevels.filter((l) => l.config.category === category);
}

/**
 * Check if a level is unlocked
 */
export function isLevelUnlocked(level: Level, currentStars: number): boolean {
  return level.unlockStars <= currentStars;
}
