/**
 * Phase 5A Tests: Drift / Power-Slide System
 *
 * Validates the Mario Kart-inspired drift mechanic:
 * - Drift state machine (none → drifting → mini-turbo)
 * - Charge levels (blue → orange → purple)
 * - Mini-turbo boost on drift release
 * - Counter-steer charge bonus
 * - DriftSparks particle system
 * - Input wiring (R/E keys)
 * - HUD drift indicator
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const GAMES3D = path.resolve(__dirname, '../../../components/games3d');
const PARTICLES = path.join(GAMES3D, 'particles');

function readFile(dir: string, name: string): string {
  return fs.readFileSync(path.join(dir, name), 'utf-8');
}

describe('Phase 5A: Drift / Power-Slide System', () => {
  const monsterTruckSrc = readFile(GAMES3D, 'MonsterTruck.tsx');
  const raceGameSrc = readFile(GAMES3D, 'RaceGame3D.tsx');
  const stadiumSrc = readFile(GAMES3D, 'StadiumGame3D.tsx');
  const raceHudSrc = readFile(GAMES3D, 'RaceHUD3D.tsx');
  const driftSparksSrc = readFile(PARTICLES, 'DriftSparks.tsx');
  const particlesIndex = readFile(PARTICLES, 'index.ts');

  // ──────────────────────────────────────────────
  // Gap 1: Drift constants and configuration
  // ──────────────────────────────────────────────

  describe('Gap 1 — Drift constants defined', () => {
    it('defines DRIFT_MIN_SPEED threshold', () => {
      expect(monsterTruckSrc).toMatch(/const DRIFT_MIN_SPEED = \d+/);
    });

    it('defines DRIFT_CHARGE_RATE', () => {
      expect(monsterTruckSrc).toContain('DRIFT_CHARGE_RATE');
    });

    it('defines DRIFT_MINI_TURBO_SPEEDS array with 3 levels', () => {
      expect(monsterTruckSrc).toMatch(/DRIFT_MINI_TURBO_SPEEDS = \[/);
    });

    it('defines DRIFT_MINI_TURBO_DURATION array with 3 levels', () => {
      expect(monsterTruckSrc).toMatch(/DRIFT_MINI_TURBO_DURATION = \[/);
    });

    it('defines DRIFT_COUNTER_STEER_BONUS for charge rate', () => {
      expect(monsterTruckSrc).toContain('DRIFT_COUNTER_STEER_BONUS');
    });
  });

  // ──────────────────────────────────────────────
  // Gap 2: Drift state machine refs
  // ──────────────────────────────────────────────

  describe('Gap 2 — Drift state machine', () => {
    it('has driftState ref with three states', () => {
      expect(monsterTruckSrc).toMatch(/driftState = useRef.*'none'/);
    });

    it('has driftDirection ref', () => {
      expect(monsterTruckSrc).toContain('driftDirection');
    });

    it('has driftCharge ref for accumulating charge time', () => {
      expect(monsterTruckSrc).toContain('driftCharge');
    });

    it('has driftLevel ref (0-3)', () => {
      expect(monsterTruckSrc).toMatch(/driftLevel = useRef/);
    });

    it('has miniTurboTimer ref', () => {
      expect(monsterTruckSrc).toContain('miniTurboTimer');
    });

    it('has miniTurboSpeed ref', () => {
      expect(monsterTruckSrc).toContain('miniTurboSpeed');
    });
  });

  // ──────────────────────────────────────────────
  // Gap 3: Drift initiation and charge levels
  // ──────────────────────────────────────────────

  describe('Gap 3 — Drift initiation and charging', () => {
    it('checks speed threshold before allowing drift', () => {
      expect(monsterTruckSrc).toContain('DRIFT_MIN_SPEED');
      expect(monsterTruckSrc).toContain('canDrift');
    });

    it('requires drift input + steering to initiate', () => {
      expect(monsterTruckSrc).toContain('input.drift');
      expect(monsterTruckSrc).toContain('isSteering');
      expect(monsterTruckSrc).toContain('wantsDrift');
    });

    it('locks drift direction at start', () => {
      expect(monsterTruckSrc).toContain('driftDirection.current = input.left ? -1 : 1');
    });

    it('charges through 3 levels based on accumulated time', () => {
      expect(monsterTruckSrc).toContain('driftLevel.current = 3');
      expect(monsterTruckSrc).toContain('driftLevel.current = 2');
      expect(monsterTruckSrc).toContain('driftLevel.current = 1');
    });

    it('counter-steering charges faster', () => {
      expect(monsterTruckSrc).toContain('isCounterSteering');
      expect(monsterTruckSrc).toContain('DRIFT_COUNTER_STEER_BONUS');
      expect(monsterTruckSrc).toContain('chargeMultiplier');
    });
  });

  // ──────────────────────────────────────────────
  // Gap 4: Mini-turbo boost on drift release
  // ──────────────────────────────────────────────

  describe('Gap 4 — Mini-turbo on drift release', () => {
    it('transitions to mini-turbo state on drift release', () => {
      expect(monsterTruckSrc).toContain("driftState.current = 'mini-turbo'");
    });

    it('sets mini-turbo timer from DRIFT_MINI_TURBO_DURATION', () => {
      expect(monsterTruckSrc).toContain('DRIFT_MINI_TURBO_DURATION[level - 1]');
    });

    it('sets mini-turbo speed from DRIFT_MINI_TURBO_SPEEDS', () => {
      expect(monsterTruckSrc).toContain('DRIFT_MINI_TURBO_SPEEDS[level - 1]');
    });

    it('mini-turbo applies speed boost beyond normal max', () => {
      expect(monsterTruckSrc).toContain('effectiveMaxSpeed + miniTurboSpeed.current');
    });

    it('mini-turbo fades out at end of duration', () => {
      expect(monsterTruckSrc).toContain('miniTurboTimer.current -= delta');
      expect(monsterTruckSrc).toContain("driftState.current = 'none'");
    });
  });

  // ──────────────────────────────────────────────
  // Gap 5: Drift input wiring
  // ──────────────────────────────────────────────

  describe('Gap 5 — Input wiring', () => {
    it('inputState includes drift field in RaceGame3D', () => {
      expect(raceGameSrc).toContain('drift: false');
    });

    it('R or E key triggers drift in RaceGame3D', () => {
      const driftKeyDowns = raceGameSrc.split('\n').filter(l =>
        l.includes('drift: true')
      );
      expect(driftKeyDowns.length).toBeGreaterThanOrEqual(1);
    });

    it('R or E key release clears drift in RaceGame3D', () => {
      const driftKeyUps = raceGameSrc.split('\n').filter(l =>
        l.includes('drift: false') && l.includes('prev')
      );
      expect(driftKeyUps.length).toBeGreaterThanOrEqual(1);
    });

    it('activeInput fallback includes drift field', () => {
      // When not racing, drift should be false
      const activeInputLines = raceGameSrc.split('\n').filter(l =>
        l.includes('drift: false')
      );
      expect(activeInputLines.length).toBeGreaterThanOrEqual(2); // initial + fallback + reset
    });

    it('MonsterTruck props accept drift input', () => {
      expect(monsterTruckSrc).toContain('drift: boolean');
    });

    it('StadiumGame3D also has drift input wiring', () => {
      expect(stadiumSrc).toContain('drift: false');
      expect(stadiumSrc).toContain('drift: true');
    });
  });

  // ──────────────────────────────────────────────
  // Gap 6: DriftSparks particle system
  // ──────────────────────────────────────────────

  describe('Gap 6 — DriftSparks particle system', () => {
    it('DriftSparks component exists', () => {
      expect(driftSparksSrc).toContain('export function DriftSparks');
    });

    it('uses InstancedMesh for performance', () => {
      expect(driftSparksSrc).toContain('instancedMesh');
      expect(driftSparksSrc).toContain('InstancedMesh');
    });

    it('accepts driftLevel prop (0-3)', () => {
      expect(driftSparksSrc).toContain('driftLevel');
    });

    it('has color progression for 3 drift levels', () => {
      expect(driftSparksSrc).toContain('DRIFT_COLORS');
      // Blue, Orange, Purple
      expect(driftSparksSrc).toContain('Level 1: Blue');
      expect(driftSparksSrc).toContain('Level 2: Orange');
      expect(driftSparksSrc).toContain('Level 3: Purple');
    });

    it('spawns from rear wheel positions', () => {
      expect(driftSparksSrc).toContain('rearOffset');
      expect(driftSparksSrc).toContain('sideOffset');
    });

    it('is exported from particles index', () => {
      expect(particlesIndex).toContain("export { DriftSparks } from './DriftSparks'");
    });

    it('MonsterTruck renders DriftSparks when drifting', () => {
      expect(monsterTruckSrc).toContain('<DriftSparks');
      expect(monsterTruckSrc).toContain("isActive={driftState.current === 'drifting'}");
    });
  });

  // ──────────────────────────────────────────────
  // Gap 7: HUD drift indicator
  // ──────────────────────────────────────────────

  describe('Gap 7 — HUD drift indicator', () => {
    it('RaceHUD3D accepts driftLevel prop', () => {
      expect(raceHudSrc).toContain('driftLevel');
    });

    it('shows drift level text when drifting', () => {
      expect(raceHudSrc).toContain('DRIFT');
    });

    it('RaceGame3D passes driftLevel to HUD', () => {
      expect(raceGameSrc).toContain('driftLevel={hudDriftLevel}');
    });

    it('RaceGame3D tracks drift level via ref + throttled state', () => {
      expect(raceGameSrc).toContain('driftLevelRef');
      expect(raceGameSrc).toContain('setHudDriftLevel');
    });
  });

  // ──────────────────────────────────────────────
  // Gap 8: onDriftUpdate callback
  // ──────────────────────────────────────────────

  describe('Gap 8 — Drift callback to parent', () => {
    it('MonsterTruck props include onDriftUpdate callback', () => {
      expect(monsterTruckSrc).toContain('onDriftUpdate');
    });

    it('calls onDriftUpdate when drift state changes', () => {
      expect(monsterTruckSrc).toContain('onDriftUpdate?.(true, driftLevel.current)');
      expect(monsterTruckSrc).toContain('onDriftUpdate?.(false, 0)');
    });

    it('RaceGame3D passes onDriftUpdate to MonsterTruck', () => {
      expect(raceGameSrc).toContain('onDriftUpdate={handleDriftUpdate}');
    });
  });

  // ──────────────────────────────────────────────
  // Gap 9: Mini-turbo activates BoostFlame
  // ──────────────────────────────────────────────

  describe('Gap 9 — Mini-turbo visual feedback', () => {
    it('BoostFlame activates during mini-turbo', () => {
      expect(monsterTruckSrc).toContain("driftState.current === 'mini-turbo'");
      // BoostFlame isActive should include mini-turbo
      const boostFlameLines = monsterTruckSrc.split('\n').filter(l =>
        l.includes('isActive=') && l.includes('mini-turbo')
      );
      expect(boostFlameLines.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ──────────────────────────────────────────────
  // No regression: core physics preserved
  // ──────────────────────────────────────────────

  describe('No regression — core physics preserved', () => {
    it('normal steering still works when not drifting', () => {
      expect(monsterTruckSrc).toContain('effectiveTurnSpeed');
      expect(monsterTruckSrc).toContain('TURN_SPEED');
    });

    it('auto-straightening still exists for kids', () => {
      expect(monsterTruckSrc).toContain('AUTO_STRAIGHTEN');
    });

    it('boost still works independently of drift', () => {
      expect(monsterTruckSrc).toContain('input.boost ? 1.4 : 1');
    });

    it('spin (banana hit) still overrides all controls', () => {
      expect(monsterTruckSrc).toContain('isSpinning');
      expect(monsterTruckSrc).toContain('spinUntil');
    });

    it('FollowCamera still receives refs', () => {
      expect(raceGameSrc).toContain('targetRef={truckPositionRef}');
      expect(raceGameSrc).toContain('speedRef={speedRef}');
    });

    it('control hints include drift key', () => {
      expect(raceGameSrc).toContain('R/E = Drift');
    });
  });
});
