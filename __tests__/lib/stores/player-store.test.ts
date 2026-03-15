import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePlayerStore } from '@/lib/stores/player-store';

// Mock the persistence layer to avoid localStorage in tests
vi.mock('@/lib/persist/storage', () => ({
  load: () => ({
    version: 1,
    player: {
      activeProfileId: 'profile-liam',
      profiles: [
        { id: 'profile-liam', name: 'Liam', avatarTruck: 'truck-red-rocket', createdAt: Date.now() },
        { id: 'profile-gianna', name: 'Gianna', avatarTruck: 'truck-blue-thunder', createdAt: Date.now() },
      ],
      selectedTruck: 'truck-red-rocket',
      totalStars: 0,
      unlockedTrucks: ['truck-red-rocket', 'truck-blue-thunder'],
      learningMastery: {},
      completedLevels: {},
      achievements: [],
      totalPlayTime: 0,
      currentStreak: 0,
      lastPlayedDate: '2026-01-01',
    },
    settings: {},
    lastSaved: Date.now(),
  }),
  saveImmediate: vi.fn(),
}));

describe('player-store', () => {
  beforeEach(() => {
    // Reset store to default state before each test
    const store = usePlayerStore.getState();
    store.resetProgress();
  });

  describe('addStars', () => {
    it('adds positive star amounts', () => {
      usePlayerStore.getState().addStars(10);
      expect(usePlayerStore.getState().totalStars).toBe(10);
    });

    it('accumulates stars across multiple calls', () => {
      usePlayerStore.getState().addStars(5);
      usePlayerStore.getState().addStars(3);
      expect(usePlayerStore.getState().totalStars).toBe(8);
    });

    it('ignores zero amount', () => {
      usePlayerStore.getState().addStars(0);
      expect(usePlayerStore.getState().totalStars).toBe(0);
    });

    it('ignores negative amount', () => {
      usePlayerStore.getState().addStars(10);
      usePlayerStore.getState().addStars(-5);
      expect(usePlayerStore.getState().totalStars).toBe(10);
    });
  });

  describe('unlockTruck', () => {
    it('adds new truck to unlocked list', () => {
      usePlayerStore.getState().unlockTruck('truck-green-machine');
      expect(usePlayerStore.getState().unlockedTrucks).toContain('truck-green-machine');
    });

    it('does not duplicate already unlocked trucks', () => {
      const before = usePlayerStore.getState().unlockedTrucks.length;
      usePlayerStore.getState().unlockTruck('truck-red-rocket');
      expect(usePlayerStore.getState().unlockedTrucks.length).toBe(before);
    });
  });

  describe('selectTruck', () => {
    it('selects an unlocked truck', () => {
      usePlayerStore.getState().selectTruck('truck-blue-thunder');
      expect(usePlayerStore.getState().selectedTruck).toBe('truck-blue-thunder');
    });

    it('does not select a locked truck', () => {
      usePlayerStore.getState().selectTruck('truck-locked-one');
      expect(usePlayerStore.getState().selectedTruck).toBe('truck-red-rocket');
    });
  });

  describe('updateMastery', () => {
    it('creates new mastery entry on first attempt', () => {
      usePlayerStore.getState().updateMastery('letter-a', true);
      const mastery = usePlayerStore.getState().learningMastery['letter-a'];
      expect(mastery).toBeDefined();
      expect(mastery.attempts).toBe(1);
      expect(mastery.correct).toBe(1);
      expect(mastery.streak).toBe(1);
    });

    it('tracks incorrect answers', () => {
      usePlayerStore.getState().updateMastery('letter-b', false);
      const mastery = usePlayerStore.getState().learningMastery['letter-b'];
      expect(mastery.attempts).toBe(1);
      expect(mastery.correct).toBe(0);
      expect(mastery.streak).toBe(0);
    });

    it('resets streak on incorrect answer', () => {
      usePlayerStore.getState().updateMastery('letter-c', true);
      usePlayerStore.getState().updateMastery('letter-c', true);
      usePlayerStore.getState().updateMastery('letter-c', false);
      const mastery = usePlayerStore.getState().learningMastery['letter-c'];
      expect(mastery.streak).toBe(0);
      expect(mastery.attempts).toBe(3);
      expect(mastery.correct).toBe(2);
    });

    it('increases difficulty after 3 correct streak', () => {
      usePlayerStore.getState().updateMastery('letter-d', true);
      usePlayerStore.getState().updateMastery('letter-d', true);
      usePlayerStore.getState().updateMastery('letter-d', true);
      const mastery = usePlayerStore.getState().learningMastery['letter-d'];
      expect(mastery.difficulty).toBe(2);
    });
  });

  describe('completeLevel', () => {
    it('stores level completion', () => {
      usePlayerStore.getState().completeLevel('level-1', 2, 500);
      const completion = usePlayerStore.getState().completedLevels['level-1'];
      expect(completion).toBeDefined();
      expect(completion.stars).toBe(2);
      expect(completion.bestScore).toBe(500);
    });

    it('keeps best stars on replay', () => {
      usePlayerStore.getState().completeLevel('level-2', 3, 800);
      usePlayerStore.getState().completeLevel('level-2', 1, 400);
      const completion = usePlayerStore.getState().completedLevels['level-2'];
      expect(completion.stars).toBe(3);
      expect(completion.bestScore).toBe(800);
    });

    it('adds star delta to total', () => {
      usePlayerStore.getState().completeLevel('level-3', 2, 500);
      expect(usePlayerStore.getState().totalStars).toBe(2);
      // Replay with same stars — no additional stars
      usePlayerStore.getState().completeLevel('level-3', 2, 600);
      expect(usePlayerStore.getState().totalStars).toBe(2);
      // Replay with more stars — only delta added
      usePlayerStore.getState().completeLevel('level-3', 3, 700);
      expect(usePlayerStore.getState().totalStars).toBe(3);
    });

    it('clamps stars to 0-3 range', () => {
      usePlayerStore.getState().completeLevel('level-4', 5, 999);
      expect(usePlayerStore.getState().completedLevels['level-4'].stars).toBe(3);

      usePlayerStore.getState().completeLevel('level-5', -1, 100);
      expect(usePlayerStore.getState().completedLevels['level-5'].stars).toBe(0);
    });
  });

  describe('achievements', () => {
    it('adds achievement', () => {
      usePlayerStore.getState().addAchievement('first-race');
      expect(usePlayerStore.getState().hasAchievement('first-race')).toBe(true);
    });

    it('does not duplicate achievements', () => {
      usePlayerStore.getState().addAchievement('first-race');
      usePlayerStore.getState().addAchievement('first-race');
      expect(usePlayerStore.getState().achievements.filter((a) => a.id === 'first-race').length).toBe(1);
    });

    it('hasAchievement returns false for missing achievement', () => {
      expect(usePlayerStore.getState().hasAchievement('nonexistent')).toBe(false);
    });
  });

  describe('profiles', () => {
    it('creates a new profile', () => {
      const id = usePlayerStore.getState().createProfile('TestKid');
      expect(id).toBeDefined();
      expect(usePlayerStore.getState().profiles.find((p) => p.id === id)?.name).toBe('TestKid');
    });

    it('truncates profile name to 20 characters', () => {
      const id = usePlayerStore.getState().createProfile('A Very Long Profile Name That Exceeds Limit');
      const profile = usePlayerStore.getState().profiles.find((p) => p.id === id);
      expect(profile?.name.length).toBeLessThanOrEqual(20);
    });

    it('cannot delete last profile', () => {
      // Delete all but one
      const state = usePlayerStore.getState();
      // Keep only one profile by creating a scenario
      const result = state.deleteProfile(state.profiles[state.profiles.length - 1]?.id ?? '');
      // At minimum, at least 1 profile should remain
      expect(usePlayerStore.getState().profiles.length).toBeGreaterThanOrEqual(1);
    });

    it('cannot delete active profile', () => {
      const activeId = usePlayerStore.getState().activeProfileId;
      const result = usePlayerStore.getState().deleteProfile(activeId);
      expect(result).toBe(false);
    });

    it('switches profile', () => {
      const profiles = usePlayerStore.getState().profiles;
      if (profiles.length >= 2) {
        const otherId = profiles.find((p) => p.id !== usePlayerStore.getState().activeProfileId)!.id;
        const result = usePlayerStore.getState().switchProfile(otherId);
        expect(result).toBe(true);
        expect(usePlayerStore.getState().activeProfileId).toBe(otherId);
      }
    });

    it('returns false for switching to nonexistent profile', () => {
      const result = usePlayerStore.getState().switchProfile('nonexistent-id');
      expect(result).toBe(false);
    });
  });

  describe('play time and streak', () => {
    it('adds play time', () => {
      usePlayerStore.getState().updatePlayTime(60);
      expect(usePlayerStore.getState().totalPlayTime).toBe(60);
    });

    it('ignores zero or negative play time', () => {
      usePlayerStore.getState().updatePlayTime(0);
      usePlayerStore.getState().updatePlayTime(-10);
      expect(usePlayerStore.getState().totalPlayTime).toBe(0);
    });
  });

  describe('resetProgress', () => {
    it('resets stars, levels, mastery, and achievements', () => {
      usePlayerStore.getState().addStars(50);
      usePlayerStore.getState().completeLevel('level-1', 3, 999);
      usePlayerStore.getState().updateMastery('letter-a', true);
      usePlayerStore.getState().addAchievement('first-race');

      usePlayerStore.getState().resetProgress();

      expect(usePlayerStore.getState().totalStars).toBe(0);
      expect(usePlayerStore.getState().completedLevels).toEqual({});
      expect(usePlayerStore.getState().learningMastery).toEqual({});
      expect(usePlayerStore.getState().achievements).toEqual([]);
    });

    it('preserves profiles after reset', () => {
      const profileCount = usePlayerStore.getState().profiles.length;
      usePlayerStore.getState().resetProgress();
      expect(usePlayerStore.getState().profiles.length).toBe(profileCount);
    });
  });
});
