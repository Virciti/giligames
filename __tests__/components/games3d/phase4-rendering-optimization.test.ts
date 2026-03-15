/**
 * Phase 4 Tests: Optimize Rendering Pipeline
 *
 * Validates React.memo usage, memoized props, stable callbacks,
 * throttled AI positions, and eliminated inline allocations.
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const GAMES3D = path.resolve(__dirname, '../../../components/games3d');

function readFile(name: string): string {
  return fs.readFileSync(path.join(GAMES3D, name), 'utf-8');
}

describe('Phase 4: Optimize rendering pipeline', () => {
  const raceGameSrc = readFile('RaceGame3D.tsx');
  const raceHudSrc = readFile('RaceHUD3D.tsx');
  const stadiumSrc = readFile('StadiumGame3D.tsx');

  // ──────────────────────────────────────────────
  // Gap 1: RaceHUD3D wrapped in React.memo
  // ──────────────────────────────────────────────

  describe('Gap 1 — RaceHUD3D memoized', () => {
    it('imports memo from React', () => {
      expect(raceHudSrc).toMatch(/import\s*\{[^}]*memo[^}]*\}\s*from\s*'react'/);
    });

    it('RaceHUD3D is wrapped in memo()', () => {
      expect(raceHudSrc).toMatch(/export const RaceHUD3D = memo\(/);
    });

    it('default export is the memoized component', () => {
      expect(raceHudSrc).toContain('export default RaceHUD3D');
    });
  });

  // ──────────────────────────────────────────────
  // Gap 2: Minimap sub-component memoized
  // ──────────────────────────────────────────────

  describe('Gap 2 — Minimap memoized', () => {
    it('Minimap is wrapped in memo()', () => {
      expect(raceHudSrc).toMatch(/const Minimap = memo\(/);
    });
  });

  // ──────────────────────────────────────────────
  // Gap 3: aiPositions throttled (not inline map)
  // ──────────────────────────────────────────────

  describe('Gap 3 — AI positions throttled via state', () => {
    it('hudAiPositions state exists', () => {
      expect(raceGameSrc).toContain('hudAiPositions');
    });

    it('AI positions are synced in the hudSync interval', () => {
      expect(raceGameSrc).toContain('setHudAiPositions');
    });

    it('RaceHUD3D receives hudAiPositions (not inline .map())', () => {
      expect(raceGameSrc).toContain('aiPositions={hudAiPositions}');
    });

    it('no inline aiPositionsRef.current.map() in JSX', () => {
      // The old pattern should be gone from JSX props
      const jsxLines = raceGameSrc.split('\n').filter(l =>
        l.includes('aiPositions={') && l.includes('.map(')
      );
      expect(jsxLines.length).toBe(0);
    });

    it('AI_COLORS is a stable ref (not recreated each render)', () => {
      expect(raceGameSrc).toContain('AI_COLORS');
      expect(raceGameSrc).toMatch(/useRef\(\[.*#228B22/);
    });
  });

  // ──────────────────────────────────────────────
  // Gap 4: handlePositionUpdate no longer depends on raceTime
  // ──────────────────────────────────────────────

  describe('Gap 4 — Stable handlePositionUpdate callback', () => {
    it('raceTimeRef exists alongside raceTime state', () => {
      expect(raceGameSrc).toMatch(/const raceTimeRef\s*=\s*useRef/);
    });

    it('raceTimeRef is synced in the timer interval', () => {
      expect(raceGameSrc).toContain('raceTimeRef.current = next');
    });

    it('handlePositionUpdate reads raceTimeRef (not raceTime state)', () => {
      expect(raceGameSrc).toContain('const now = raceTimeRef.current');
    });

    it('handlePositionUpdate dependency array does NOT include raceTime', () => {
      const match = raceGameSrc.match(/handlePositionUpdate[\s\S]*?\}, \[([^\]]*)\]/);
      expect(match).toBeTruthy();
      expect(match![1]).not.toContain('raceTime');
    });

    it('position ranking useEffect does NOT depend on raceTime', () => {
      // Find the position ranking useEffect by its setPosition call
      const posEffectMatch = raceGameSrc.match(/setPosition\(playerPosition\)[\s\S]*?\}, \[([^\]]*)\]/);
      expect(posEffectMatch).toBeTruthy();
      expect(posEffectMatch![1]).not.toContain('raceTime');
    });
  });

  // ──────────────────────────────────────────────
  // Gap 5: StadiumGame3D inline allocations eliminated
  // ──────────────────────────────────────────────

  describe('Gap 5 — StadiumGame3D stable constants', () => {
    it('camera offset is a module-level constant (not inline new THREE.Vector3)', () => {
      expect(stadiumSrc).toContain('STADIUM_CAMERA_OFFSET');
      expect(stadiumSrc).toContain('offset={STADIUM_CAMERA_OFFSET}');
    });

    it('no inline "new THREE.Vector3" in FollowCamera JSX', () => {
      // Should not have: offset={new THREE.Vector3(
      const followCamJsx = stadiumSrc.split('\n').filter(l =>
        l.includes('offset={') && l.includes('new THREE')
      );
      expect(followCamJsx.length).toBe(0);
    });

    it('starPositions is a module-level constant', () => {
      expect(stadiumSrc).toContain('STADIUM_STAR_POSITIONS');
    });
  });

  // ──────────────────────────────────────────────
  // Gap 6: raceTimeRef reset on restart
  // ──────────────────────────────────────────────

  describe('Gap 6 — raceTimeRef lifecycle', () => {
    it('raceTimeRef is reset to 0 in handleRestart', () => {
      expect(raceGameSrc).toContain('raceTimeRef.current = 0');
    });
  });

  // ──────────────────────────────────────────────
  // No regression: HUD still works, Phase 1-3 intact
  // ──────────────────────────────────────────────

  describe('No regression — core functionality preserved', () => {
    it('RaceHUD3D still accepts all required props', () => {
      expect(raceHudSrc).toContain('speed: number');
      expect(raceHudSrc).toContain('position: number');
      expect(raceHudSrc).toContain('onPause: () => void');
    });

    it('throttled HUD sync still runs at 100ms', () => {
      expect(raceGameSrc).toContain('}, 100)');
      expect(raceGameSrc).toContain('setHudPosition');
      expect(raceGameSrc).toContain('setHudSpeed');
    });

    it('FollowCamera still receives refs', () => {
      expect(raceGameSrc).toContain('targetRef={truckPositionRef}');
      expect(raceGameSrc).toContain('speedRef={speedRef}');
    });

    it('StadiumGame3D still passes refs to FollowCamera', () => {
      expect(stadiumSrc).toContain('targetRef={truckPositionRef}');
      expect(stadiumSrc).toContain('speedRef={speedRef}');
    });
  });
});
