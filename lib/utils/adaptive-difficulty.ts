/**
 * Adaptive difficulty system for GiiGames
 *
 * Automatically adjusts difficulty based on player performance
 * to maintain optimal challenge level for learning.
 */

// ============================================================
// Types
// ============================================================

export interface DifficultyMultiplier {
  /** Time limit in seconds for answering */
  timeLimit: number;
  /** Delay in milliseconds before showing hints */
  hintDelay: number;
}

export interface DifficultyConfig {
  /** Minimum difficulty level */
  minLevel: number;
  /** Maximum difficulty level */
  maxLevel: number;
  /** Number of correct answers needed to increase difficulty */
  correctStreakToIncrease: number;
  /** Number of wrong answers needed to decrease difficulty */
  wrongStreakToDecrease: number;
}

// ============================================================
// Constants
// ============================================================

/** Default difficulty configuration */
const DEFAULT_CONFIG: DifficultyConfig = {
  minLevel: 1,
  maxLevel: 5,
  correctStreakToIncrease: 3,
  wrongStreakToDecrease: 2,
};

/**
 * Difficulty multipliers for each level
 * Lower difficulty = more time and earlier hints
 */
const DIFFICULTY_MULTIPLIERS: Record<number, DifficultyMultiplier> = {
  1: { timeLimit: 30, hintDelay: 3000 },  // Easy: 30s, hint after 3s
  2: { timeLimit: 25, hintDelay: 5000 },  // Moderate: 25s, hint after 5s
  3: { timeLimit: 20, hintDelay: 7000 },  // Medium: 20s, hint after 7s
  4: { timeLimit: 15, hintDelay: 10000 }, // Hard: 15s, hint after 10s
  5: { timeLimit: 10, hintDelay: 15000 }, // Expert: 10s, hint after 15s
};

// ============================================================
// Core Difficulty Functions
// ============================================================

/**
 * Adjust difficulty based on recent performance
 *
 * Rules:
 * - Increase after 3 correct in a row (if < 5)
 * - Decrease after 2 wrong in a row (if > 1)
 *
 * @param currentDifficulty - Current difficulty level (1-5)
 * @param recentResults - Array of recent results (true = correct, false = wrong)
 * @param config - Optional custom configuration
 * @returns New difficulty level (1-5)
 */
export function adjustDifficulty(
  currentDifficulty: number,
  recentResults: boolean[],
  config: DifficultyConfig = DEFAULT_CONFIG
): number {
  // Validate current difficulty
  const difficulty = Math.max(
    config.minLevel,
    Math.min(config.maxLevel, currentDifficulty)
  );

  if (recentResults.length === 0) {
    return difficulty;
  }

  // Check for correct streak at the end (most recent results)
  const correctStreak = countTrailingStreak(recentResults, true);
  if (correctStreak >= config.correctStreakToIncrease && difficulty < config.maxLevel) {
    return difficulty + 1;
  }

  // Check for wrong streak at the end
  const wrongStreak = countTrailingStreak(recentResults, false);
  if (wrongStreak >= config.wrongStreakToDecrease && difficulty > config.minLevel) {
    return difficulty - 1;
  }

  return difficulty;
}

/**
 * Count consecutive matching values at the end of an array
 */
function countTrailingStreak(results: boolean[], targetValue: boolean): number {
  let count = 0;
  for (let i = results.length - 1; i >= 0; i--) {
    if (results[i] === targetValue) {
      count++;
    } else {
      break;
    }
  }
  return count;
}

/**
 * Get difficulty multipliers for a given level
 *
 * @param difficulty - Difficulty level (1-5)
 * @returns Object with timeLimit and hintDelay
 */
export function getDifficultyMultiplier(difficulty: number): DifficultyMultiplier {
  // Clamp difficulty to valid range
  const clampedDifficulty = Math.max(1, Math.min(5, Math.round(difficulty)));
  return { ...DIFFICULTY_MULTIPLIERS[clampedDifficulty] };
}

// ============================================================
// Advanced Difficulty Functions
// ============================================================

/**
 * Calculate suggested starting difficulty based on historical performance
 *
 * @param historicalAccuracy - Overall accuracy percentage (0-100)
 * @param totalAttempts - Total number of attempts
 * @returns Suggested starting difficulty (1-5)
 */
export function getSuggestedStartingDifficulty(
  historicalAccuracy: number,
  totalAttempts: number
): number {
  // New players start at difficulty 1
  if (totalAttempts < 10) {
    return 1;
  }

  // Map accuracy to difficulty
  if (historicalAccuracy >= 90) {
    return 4;
  } else if (historicalAccuracy >= 75) {
    return 3;
  } else if (historicalAccuracy >= 60) {
    return 2;
  } else {
    return 1;
  }
}

