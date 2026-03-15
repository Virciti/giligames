/**
 * Phase 7 Tests: Track & Environment
 *
 * Validates boost pad activation, oil slick hazards, track ramps,
 * and visual density improvements.
 * 7A: Boost Pads (speed burst on activation)
 * 7B: Track Hazards & Variety (oil slicks, ramps)
 * 7C: Visual Density (decorations, signs, tumbleweeds)
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const GAMES3D = path.resolve(__dirname, '../../../components/games3d');

function readFile(name: string): string {
  return fs.readFileSync(path.join(GAMES3D, name), 'utf-8');
}

describe('Phase 7: Track & Environment', () => {
  const track3dSrc = readFile('Track3D.tsx');
  const monsterTruckSrc = readFile('MonsterTruck.tsx');
  const raceGameSrc = readFile('RaceGame3D.tsx');

  // ──────────────────────────────────────────────
  // 7A: Boost Pads
  // ──────────────────────────────────────────────

  describe('7A — Boost Pad Activation', () => {
    it('Track3D defines SURFACE_BOOST with full grip', () => {
      expect(track3dSrc).toMatch(/SURFACE_BOOST.*lateralGrip: 1\.0/);
    });

    it('Track3D has BOOST_PAD_POSITIONS array', () => {
      expect(track3dSrc).toContain('BOOST_PAD_POSITIONS');
    });

    it('getRaceSurfaceType checks boost pads first', () => {
      const fnBody = track3dSrc.split('getRaceSurfaceType')[1];
      const boostIdx = fnBody.indexOf('BOOST_PAD');
      const oilIdx = fnBody.indexOf('OIL_SLICK');
      expect(boostIdx).toBeLessThan(oilIdx);
    });

    it('MonsterTruck has boostPadTimer ref', () => {
      expect(monsterTruckSrc).toMatch(/const boostPadTimer\s*=\s*useRef/);
    });

    it('MonsterTruck defines BOOST_PAD_SPEED_MULT (1.5x)', () => {
      expect(monsterTruckSrc).toContain('BOOST_PAD_SPEED_MULT = 1.5');
    });

    it('MonsterTruck defines BOOST_PAD_DURATION (1.5s)', () => {
      expect(monsterTruckSrc).toContain('BOOST_PAD_DURATION = 1.5');
    });

    it('activates boost when surface type is boost-pad', () => {
      expect(monsterTruckSrc).toContain("raceSurface.type === 'boost-pad'");
      expect(monsterTruckSrc).toContain('boostPadTimer.current = BOOST_PAD_DURATION');
    });

    it('boost pad speed ramps down near end (fade)', () => {
      expect(monsterTruckSrc).toContain('boostFade');
      expect(monsterTruckSrc).toContain('boostPadTimer.current > 0.3');
    });

    it('applies BOOST_PAD_SPEED_MULT to effective max speed', () => {
      expect(monsterTruckSrc).toContain('effectiveMaxSpeed * BOOST_PAD_SPEED_MULT');
    });

    it('BoostPad visual component exists in ItemBox', () => {
      const itemBoxSrc = readFile('ItemBox.tsx');
      expect(itemBoxSrc).toContain('export function BoostPad');
      expect(itemBoxSrc).toContain('Arrow indicators');
    });
  });

  // ──────────────────────────────────────────────
  // 7B: Track Hazards & Variety
  // ──────────────────────────────────────────────

  describe('7B — Oil Slick Hazards', () => {
    it('adds oil-slick to RaceSurfaceType', () => {
      expect(track3dSrc).toContain("'oil-slick'");
    });

    it('defines SURFACE_OIL_SLICK with very low lateral grip', () => {
      expect(track3dSrc).toMatch(/SURFACE_OIL_SLICK.*lateralGrip: 0\.25/);
    });

    it('exports OIL_SLICK_POSITIONS array', () => {
      expect(track3dSrc).toContain('export const OIL_SLICK_POSITIONS');
    });

    it('OIL_SLICK_POSITIONS has at least 4 patches', () => {
      const matches = track3dSrc.match(/OIL_SLICK_POSITIONS\s*=\s*\[([^\]]+)\]/s);
      expect(matches).toBeTruthy();
      const entries = matches![1].split('{').length - 1;
      expect(entries).toBeGreaterThanOrEqual(4);
    });

    it('getRaceSurfaceType checks oil slicks', () => {
      expect(track3dSrc).toContain('OIL_SLICK_POSITIONS');
      expect(track3dSrc).toContain('SURFACE_OIL_SLICK');
    });

    it('oil slick has radius-based proximity detection', () => {
      expect(track3dSrc).toContain('slick.radius');
    });

    it('MonsterTruck adds lateral slide on oil slick', () => {
      expect(monsterTruckSrc).toContain("raceSurface.type === 'oil-slick'");
      expect(monsterTruckSrc).toContain('lateralVelocity.current +=');
    });

    it('oil slick renders as dark shiny circle on track', () => {
      expect(track3dSrc).toContain('oil-');
      expect(track3dSrc).toContain('#1a1a2e'); // Dark oil color
      expect(track3dSrc).toContain('metalness={0.9}'); // Shiny oil surface
    });

    it('oil slick has rainbow sheen overlay', () => {
      expect(track3dSrc).toContain('#4a2080'); // Purple-ish rainbow sheen
    });
  });

  describe('7B — Track Ramps', () => {
    it('exports TRACK_RAMP_POSITIONS array', () => {
      expect(track3dSrc).toContain('export const TRACK_RAMP_POSITIONS');
    });

    it('TRACK_RAMP_POSITIONS has at least 3 ramps', () => {
      const matches = track3dSrc.match(/TRACK_RAMP_POSITIONS\s*=\s*\[([^\]]+)\]/s);
      expect(matches).toBeTruthy();
      const entries = matches![1].split('{').length - 1;
      expect(entries).toBeGreaterThanOrEqual(3);
    });

    it('ramps have width, height, and angle properties', () => {
      expect(track3dSrc).toContain('ramp.width');
      expect(track3dSrc).toContain('ramp.height');
      expect(track3dSrc).toContain('ramp.angle');
    });

    it('getRaceTrackHeight includes ramp elevation', () => {
      expect(track3dSrc).toContain('TRACK_RAMP_POSITIONS');
      // Height function should check ramp proximity
      const heightFn = track3dSrc.split('getRaceTrackHeight')[1]?.split('export')[0] || '';
      expect(heightFn).toContain('ramp.height');
      expect(heightFn).toContain('rampFactor');
    });

    it('ramp height uses smooth cosine curve', () => {
      expect(track3dSrc).toContain('Math.cos(Math.PI * dist / ramp.width)');
    });

    it('ramps render with visual geometry', () => {
      expect(track3dSrc).toContain('ramp-');
      expect(track3dSrc).toContain('cylinderGeometry');
    });

    it('ramps have chevron warning stripes', () => {
      expect(track3dSrc).toContain('#FFD700'); // Gold chevron
    });
  });

  // ──────────────────────────────────────────────
  // 7C: Visual Density
  // ──────────────────────────────────────────────

  describe('7C — Visual Density', () => {
    it('has additional rock formations (doubled)', () => {
      const rockGroups = (track3dSrc.match(/rock2-/g) || []).length;
      expect(rockGroups).toBeGreaterThanOrEqual(1);
    });

    it('has additional cacti (doubled)', () => {
      const cactusGroups = (track3dSrc.match(/cactus2-/g) || []).length;
      expect(cactusGroups).toBeGreaterThanOrEqual(1);
    });

    it('has tumbleweeds scattered in the desert', () => {
      expect(track3dSrc).toContain('tumbleweed-');
      expect(track3dSrc).toContain('icosahedronGeometry');
      expect(track3dSrc).toContain('wireframe');
    });

    it('has at least 6 tumbleweeds', () => {
      const twCount = (track3dSrc.match(/tumbleweed-/g) || []).length;
      expect(twCount).toBeGreaterThanOrEqual(1);
      // Check actual count via position array
      const twSection = track3dSrc.split('Tumbleweeds')[1]?.split('].map')[0] || '';
      const positions = twSection.split('{').length - 1;
      expect(positions).toBeGreaterThanOrEqual(6);
    });

    it('has additional billboards (sponsor-style)', () => {
      expect(track3dSrc).toContain('TURBO FUEL');
      expect(track3dSrc).toContain('NITRO BOOST');
    });

    it('has additional road signs (6+ total)', () => {
      expect(track3dSrc).toContain('CAUTION RAMP');
      expect(track3dSrc).toContain('OIL AHEAD');
      // Original 4 + 2 new = 6 total
      const signs = track3dSrc.match(/text: '/g) || [];
      expect(signs.length).toBeGreaterThanOrEqual(6);
    });

    it('grandstands still present on all sides', () => {
      const grandstands = (track3dSrc.match(/<Grandstand/g) || []).length;
      expect(grandstands).toBeGreaterThanOrEqual(4);
    });

    it('highway lights still ring the track', () => {
      expect(track3dSrc).toContain('hwy-light-');
      expect(track3dSrc).toContain('HighwayLight');
    });
  });

  // ──────────────────────────────────────────────
  // No regression: core systems preserved
  // ──────────────────────────────────────────────

  describe('No regression — core systems preserved', () => {
    it('road surface still has full grip', () => {
      expect(track3dSrc).toMatch(/SURFACE_ROAD.*speedFriction: 1\.0/);
    });

    it('dirt surface still has reduced friction', () => {
      expect(track3dSrc).toMatch(/SURFACE_DIRT.*speedFriction: 0\.94/);
    });

    it('rumble strip still exists', () => {
      expect(track3dSrc).toContain('SURFACE_RUMBLE');
    });

    it('getRaceTrackHeight still uses sine-wave base', () => {
      expect(track3dSrc).toContain('Math.sin(x * 0.02)');
      expect(track3dSrc).toContain('Math.sin(z * 0.025)');
    });

    it('track center distance still determines road vs dirt', () => {
      expect(track3dSrc).toContain('distFromCenter');
      expect(track3dSrc).toContain('halfRoad');
    });

    it('mini-turbo system still intact in MonsterTruck', () => {
      expect(monsterTruckSrc).toContain('miniTurboTimer');
      expect(monsterTruckSrc).toContain('DRIFT_MINI_TURBO_SPEEDS');
    });

    it('surface friction still applied frame-rate independently', () => {
      const frictionLines = monsterTruckSrc.split('\n').filter(l =>
        l.includes('.speedFriction') && l.includes('Math.pow')
      );
      expect(frictionLines.length).toBeGreaterThanOrEqual(2);
    });

    it('lateral grip still applied from surface', () => {
      const gripLines = monsterTruckSrc.split('\n').filter(l =>
        l.includes('lateralGrip') && l.includes('Math.pow')
      );
      expect(gripLines.length).toBeGreaterThanOrEqual(2);
    });

    it('boundary push-back still works', () => {
      expect(monsterTruckSrc).toContain('pushStrength');
      expect(monsterTruckSrc).toContain('KID-FRIENDLY track boundaries');
    });
  });
});
