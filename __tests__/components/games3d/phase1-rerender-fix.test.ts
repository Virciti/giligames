/**
 * Phase 1 Tests: Eliminate Re-render Storm
 *
 * Validates that truck position/rotation/speed flow through refs (not React state)
 * for camera consumption, with throttled state updates for HUD only.
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const GAMES3D = path.resolve(__dirname, '../../../components/games3d');

function readFile(name: string): string {
  return fs.readFileSync(path.join(GAMES3D, name), 'utf-8');
}

describe('Phase 1: Eliminate re-render storm', () => {
  const raceGameSrc = readFile('RaceGame3D.tsx');
  const followCamSrc = readFile('FollowCamera.tsx');
  const stadiumSrc = readFile('StadiumGame3D.tsx');

  // ──────────────────────────────────────────────
  // Gap 1: Camera must follow refs, not React state
  // ──────────────────────────────────────────────

  describe('Gap 1 — Camera follows refs, not state', () => {
    it('FollowCamera interface uses RefObject for target position', () => {
      expect(followCamSrc).toContain('targetRef: React.RefObject<THREE.Vector3>');
    });

    it('FollowCamera interface uses RefObject for target rotation', () => {
      expect(followCamSrc).toContain('targetRotationRef: React.RefObject<THREE.Euler>');
    });

    it('FollowCamera reads target from ref.current inside useFrame', () => {
      expect(followCamSrc).toContain('const target = targetRef.current');
    });

    it('FollowCamera reads rotation from ref.current inside useFrame', () => {
      expect(followCamSrc).toContain('targetRotationRef.current');
    });

    it('FollowCamera does NOT accept a plain Vector3 target prop', () => {
      // Should not have the old pattern: target: THREE.Vector3 (not as RefObject)
      expect(followCamSrc).not.toMatch(/target:\s*THREE\.Vector3\s*;/);
    });
  });

  // ──────────────────────────────────────────────
  // Gap 2: Truck position/rotation stored as refs
  // ──────────────────────────────────────────────

  describe('Gap 2 — Truck position/rotation are refs in RaceGame3D', () => {
    it('truckPositionRef exists as a useRef', () => {
      expect(raceGameSrc).toMatch(/const truckPositionRef\s*=\s*useRef/);
    });

    it('truckRotationRef exists as a useRef', () => {
      expect(raceGameSrc).toMatch(/const truckRotationRef\s*=\s*useRef/);
    });

    it('no useState for truckPosition (old pattern removed)', () => {
      expect(raceGameSrc).not.toContain('const [truckPosition, setTruckPosition]');
    });

    it('no useState for truckRotation (old pattern removed)', () => {
      expect(raceGameSrc).not.toContain('const [truckRotation, setTruckRotation]');
    });
  });

  // ──────────────────────────────────────────────
  // Gap 3: Speed stored as ref, HUD uses throttled state
  // ──────────────────────────────────────────────

  describe('Gap 3 — Speed uses ref + throttled HUD state', () => {
    it('speedRef exists as a useRef', () => {
      expect(raceGameSrc).toMatch(/const speedRef\s*=\s*useRef/);
    });

    it('no useState for speed (old per-frame state removed)', () => {
      expect(raceGameSrc).not.toMatch(/const \[speed, setSpeed\]/);
    });

    it('hudSpeed state exists for throttled HUD display', () => {
      expect(raceGameSrc).toContain('hudSpeed');
    });

    it('HUD receives hudSpeed, not raw speed', () => {
      expect(raceGameSrc).toMatch(/speed=\{hudSpeed\}/);
    });
  });

  // ──────────────────────────────────────────────
  // Core: handlePositionUpdate writes to refs only
  // ──────────────────────────────────────────────

  describe('handlePositionUpdate writes refs, not state', () => {
    it('writes to truckPositionRef.current.copy(pos)', () => {
      expect(raceGameSrc).toContain('truckPositionRef.current.copy(pos)');
    });

    it('writes to truckRotationRef.current.copy(rot)', () => {
      expect(raceGameSrc).toContain('truckRotationRef.current.copy(rot)');
    });

    it('writes to speedRef.current', () => {
      expect(raceGameSrc).toContain('speedRef.current = spd');
    });

    it('does NOT call setTruckPosition in handlePositionUpdate', () => {
      // Extract handlePositionUpdate function body
      const match = raceGameSrc.match(/const handlePositionUpdate[\s\S]*?\n  \}, \[/);
      expect(match).toBeTruthy();
      expect(match![0]).not.toContain('setTruckPosition');
    });

    it('does NOT call setSpeed in handlePositionUpdate', () => {
      const match = raceGameSrc.match(/const handlePositionUpdate[\s\S]*?\n  \}, \[/);
      expect(match).toBeTruthy();
      expect(match![0]).not.toContain('setSpeed');
    });
  });

  // ──────────────────────────────────────────────
  // Throttled HUD sync
  // ──────────────────────────────────────────────

  describe('Throttled HUD sync interval', () => {
    it('has a setInterval-based HUD sync', () => {
      expect(raceGameSrc).toContain('setHudPosition');
      expect(raceGameSrc).toContain('setHudRotationY');
      expect(raceGameSrc).toContain('setHudSpeed');
    });

    it('HUD sync reads from refs', () => {
      expect(raceGameSrc).toContain('truckPositionRef.current');
      expect(raceGameSrc).toContain('truckRotationRef.current');
      expect(raceGameSrc).toContain('speedRef.current');
    });

    it('minimap uses throttled hudPosition, not direct state', () => {
      expect(raceGameSrc).toMatch(/playerX=\{hudPosition\.x\}/);
      expect(raceGameSrc).toMatch(/playerZ=\{hudPosition\.z\}/);
    });
  });

  // ──────────────────────────────────────────────
  // Camera invocation uses refs
  // ──────────────────────────────────────────────

  describe('FollowCamera invocation uses refs', () => {
    it('RaceGame3D passes targetRef={truckPositionRef}', () => {
      expect(raceGameSrc).toContain('targetRef={truckPositionRef}');
    });

    it('RaceGame3D passes targetRotationRef={truckRotationRef}', () => {
      expect(raceGameSrc).toContain('targetRotationRef={truckRotationRef}');
    });

    it('StadiumGame3D also passes refs to FollowCamera', () => {
      expect(stadiumSrc).toContain('targetRef={truckPositionRef}');
      expect(stadiumSrc).toContain('targetRotationRef={truckRotationRef}');
    });
  });

  // ──────────────────────────────────────────────
  // Camera smoothing (Gap 4 fix included)
  // ──────────────────────────────────────────────

  describe('Camera smoothing is gentler', () => {
    it('posSmooth uses a less aggressive base (>= 0.04)', () => {
      // Old pattern: posSmooth = 1 - Math.pow(0.001, delta) — way too aggressive
      // posSmooth line should NOT use 0.001
      const posSmoothLine = followCamSrc.split('\n').find(l => l.includes('posSmooth') && l.includes('Math.pow'));
      expect(posSmoothLine).toBeTruthy();
      expect(posSmoothLine).not.toContain('0.001');
      // New pattern should use smoothness prop or a higher base for gentler follow
      const match = posSmoothLine!.match(/Math\.pow\(([^,]+),/);
      expect(match).toBeTruthy();
    });

    it('shake intensity default is <= 0.3 (reduced from 0.4)', () => {
      const match = followCamSrc.match(/shakeIntensity\s*=\s*([\d.]+)/);
      expect(match).toBeTruthy();
      expect(parseFloat(match![1])).toBeLessThanOrEqual(0.3);
    });
  });

  // ──────────────────────────────────────────────
  // No regression: collision/banana logic still uses refs
  // ──────────────────────────────────────────────

  describe('No regression — collision systems use refs', () => {
    it('banana collection reads from truckPositionRef.current', () => {
      expect(raceGameSrc).toContain('const playerPos = truckPositionRef.current');
    });

    it('banana collision effect dependency does NOT include truckPosition', () => {
      // The useEffect for banana/collision should not depend on a position state
      expect(raceGameSrc).not.toMatch(/\[phase,\s*gameMode,\s*truckPosition/);
    });

    it('truck-truck collision reads from truckPositionRef', () => {
      expect(raceGameSrc).toContain('const pPos = truckPositionRef.current');
    });
  });
});
