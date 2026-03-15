import { describe, it, expect } from 'vitest';
import { scaledParticleCount, PARTICLE_SCALE, type QualityPreset } from '@/lib/utils/adaptive-quality';

describe('adaptive-quality', () => {
  describe('PARTICLE_SCALE', () => {
    it('has all quality presets defined', () => {
      expect(PARTICLE_SCALE.low).toBeDefined();
      expect(PARTICLE_SCALE.medium).toBeDefined();
      expect(PARTICLE_SCALE.high).toBeDefined();
      expect(PARTICLE_SCALE.ultra).toBeDefined();
    });

    it('scales increase from low to high', () => {
      expect(PARTICLE_SCALE.low).toBeLessThan(PARTICLE_SCALE.medium);
      expect(PARTICLE_SCALE.medium).toBeLessThan(PARTICLE_SCALE.high);
    });

    it('high and ultra have same scale', () => {
      expect(PARTICLE_SCALE.high).toBe(PARTICLE_SCALE.ultra);
    });
  });

  describe('scaledParticleCount', () => {
    it('returns base count at high quality', () => {
      expect(scaledParticleCount(50, 'high')).toBe(50);
    });

    it('returns reduced count at low quality', () => {
      expect(scaledParticleCount(50, 'low')).toBe(15); // 50 * 0.3 = 15
    });

    it('returns reduced count at medium quality', () => {
      expect(scaledParticleCount(50, 'medium')).toBe(30); // 50 * 0.6 = 30
    });

    it('enforces minimum of 4 particles', () => {
      expect(scaledParticleCount(1, 'low')).toBe(4); // 1 * 0.3 = 0.3, rounds to 0, clamped to 4
    });

    it('handles zero base count', () => {
      expect(scaledParticleCount(0, 'high')).toBe(4); // 0 clamped to 4
    });

    it('rounds to nearest integer', () => {
      expect(scaledParticleCount(30, 'medium')).toBe(18); // 30 * 0.6 = 18
      expect(scaledParticleCount(30, 'low')).toBe(9); // 30 * 0.3 = 9
    });

    const qualities: QualityPreset[] = ['low', 'medium', 'high', 'ultra'];
    for (const q of qualities) {
      it(`always returns at least 4 for quality="${q}"`, () => {
        expect(scaledParticleCount(1, q)).toBeGreaterThanOrEqual(4);
        expect(scaledParticleCount(10, q)).toBeGreaterThanOrEqual(4);
        expect(scaledParticleCount(100, q)).toBeGreaterThanOrEqual(4);
      });
    }
  });
});
