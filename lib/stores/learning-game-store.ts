/**
 * Learning Game Store - Zustand store for in-race learning challenge state
 *
 * Manages the educational coin collection mechanic: target selection,
 * scoring, streaks, timer, and category/tier progression.
 * Integrates with the player store for persistent mastery tracking.
 */

import { create } from 'zustand';
import { usePlayerStore } from './player-store';
import {
  getNumbersInRange,
  letters,
  getWordsUpToTier,
  getMathPromptsUpToTier,
  formatPrompt,
} from '@/content';
import type { NumberContent, Letter, SightWord, MathPrompt } from '@/content/types';

// ============================================================
// Types
// ============================================================

export type LearningCategory = 'numbers' | 'letters' | 'words' | 'math';

interface ChallengeTarget {
  display: string;   // What shows on the coin face
  itemId: string;    // For mastery tracking (e.g., 'number-5')
  answer?: number;   // For math: the correct answer
}

interface LearningChallengeState {
  isLearningActive: boolean;
  category: LearningCategory;
  currentTarget: string;
  currentTargetDisplay: string; // Banner text: "Catch all the 5's!"
  currentItemId: string;
  currentAnswer: number | null; // For math mode
  tier: number;

  correctCount: number;
  incorrectCount: number;
  streak: number;
  bestStreak: number;
  learningScore: number;

  targetChangeTimer: number;
  targetChangeDuration: number;
  challengeIndex: number;
}

interface LearningChallengeActions {
  startLearningChallenge: () => void;
  stopLearningChallenge: () => void;
  collectCorrect: (itemId: string) => void;
  collectIncorrect: (itemId: string) => void;
  advanceTarget: () => void;
  tickTimer: (delta: number) => void;
}

export type LearningChallengeStore = LearningChallengeState & LearningChallengeActions;

// ============================================================
// Constants
// ============================================================

const CORRECT_TO_ADVANCE = 5;
const ADVANCE_BONUS = 500;

const CATEGORY_ORDER: LearningCategory[] = ['numbers', 'letters', 'words', 'math'];

// ============================================================
// Helpers
// ============================================================

function getTimerDuration(tier: number): number {
  switch (tier) {
    case 1: return 150;
    case 2: return 135;
    case 3: return 120;
    case 4: return 105;
    case 5: return 90;
    default: return 150;
  }
}

function getNumberRange(tier: number): { min: number; max: number } {
  switch (tier) {
    case 1: return { min: 1, max: 5 };
    case 2: return { min: 1, max: 10 };
    case 3: return { min: 1, max: 15 };
    case 4:
    case 5: return { min: 1, max: 20 };
    default: return { min: 1, max: 5 };
  }
}

