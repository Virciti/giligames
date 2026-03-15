/**
 * Fashion Game Session Store
 *
 * Persists the fashion game session to sessionStorage so that
 * in-progress games survive page refreshes and brief navigation.
 * Cleared automatically when the browser tab closes.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  FashionPhase,
  FashionScenarioId,
  FashionChallengeType,
  OutfitCategory,
  OutfitJudgingResult,
} from '@/content/types';

export interface FashionSessionState {
  phase: FashionPhase;
  scenarioId: FashionScenarioId | null;
  fashionPoints: number;
  pointsEarned: number;
  equippedItems: Partial<Record<OutfitCategory, string>>;
  purchasedItems: string[];
  challengeType: FashionChallengeType | null;
  challengeTier: number;
  judgingResult: OutfitJudgingResult | null;
}

interface FashionGameActions {
  setPhase: (phase: FashionPhase) => void;
  startScenario: (scenarioId: FashionScenarioId) => void;
  earnPoints: (points: number) => void;
  purchaseItem: (itemId: string, cost: number) => void;
  equipItem: (category: OutfitCategory, itemId: string | null) => void;
  setChallengeTier: (tier: number) => void;
  setJudgingResult: (result: OutfitJudgingResult) => void;
  resetSession: () => void;
}

export type FashionGameStore = FashionSessionState & FashionGameActions;

const initialSession: FashionSessionState = {
  phase: 'scenario-select',
  scenarioId: null,
  fashionPoints: 0,
  pointsEarned: 0,
  equippedItems: {},
  purchasedItems: [],
  challengeType: null,
  challengeTier: 1,
  judgingResult: null,
};

const ssStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(name);
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(name, value);
  },
  removeItem: (name: string): void => {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(name);
  },
};

export const useFashionGameStore = create<FashionGameStore>()(
  persist(
    (set) => ({
      ...initialSession,

      setPhase: (phase) => set({ phase }),

      startScenario: (scenarioId) =>
        set({
          scenarioId,
          phase: 'challenge',
          fashionPoints: 0,
          pointsEarned: 0,
          equippedItems: {},
          purchasedItems: [],
          judgingResult: null,
        }),

      earnPoints: (points) =>
        set((state) => ({
          fashionPoints: state.fashionPoints + points,
          pointsEarned: state.pointsEarned + points,
        })),

      purchaseItem: (itemId, cost) =>
        set((state) => ({
          fashionPoints: state.fashionPoints - cost,
          purchasedItems: [...state.purchasedItems, itemId],
        })),

      equipItem: (category, itemId) =>
        set((state) => {
          const newEquipped = { ...state.equippedItems };
          if (itemId === null) {
            delete newEquipped[category];
          } else {
            newEquipped[category] = itemId;
            if (category === 'dress') {
              delete newEquipped.top;
              delete newEquipped.bottom;
            }
            if (category === 'top' || category === 'bottom') {
              delete newEquipped.dress;
            }
          }
          return { equippedItems: newEquipped };
        }),

      setChallengeTier: (tier) => set({ challengeTier: tier }),

      setJudgingResult: (result) =>
        set({ judgingResult: result, phase: 'results' }),

      resetSession: () => set(initialSession),
    }),
    {
      name: 'giigames-fashion-session',
      storage: createJSONStorage(() => ssStorage),
    }
  )
);