/**
 * Check if player is in "flow" state (optimal challenge level)
 * Flow occurs when difficulty matches skill level
 *
 * @param recentResults - Array of recent results
 * @param windowSize - Number of results to consider
 * @returns True if player appears to be in flow state
 */
export function isInFlowState(
  recentResults: boolean[],
  windowSize: number = 10
): boolean {
  if (recentResults.length < windowSize) {
    return false;
  }

  // Get the last N results
  const window = recentResults.slice(-windowSize);

  // Calculate accuracy in the window
  const correct = window.filter((r) => r).length;
  const accuracy = correct / windowSize;

  // Flow state: accuracy between 70-90% (challenging but achievable)
  return accuracy >= 0.7 && accuracy <= 0.9;
}

/**
 * Detect if player is frustrated (too many consecutive failures)
 *
 * @param recentResults - Array of recent results
 * @param threshold - Number of consecutive failures to trigger
 * @returns True if frustration is detected
 */
export function detectFrustration(
  recentResults: boolean[],
  threshold: number = 3
): boolean {
  return countTrailingStreak(recentResults, false) >= threshold;
}

/**
 * Detect if player is bored (too many consecutive successes with no challenge)
 *
 * @param recentResults - Array of recent results
 * @param threshold - Number of consecutive successes to trigger
 * @returns True if boredom is detected
 */
export function detectBoredom(
  recentResults: boolean[],
  threshold: number = 5
): boolean {
  return countTrailingStreak(recentResults, true) >= threshold;
}

/**
 * Get adaptive hint timing based on current performance
 * Struggling players get hints sooner
 *
 * @param difficulty - Current difficulty level
 * @param recentResults - Array of recent results
 * @returns Adjusted hint delay in milliseconds
 */
export function getAdaptiveHintDelay(
  difficulty: number,
  recentResults: boolean[]
): number {
  const baseDelay = getDifficultyMultiplier(difficulty).hintDelay;

  if (recentResults.length < 3) {
    return baseDelay;
  }

  // Get recent accuracy
  const recentWindow = recentResults.slice(-5);
  const recentAccuracy =
    recentWindow.filter((r) => r).length / recentWindow.length;

  // Reduce hint delay if struggling
  if (recentAccuracy < 0.4) {
    return Math.max(2000, baseDelay * 0.5); // 50% faster hints, minimum 2s
  } else if (recentAccuracy < 0.6) {
    return Math.max(3000, baseDelay * 0.75); // 25% faster hints, minimum 3s
  }

  return baseDelay;
}

/**
 * Get adaptive time limit based on current performance
 * Struggling players get more time
 *
 * @param difficulty - Current difficulty level
 * @param recentResults - Array of recent results
 * @returns Adjusted time limit in seconds
 */
export function getAdaptiveTimeLimit(
  difficulty: number,
  recentResults: boolean[]
): number {
  const baseTimeLimit = getDifficultyMultiplier(difficulty).timeLimit;

  if (recentResults.length < 3) {
    return baseTimeLimit;
  }

  // Get recent accuracy
  const recentWindow = recentResults.slice(-5);
  const recentAccuracy =
    recentWindow.filter((r) => r).length / recentWindow.length;

  // Increase time limit if struggling
  if (recentAccuracy < 0.4) {
    return Math.min(45, baseTimeLimit * 1.5); // 50% more time, max 45s
  } else if (recentAccuracy < 0.6) {
    return Math.min(35, baseTimeLimit * 1.25); // 25% more time, max 35s
  }

  return baseTimeLimit;
}

/**
 * Calculate overall session difficulty score
 * Useful for analytics and progress tracking
 *
 * @param results - All results from the session
 * @param startDifficulty - Difficulty at session start
 * @param endDifficulty - Difficulty at session end
 * @returns Score representing session challenge level (0-100)
 */
export function calculateSessionDifficultyScore(
  results: boolean[],
  startDifficulty: number,
  endDifficulty: number
): number {
  if (results.length === 0) {
    return 0;
  }

  // Base score from accuracy
  const accuracy = results.filter((r) => r).length / results.length;
  const accuracyScore = accuracy * 40;

  // Score from difficulty progression
  const difficultyProgression = endDifficulty - startDifficulty;
  const progressionScore = Math.max(0, Math.min(30, difficultyProgression * 15 + 15));

  // Score from average difficulty
  const avgDifficulty = (startDifficulty + endDifficulty) / 2;
  const difficultyScore = (avgDifficulty / 5) * 30;

  return Math.round(accuracyScore + progressionScore + difficultyScore);
}