function getLetterPool(tier: number): Letter[] {
  switch (tier) {
    case 1: return letters.slice(0, 6);   // A-F
    case 2: return letters.slice(0, 13);  // A-M
    case 3: return letters.slice(0, 20);  // A-T
    case 4:
    case 5: return letters;               // A-Z
    default: return letters.slice(0, 6);
  }
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function selectTarget(category: LearningCategory, tier: number): ChallengeTarget {
  switch (category) {
    case 'numbers': {
      const range = getNumberRange(tier);
      const pool = getNumbersInRange(range.min, range.max);
      const picked = pickRandom(pool);
      return { display: String(picked.value), itemId: picked.id };
    }
    case 'letters': {
      const pool = getLetterPool(tier);
      const picked = pickRandom(pool);
      return { display: picked.uppercase, itemId: picked.id };
    }
    case 'words': {
      const pool = getWordsUpToTier(tier);
      if (pool.length === 0) return { display: 'the', itemId: 'word-the' };
      const picked = pickRandom(pool);
      return { display: picked.word, itemId: picked.id };
    }
    case 'math': {
      const pool = getMathPromptsUpToTier(tier);
      if (pool.length === 0) return { display: '1 + 1', itemId: 'math-addition-1-1', answer: 2 };
      const picked = pickRandom(pool);
      return {
        display: `${picked.operand1} ${picked.operation === 'addition' ? '+' : '-'} ${picked.operand2}`,
        itemId: picked.id,
        answer: picked.answer,
      };
    }
  }
}

function getBannerText(category: LearningCategory, target: string): string {
  switch (category) {
    case 'numbers': return `Catch all the ${target}'s!`;
    case 'letters': return `Find the letter ${target}!`;
    case 'words': return `Drive through "${target}"!`;
    case 'math': return `Solve: ${target}`;
  }
}

/**
 * Get distractors for the current target from the same category/tier
 */
export function getDistractors(
  target: string,
  category: LearningCategory,
  tier: number,
  answer: number | null
): string[] {
  switch (category) {
    case 'numbers': {
      const range = getNumberRange(tier);
      const pool = getNumbersInRange(range.min, range.max);
      return pool
        .filter((n) => String(n.value) !== target)
        .map((n) => String(n.value));
    }
    case 'letters': {
      const pool = getLetterPool(tier);
      return pool
        .filter((l) => l.uppercase !== target)
        .map((l) => l.uppercase);
    }
    case 'words': {
      const pool = getWordsUpToTier(tier);
      return pool
        .filter((w) => w.word !== target)
        .map((w) => w.word);
    }
    case 'math': {
      // For math, distractors are wrong answer numbers
      if (answer === null) return ['1', '2', '3', '4'];
      const distractors: string[] = [];
      const used = new Set<number>([answer]);
      // Add nearby numbers
      for (const offset of [1, -1, 2, -2, 3, -3, 4, -4, 5, -5]) {
        const val = answer + offset;
        if (val >= 0 && !used.has(val)) {
          used.add(val);
          distractors.push(String(val));
        }
      }
      return distractors;
    }
  }
}

/**
 * Determine the starting category and tier based on player's mastery data
 */
function determineStartingLevel(): { category: LearningCategory; tier: number } {
  const mastery = usePlayerStore.getState().learningMastery;

  // Check categories in order, find the most advanced one with data
  for (let catIdx = CATEGORY_ORDER.length - 1; catIdx >= 0; catIdx--) {
    const cat = CATEGORY_ORDER[catIdx];
    const categoryItems = Object.entries(mastery).filter(([key]) => {
      if (cat === 'numbers') return key.startsWith('number-');
      if (cat === 'letters') return key.startsWith('letter-');
      if (cat === 'words') return key.startsWith('word-');
      if (cat === 'math') return key.startsWith('math-');
      return false;
    });

    if (categoryItems.length > 0) {
      // Find the highest tier being worked on
      const avgDifficulty = categoryItems.reduce((sum, [, item]) => sum + item.difficulty, 0) / categoryItems.length;
      const tier = Math.max(1, Math.min(5, Math.round(avgDifficulty)));
      return { category: cat, tier };
    }
  }

  // New player: start with numbers tier 1
  return { category: 'numbers', tier: 1 };
}

// ============================================================
// Default State
// ============================================================

const defaultState: LearningChallengeState = {
  isLearningActive: false,
  category: 'numbers',
  currentTarget: '5',
  currentTargetDisplay: "Catch all the 5's!",
  currentItemId: 'number-5',
  currentAnswer: null,
  tier: 1,

  correctCount: 0,
  incorrectCount: 0,
  streak: 0,
  bestStreak: 0,
  learningScore: 0,

  targetChangeTimer: 150,
  targetChangeDuration: 150,
  challengeIndex: 0,
};

// ============================================================
// Store
// ============================================================

export const useLearningChallengeStore = create<LearningChallengeStore>()(
  (set, get) => ({
    ...defaultState,

    startLearningChallenge: () => {
      const { category, tier } = determineStartingLevel();
      const target = selectTarget(category, tier);
      const duration = getTimerDuration(tier);

      set({
        isLearningActive: true,
        category,
        tier,
        currentTarget: target.display,
        currentTargetDisplay: getBannerText(category, target.display),
        currentItemId: target.itemId,
        currentAnswer: target.answer ?? null,
        correctCount: 0,
        incorrectCount: 0,
        streak: 0,
        bestStreak: 0,
        learningScore: 0,
        targetChangeTimer: duration,
        targetChangeDuration: duration,
        challengeIndex: 0,
      });
    },

    stopLearningChallenge: () => {
      set({ isLearningActive: false });
    },

    collectCorrect: (itemId: string) => {
      const state = get();
      const newStreak = state.streak + 1;
      const points = 100 * newStreak;
      const newCorrect = state.correctCount + 1;

      set({
        correctCount: newCorrect,
        streak: newStreak,
        bestStreak: Math.max(state.bestStreak, newStreak),
        learningScore: state.learningScore + points,
      });

      // Update persistent mastery
      usePlayerStore.getState().updateMastery(itemId, true);

      // Auto-advance after collecting enough correct
      if (newCorrect >= CORRECT_TO_ADVANCE) {
        set((s) => ({ learningScore: s.learningScore + ADVANCE_BONUS }));
        get().advanceTarget();
      }
    },

    collectIncorrect: (itemId: string) => {
      set((state) => ({
        incorrectCount: state.incorrectCount + 1,
        streak: 0,
      }));

      // Update persistent mastery
      usePlayerStore.getState().updateMastery(itemId, false);
    },

    advanceTarget: () => {
      const state = get();
      let { category, tier } = state;

      // Check if we should advance tier or category based on mastery
      const mastery = usePlayerStore.getState().learningMastery;
      const shouldAdvance = checkMasteryAdvancement(category, tier, mastery);

      if (shouldAdvance) {
        if (tier < 5) {
          tier = tier + 1;
        } else {
          // Max tier, advance category
          const catIdx = CATEGORY_ORDER.indexOf(category);
          if (catIdx < CATEGORY_ORDER.length - 1) {
            category = CATEGORY_ORDER[catIdx + 1];
            tier = 1;
          }
          // If at max category + max tier, stay there
        }
      }

      const target = selectTarget(category, tier);
      const duration = getTimerDuration(tier);

      set({
        category,
        tier,
        currentTarget: target.display,
        currentTargetDisplay: getBannerText(category, target.display),
        currentItemId: target.itemId,
        currentAnswer: target.answer ?? null,
        correctCount: 0,
        targetChangeTimer: duration,
        targetChangeDuration: duration,
        challengeIndex: state.challengeIndex + 1,
      });
    },

    tickTimer: (delta: number) => {
      const state = get();
      if (!state.isLearningActive) return;

      const newTimer = state.targetChangeTimer - delta;
      if (newTimer <= 0) {
        get().advanceTarget();
      } else {
        set({ targetChangeTimer: newTimer });
      }
    },
  })
);

// ============================================================
// Mastery Check
// ============================================================

function checkMasteryAdvancement(
  category: LearningCategory,
  tier: number,
  mastery: Record<string, { attempts: number; correct: number; difficulty: number }>
): boolean {
  // Get all item IDs for current category/tier
  const itemIds = getCategoryItemIds(category, tier);
  if (itemIds.length === 0) return false;

  let totalAccuracy = 0;
  let itemsWithData = 0;

  for (const id of itemIds) {
    const m = mastery[id];
    if (m && m.attempts >= 3) {
      totalAccuracy += m.correct / m.attempts;
      itemsWithData++;
    }
  }

  // Need data on at least 50% of items, with 80% avg accuracy
  if (itemsWithData < itemIds.length * 0.5) return false;
  return (totalAccuracy / itemsWithData) >= 0.8;
}

function getCategoryItemIds(category: LearningCategory, tier: number): string[] {
  switch (category) {
    case 'numbers': {
      const range = getNumberRange(tier);
      return getNumbersInRange(range.min, range.max).map((n) => n.id);
    }
    case 'letters': {
      return getLetterPool(tier).map((l) => l.id);
    }
    case 'words': {
      return getWordsUpToTier(tier).map((w) => w.id);
    }
    case 'math': {
      return getMathPromptsUpToTier(tier).map((p) => p.id);
    }
  }
}
