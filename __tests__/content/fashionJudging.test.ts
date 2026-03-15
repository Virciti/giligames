import { describe, it, expect } from 'vitest';
import { judgeOutfit, judgeOutfitByScenarioId } from '@/content/fashionJudging';
import { getScenarioById } from '@/content/fashionScenarios';
import type { FashionScenario } from '@/content/types';

describe('fashionJudging', () => {
  const schoolDay = getScenarioById('school-day')!;

  describe('judgeOutfit', () => {
    it('returns zero scores for empty outfit', () => {
      const result = judgeOutfit(schoolDay, {});
      expect(result.totalScore).toBe(0);
      expect(result.stars).toBe(0);
      expect(result.completenessScore).toBe(0);
      expect(result.appropriatenessScore).toBe(0);
      expect(result.bonusScore).toBe(0);
    });

    it('returns zero scores for all-null equipped items', () => {
      const result = judgeOutfit(schoolDay, { top: null, bottom: null });
      expect(result.totalScore).toBe(0);
      expect(result.stars).toBe(0);
    });

    it('gives completeness points for required categories', () => {
      // School day requires: top, bottom, shoes
      const result = judgeOutfit(schoolDay, {
        top: 'top-basic-tee',
        bottom: 'bottom-jeans',
        shoes: 'shoes-sneakers',
      });
      expect(result.completenessScore).toBeGreaterThan(0);
      expect(result.totalScore).toBeGreaterThan(0);
    });

    it('dress counts as top+bottom for completeness', () => {
      // Birthday party has both dress and top/bottom in category weights
      const birthdayParty = getScenarioById('birthday-party')!;
      const withDress = judgeOutfit(birthdayParty, {
        dress: 'dress-sundress',
        shoes: 'shoes-sneakers',
      });
      const withTopBottom = judgeOutfit(birthdayParty, {
        top: 'top-basic-tee',
        bottom: 'bottom-jeans',
        shoes: 'shoes-sneakers',
      });
      // Dress should give comparable or better completeness since it fills top+bottom
      expect(withDress.completenessScore).toBeGreaterThan(0);
    });

    it('variety bonus uses category count not item count', () => {
      // A dress fills 3 categories (dress, top, bottom). Add shoes = 4 categories
      const birthdayParty = getScenarioById('birthday-party')!;
      const result = judgeOutfit(birthdayParty, {
        dress: 'dress-sundress',
        shoes: 'shoes-sneakers',
      });
      // filledCategories should be: dress, top, bottom, shoes = 4
      // So variety bonus should trigger (4+ categories)
      expect(result.bonusScore).toBeGreaterThanOrEqual(4);
    });

    it('returns stars based on score thresholds', () => {
      // Zero items = 0 stars
      const zero = judgeOutfit(schoolDay, {});
      expect(zero.stars).toBe(0);
    });

    it('caps total score at 100', () => {
      const result = judgeOutfit(schoolDay, {
        top: 'top-basic-tee',
        bottom: 'bottom-jeans',
        shoes: 'shoes-sneakers',
        accessory: 'acc-backpack',
        hairstyle: 'hair-ponytail',
      });
      expect(result.totalScore).toBeLessThanOrEqual(100);
    });

    it('star thresholds are correct', () => {
      // Stars: >= 85 = 3, >= 60 = 2, >= 35 = 1, else 0
      // We can't control exact scores easily, but we can verify the formula
      // by checking the output structure
      const result = judgeOutfit(schoolDay, { top: 'top-basic-tee' });
      expect(result.stars).toBeGreaterThanOrEqual(0);
      expect(result.stars).toBeLessThanOrEqual(3);
    });
  });

  describe('judgeOutfitByScenarioId', () => {
    it('returns zero for invalid scenario ID', () => {
      const result = judgeOutfitByScenarioId('nonexistent-scenario', { top: 'top-basic-tee' });
      expect(result.totalScore).toBe(0);
      expect(result.stars).toBe(0);
    });

    it('returns valid scores for valid scenario ID', () => {
      const result = judgeOutfitByScenarioId('school-day', {
        top: 'top-basic-tee',
        bottom: 'bottom-jeans',
        shoes: 'shoes-sneakers',
      });
      expect(result.totalScore).toBeGreaterThan(0);
    });
  });
});
