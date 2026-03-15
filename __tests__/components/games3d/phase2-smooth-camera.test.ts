/**
 * Phase 2 Tests: Smooth Camera Behavior
 *
 * Validates velocity-based prediction, angular velocity clamping,
 * velocity dampening, speed-dependent offset, and smoothness prop usage.
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const GAMES3D = path.resolve(__dirname, '../../../components/games3d');

function readFile(name: string): string {
  return fs.readFileSync(path.join(GAMES3D, name), 'utf-8');
}

describe('Phase 2: Smooth camera behavior', () => {
  const followCamSrc = readFile('FollowCamera.tsx');
  const raceGameSrc = readFile('RaceGame3D.tsx');
  const stadiumSrc = readFile('StadiumGame3D.tsx');

  // ──────────────────────────────────────────────
  // Gap 1: speedRef prop available to camera
  // ──────────────────────────────────────────────

  describe('Gap 1 — Camera receives speed data', () => {
    it('FollowCamera interface includes speedRef prop', () => {
      expect(followCamSrc).toContain('speedRef?: React.RefObject<number>');
    });

    it('FollowCamera destructures speedRef from props', () => {
      expect(followCamSrc).toMatch(/speedRef[,\s]/);
    });

    it('RaceGame3D passes speedRef to FollowCamera', () => {
      expect(raceGameSrc).toContain('speedRef={speedRef}');
    });

    it('StadiumGame3D passes speedRef to FollowCamera', () => {
      expect(stadiumSrc).toContain('speedRef={speedRef}');
    });

    it('StadiumGame3D declares speedRef as a useRef', () => {
      expect(stadiumSrc).toMatch(/const speedRef\s*=\s*useRef/);
    });

    it('StadiumGame3D writes speed in handlePositionUpdate', () => {
      expect(stadiumSrc).toContain('speedRef.current = spd');
    });
  });

  // ──────────────────────────────────────────────
  // Gap 2: Velocity-based look-ahead prediction
  // ──────────────────────────────────────────────

  describe('Gap 2 — Velocity-based look-ahead', () => {
    it('computes a speedFactor from speedRef', () => {
      expect(followCamSrc).toContain('speedRef?.current');
      expect(followCamSrc).toMatch(/speedFactor\s*=\s*Math\.min\(speed\s*\/\s*60/);
    });

    it('dynamicLookAhead scales with speedFactor', () => {
      expect(followCamSrc).toContain('dynamicLookAhead');
      expect(followCamSrc).toMatch(/lookAhead\s*\*\s*\(/);
    });

    it('look-ahead is NOT a fixed constant (uses dynamicLookAhead)', () => {
      // The aheadX/aheadZ should use dynamicLookAhead, not plain lookAhead
      expect(followCamSrc).toContain('Math.sin(rotationY) * dynamicLookAhead');
      expect(followCamSrc).toContain('Math.cos(rotationY) * dynamicLookAhead');
    });
  });

  // ──────────────────────────────────────────────
  // Gap 3: Speed-dependent camera offset (pull-back)
  // ──────────────────────────────────────────────

  describe('Gap 3 — Speed-dependent camera pull-back', () => {
    it('computes speedPullBack from speedFactor', () => {
      expect(followCamSrc).toContain('speedPullBack');
      expect(followCamSrc).toMatch(/speedFactor\s*\*\s*\d/);
    });

    it('dynamicOffsetZ adjusts offset.z by speedPullBack', () => {
      expect(followCamSrc).toContain('dynamicOffsetZ');
      expect(followCamSrc).toContain('offset.z - speedPullBack');
    });

    it('behindX/behindZ use dynamicOffsetZ instead of raw offset.z', () => {
      expect(followCamSrc).toContain('Math.sin(rotationY) * dynamicOffsetZ');
      expect(followCamSrc).toContain('Math.cos(rotationY) * dynamicOffsetZ');
    });
  });

  // ──────────────────────────────────────────────
  // Gap 4: Camera velocity dampening
  // ──────────────────────────────────────────────

  describe('Gap 4 — Camera velocity dampening', () => {
    it('tracks camera velocity as a ref', () => {
      expect(followCamSrc).toMatch(/const cameraVelocity\s*=\s*useRef/);
    });

    it('tracks previous camera position as a ref', () => {
      expect(followCamSrc).toMatch(/const prevCameraPos\s*=\s*useRef/);
    });

    it('computes intended velocity from lerped position', () => {
      expect(followCamSrc).toContain('intendedVelX');
      expect(followCamSrc).toContain('intendedVelY');
      expect(followCamSrc).toContain('intendedVelZ');
    });

    it('smooths camera velocity with dampening factor (velDamp)', () => {
      expect(followCamSrc).toContain('velDamp');
      expect(followCamSrc).toContain('cameraVelocity.current.x +=');
    });

    it('applies dampened velocity instead of raw lerp', () => {
      expect(followCamSrc).toContain('prevCameraPos.current.x + cameraVelocity.current.x * delta');
    });

    it('stores current position for next frame', () => {
      expect(followCamSrc).toContain('prevCameraPos.current.copy(currentPosition.current)');
    });
  });

  // ──────────────────────────────────────────────
  // Gap 5: Angular velocity clamping
  // ──────────────────────────────────────────────

  describe('Gap 5 — Angular velocity clamping', () => {
    it('defines MAX_ANGULAR_VELOCITY constant', () => {
      expect(followCamSrc).toContain('MAX_ANGULAR_VELOCITY');
    });

    it('tracks smoothedRotationY as a ref', () => {
      expect(followCamSrc).toMatch(/const smoothedRotationY\s*=\s*useRef/);
    });

    it('computes angle difference with wrap-around handling', () => {
      expect(followCamSrc).toContain('angleDiff');
      expect(followCamSrc).toContain('Math.PI * 2');
    });

    it('clamps angular step to MAX_ANGULAR_VELOCITY * delta', () => {
      expect(followCamSrc).toContain('maxAngleStep');
      expect(followCamSrc).toContain('MAX_ANGULAR_VELOCITY * delta');
    });

    it('uses smoothedRotationY for camera calculations (not raw rotation)', () => {
      // After clamping, the smoothed value should be used
      expect(followCamSrc).toContain('const rotationY = smoothedRotationY.current');
    });
  });

  // ──────────────────────────────────────────────
  // Gap 6: smoothness prop is actually used
  // ──────────────────────────────────────────────

  describe('Gap 6 — smoothness prop drives interpolation', () => {
    it('posSmooth uses smoothness parameter (not hardcoded)', () => {
      // Should use the smoothness prop in Math.pow
      expect(followCamSrc).toMatch(/Math\.pow\(smoothness,\s*delta\)/);
    });

    it('lookSmooth derives from smoothness (e.g. smoothness * 0.5)', () => {
      expect(followCamSrc).toMatch(/Math\.pow\(smoothness\s*\*\s*[\d.]+,\s*delta\)/);
    });

    it('no hardcoded 0.08 or 0.04 in Math.pow calls for smoothing', () => {
      // The old hardcoded pattern should be gone
      const smoothingLines = followCamSrc.split('\n').filter(l =>
        l.includes('Math.pow') && (l.includes('posSmooth') || l.includes('lookSmooth'))
      );
      smoothingLines.forEach(line => {
        expect(line).toContain('smoothness');
      });
    });
  });

  // ──────────────────────────────────────────────
  // No regression: Phase 1 patterns still intact
  // ──────────────────────────────────────────────

  describe('No regression — Phase 1 patterns preserved', () => {
    it('FollowCamera still accepts targetRef as RefObject', () => {
      expect(followCamSrc).toContain('targetRef: React.RefObject<THREE.Vector3>');
    });

    it('FollowCamera still reads target from ref.current', () => {
      expect(followCamSrc).toContain('const target = targetRef.current');
    });

    it('Camera shake still works', () => {
      expect(followCamSrc).toContain('shakeTimeLeft');
      expect(followCamSrc).toContain('shakeIntensity');
    });

    it('RaceGame3D still passes targetRef and targetRotationRef', () => {
      expect(raceGameSrc).toContain('targetRef={truckPositionRef}');
      expect(raceGameSrc).toContain('targetRotationRef={truckRotationRef}');
    });

    it('StadiumGame3D still passes targetRef and targetRotationRef', () => {
      expect(stadiumSrc).toContain('targetRef={truckPositionRef}');
      expect(stadiumSrc).toContain('targetRotationRef={truckRotationRef}');
    });
  });
});
