/**
 * Phase 3 Tests: Stabilize Physics Output
 *
 * Validates gentler ground height lerp, smooth boundary corrections,
 * aligned gravity constants, AI truck smoothing, and frame-rate independent friction.
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const GAMES3D = path.resolve(__dirname, '../../../components/games3d');

function readFile(name: string): string {
  return fs.readFileSync(path.join(GAMES3D, name), 'utf-8');
}

describe('Phase 3: Stabilize physics output', () => {
  const monsterTruckSrc = readFile('MonsterTruck.tsx');
  const aiTruckSrc = readFile('AITruck.tsx');
  const scene3dSrc = readFile('Scene3D.tsx');

  // ──────────────────────────────────────────────
  // Gap 1: Ground height lerp reduced from 12/s to 4/s
  // ──────────────────────────────────────────────

  describe('Gap 1 — Gentler ground height lerp', () => {
    it('jump mode lerp speed is 4 (not 12)', () => {
      expect(monsterTruckSrc).toContain('const lerpSpeed = 4');
    });

    it('race mode lerp uses 4 * delta (not 12 * delta)', () => {
      expect(monsterTruckSrc).toContain('Math.min(1, 4 * delta)');
    });

    it('no references to old 12/s lerp in ground height code', () => {
      // Should NOT have 12 * delta for ground height anymore
      const groundHeightLines = monsterTruckSrc.split('\n').filter(l =>
        l.includes('smoothGroundHeight') && l.includes('* delta')
      );
      groundHeightLines.forEach(line => {
        expect(line).not.toContain('12 *');
      });
    });
  });

  // ──────────────────────────────────────────────
  // Gap 2: Smooth boundary corrections (no hard clamp)
  // ──────────────────────────────────────────────

  describe('Gap 2 — Smooth boundary push-back', () => {
    it('jump mode uses smooth push-back (overX pattern)', () => {
      expect(monsterTruckSrc).toContain('overX');
      expect(monsterTruckSrc).toContain('pushBack');
    });

    it('jump mode boundary does NOT hard-clamp X position', () => {
      // Old pattern: finalX = Math.sign(finalX) * arenaHalfWidth
      expect(monsterTruckSrc).not.toContain('finalX = Math.sign(finalX) * arenaHalfWidth');
    });

    it('jump mode boundary does NOT hard-clamp Z position', () => {
      expect(monsterTruckSrc).not.toContain('finalZ = Math.sign(finalZ) * arenaHalfLength');
    });

    it('radial boundary uses smooth push-back (not direct snap)', () => {
      // Should interpolate toward boundary, not snap
      expect(monsterTruckSrc).toContain('targetX - finalX');
      expect(monsterTruckSrc).toContain('targetZ - finalZ');
    });

    it('radial boundary does NOT directly assign cos/sin * maxArenaDistance', () => {
      // Old pattern: finalX = Math.cos(angle) * maxArenaDistance;
      // Should now use interpolation
      expect(monsterTruckSrc).not.toMatch(/finalX = Math\.cos\(angle\) \* maxArenaDistance;/);
    });
  });

  // ──────────────────────────────────────────────
  // Gap 3: Gravity constants aligned
  // ──────────────────────────────────────────────

  describe('Gap 3 — Gravity constants aligned', () => {
    it('MonsterTruck GRAVITY is 25 (reduced from 30)', () => {
      expect(monsterTruckSrc).toMatch(/const GRAVITY = 25/);
    });

    it('Scene3D Physics gravity matches at -25', () => {
      expect(scene3dSrc).toContain('gravity={[0, -25, 0]}');
    });

    it('MonsterTruck and Scene3D gravity values are consistent', () => {
      const truckGravity = monsterTruckSrc.match(/const GRAVITY = (\d+)/);
      const sceneGravity = scene3dSrc.match(/gravity=\{\[0, -(\d+), 0\]\}/);
      expect(truckGravity).toBeTruthy();
      expect(sceneGravity).toBeTruthy();
      expect(truckGravity![1]).toBe(sceneGravity![1]);
    });
  });

  // ──────────────────────────────────────────────
  // Gap 4: AITruck smooth ground height
  // ──────────────────────────────────────────────

  describe('Gap 4 — AITruck smooth terrain following', () => {
    it('AITruck has smoothGroundHeight ref', () => {
      expect(aiTruckSrc).toMatch(/const smoothGroundHeight\s*=\s*useRef/);
    });

    it('AITruck lerps ground height (not direct snap)', () => {
      expect(aiTruckSrc).toContain('THREE.MathUtils.lerp');
      expect(aiTruckSrc).toContain('smoothGroundHeight.current');
    });

    it('AITruck uses same 4/s lerp rate as MonsterTruck', () => {
      expect(aiTruckSrc).toContain('4 * delta');
    });

    it('AITruck applies smoothed height to position', () => {
      expect(aiTruckSrc).toContain('y: smoothGroundHeight.current');
    });

    it('AITruck position uses smoothed height (not raw getRaceTrackHeight)', () => {
      // The setTranslation call should use smoothGroundHeight.current, not getRaceTrackHeight directly
      expect(aiTruckSrc).toMatch(/setTranslation.*smoothGroundHeight\.current/);
    });
  });

  // ──────────────────────────────────────────────
  // Gap 5: Frame-rate independent friction
  // ──────────────────────────────────────────────

  describe('Gap 5 — Frame-rate independent friction', () => {
    it('spin decay uses Math.pow for frame-rate independence', () => {
      expect(monsterTruckSrc).toContain('Math.pow(0.92, delta * 60)');
    });

    it('coasting friction uses Math.pow(FRICTION, delta * 60)', () => {
      expect(monsterTruckSrc).toContain('Math.pow(FRICTION, delta * 60)');
    });

    it('mud pit uses Math.pow for frame-rate independence', () => {
      expect(monsterTruckSrc).toContain('Math.pow(0.96, delta * 60)');
    });

    it('boundary speed penalties use Math.pow for frame-rate independence', () => {
      // Both jump arena and radial boundary should use Math.pow
      const boundaryLines = monsterTruckSrc.split('\n').filter(l =>
        l.includes('currentSpeed.current *=') && l.includes('Math.pow(0.')
      );
      expect(boundaryLines.length).toBeGreaterThanOrEqual(3);
    });
  });

  // ──────────────────────────────────────────────
  // No regression: core physics still works
  // ──────────────────────────────────────────────

  describe('No regression — core physics preserved', () => {
    it('MonsterTruck still has vertical velocity and airborne detection', () => {
      expect(monsterTruckSrc).toContain('verticalVelocity');
      expect(monsterTruckSrc).toContain('isAirborne');
    });

    it('MonsterTruck still applies gravity with delta time', () => {
      expect(monsterTruckSrc).toContain('verticalVelocity.current -= GRAVITY * delta');
    });

    it('MonsterTruck still has smoothGroundHeight lerp', () => {
      expect(monsterTruckSrc).toContain('smoothGroundHeight.current');
    });

    it('race mode track boundary still uses gentle push (not hard clamp)', () => {
      expect(monsterTruckSrc).toContain('pushStrength');
      expect(monsterTruckSrc).toContain('KID-FRIENDLY track boundaries');
    });

    it('AITruck still uses getRaceTrackHeight for target height', () => {
      expect(aiTruckSrc).toContain('getRaceTrackHeight(newX, newZ)');
    });
  });
});
