/**
 * Phase 5C Tests: Surface-Dependent Friction
 *
 * Validates that different surfaces (road, dirt, mud, boost pad, bridge, tunnel)
 * have different friction coefficients, lateral grip, and dust colors.
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const GAMES3D = path.resolve(__dirname, '../../../components/games3d');

function readFile(name: string): string {
  return fs.readFileSync(path.join(GAMES3D, name), 'utf-8');
}

describe('Phase 5C: Surface-Dependent Friction', () => {
  const track3dSrc = readFile('Track3D.tsx');
  const jumpArenaSrc = readFile('JumpArena.tsx');
  const monsterTruckSrc = readFile('MonsterTruck.tsx');

  // ──────────────────────────────────────────────
  // Gap 1: Race mode surface type system (Track3D)
  // ──────────────────────────────────────────────

  describe('Gap 1 — Race mode surface types', () => {
    it('defines RaceSurfaceType type union', () => {
      expect(track3dSrc).toContain("RaceSurfaceType = 'road'");
    });

    it('defines SurfaceInfo interface with speedFriction', () => {
      expect(track3dSrc).toContain('speedFriction: number');
    });

    it('defines SurfaceInfo interface with lateralGrip', () => {
      expect(track3dSrc).toContain('lateralGrip: number');
    });

    it('defines SurfaceInfo interface with dustColor', () => {
      expect(track3dSrc).toContain('dustColor: string');
    });

    it('defines SURFACE_ROAD with full grip', () => {
      expect(track3dSrc).toMatch(/SURFACE_ROAD.*speedFriction: 1\.0/);
    });

    it('defines SURFACE_DIRT with reduced friction', () => {
      expect(track3dSrc).toMatch(/SURFACE_DIRT.*speedFriction: 0\.94/);
    });

    it('defines SURFACE_RUMBLE for rumble strip zone', () => {
      expect(track3dSrc).toContain('SURFACE_RUMBLE');
    });

    it('defines SURFACE_BOOST for boost pads', () => {
      expect(track3dSrc).toContain('SURFACE_BOOST');
    });

    it('exports getRaceSurfaceType function', () => {
      expect(track3dSrc).toContain('export function getRaceSurfaceType');
    });

    it('getRaceSurfaceType checks boost pads first', () => {
      // Boost pads should be checked before road/dirt
      const fnBody = track3dSrc.split('getRaceSurfaceType')[1];
      const boostIdx = fnBody.indexOf('BOOST_PAD');
      const roadIdx = fnBody.indexOf('SURFACE_ROAD');
      expect(boostIdx).toBeLessThan(roadIdx);
    });

    it('getRaceSurfaceType uses track center distance for road vs dirt', () => {
      expect(track3dSrc).toContain('distFromCenter');
      expect(track3dSrc).toContain('halfRoad');
    });

    it('each surface has distinct dust colors', () => {
      expect(track3dSrc).toContain("dustColor: '#C4A070'"); // road
      expect(track3dSrc).toContain("dustColor: '#D2B48C'"); // dirt
      expect(track3dSrc).toContain("dustColor: '#FFAA44'"); // boost
    });
  });

  // ──────────────────────────────────────────────
  // Gap 2: Jump mode surface type system (JumpArena)
  // ──────────────────────────────────────────────

  describe('Gap 2 — Jump mode surface types', () => {
    it('defines JumpSurfaceType type union', () => {
      expect(jumpArenaSrc).toContain("JumpSurfaceType = 'road'");
    });

    it('defines JumpSurfaceInfo interface', () => {
      expect(jumpArenaSrc).toContain('JumpSurfaceInfo');
      expect(jumpArenaSrc).toContain('speedFriction: number');
    });

    it('defines JUMP_SURFACE_MUD with strong friction', () => {
      expect(jumpArenaSrc).toMatch(/JUMP_SURFACE_MUD.*speedFriction: 0\.92/);
    });

    it('defines JUMP_SURFACE_BRIDGE for metal surface', () => {
      expect(jumpArenaSrc).toContain('JUMP_SURFACE_BRIDGE');
    });

    it('defines JUMP_SURFACE_TUNNEL for concrete floor', () => {
      expect(jumpArenaSrc).toContain('JUMP_SURFACE_TUNNEL');
    });

    it('exports getJumpSurfaceType function', () => {
      expect(jumpArenaSrc).toContain('export function getJumpSurfaceType');
    });

    it('getJumpSurfaceType checks mud pits', () => {
      expect(jumpArenaSrc).toContain('isInMudPit(x, z)');
    });

    it('getJumpSurfaceType checks bridges', () => {
      expect(jumpArenaSrc).toContain('isOnBridge(x, z)');
    });

    it('getJumpSurfaceType checks tunnels', () => {
      expect(jumpArenaSrc).toContain('isInTunnel(x, z)');
    });

    it('getJumpSurfaceType detects paved roads in arena', () => {
      expect(jumpArenaSrc).toContain('Math.abs(x) < 8');
    });

    it('mud has lowest lateral grip', () => {
      expect(jumpArenaSrc).toMatch(/JUMP_SURFACE_MUD.*lateralGrip: 0\.5/);
    });

    it('each jump surface has distinct dust colors', () => {
      expect(jumpArenaSrc).toContain("dustColor: '#6B4226'"); // mud (dark brown)
      expect(jumpArenaSrc).toContain("dustColor: '#D2B48C'"); // dirt
      expect(jumpArenaSrc).toContain("dustColor: '#C0C0C0'"); // bridge (metal)
    });
  });

  // ──────────────────────────────────────────────
  // Gap 3: MonsterTruck uses surface friction
  // ──────────────────────────────────────────────

  describe('Gap 3 — MonsterTruck surface integration', () => {
    it('imports getJumpSurfaceType from JumpArena', () => {
      expect(monsterTruckSrc).toContain('getJumpSurfaceType');
    });

    it('imports getRaceSurfaceType from Track3D', () => {
      expect(monsterTruckSrc).toContain('getRaceSurfaceType');
    });

    it('has surfaceDustColor ref for dynamic dust color', () => {
      expect(monsterTruckSrc).toMatch(/const surfaceDustColor\s*=\s*useRef/);
    });

    it('has surfaceSpeedFriction ref', () => {
      expect(monsterTruckSrc).toMatch(/const surfaceSpeedFriction\s*=\s*useRef/);
    });

    it('has surfaceLateralGrip ref', () => {
      expect(monsterTruckSrc).toMatch(/const surfaceLateralGrip\s*=\s*useRef/);
    });

    it('calls getJumpSurfaceType in jump mode', () => {
      expect(monsterTruckSrc).toContain('getJumpSurfaceType(finalX, finalZ)');
    });

    it('calls getRaceSurfaceType in race mode', () => {
      expect(monsterTruckSrc).toContain('getRaceSurfaceType(finalX, finalZ)');
    });

    it('applies surface speed friction (frame-rate independent)', () => {
      // Should apply jumpSurface.speedFriction or raceSurface.speedFriction
      const frictionLines = monsterTruckSrc.split('\n').filter(l =>
        l.includes('.speedFriction') && l.includes('Math.pow')
      );
      expect(frictionLines.length).toBeGreaterThanOrEqual(2); // jump + race
    });

    it('applies surface lateral grip to lateralVelocity', () => {
      const lateralLines = monsterTruckSrc.split('\n').filter(l =>
        l.includes('lateralGrip') && l.includes('lateralVelocity')
      );
      expect(lateralLines.length).toBeGreaterThanOrEqual(2); // jump + race
    });

    it('updates surfaceDustColor from surface query', () => {
      expect(monsterTruckSrc).toContain('surfaceDustColor.current = jumpSurface.dustColor');
      expect(monsterTruckSrc).toContain('surfaceDustColor.current = raceSurface.dustColor');
    });
  });

  // ──────────────────────────────────────────────
  // Gap 4: Dynamic dust color in DustTrail
  // ──────────────────────────────────────────────

  describe('Gap 4 — Dynamic dust color', () => {
    it('DustTrail uses surfaceDustColor ref (not hardcoded)', () => {
      expect(monsterTruckSrc).toContain('color={surfaceDustColor.current}');
    });

    it('no hardcoded #C4A070 in DustTrail color prop', () => {
      // The old hardcoded pattern should be replaced with ref
      const dustTrailLines = monsterTruckSrc.split('\n').filter(l =>
        l.includes('<DustTrail') || (l.includes('color=') && l.includes('DustTrail'))
      );
      // DustTrail should not have hardcoded color inline
      const hardcodedLines = dustTrailLines.filter(l => l.includes('"#C4A070"'));
      expect(hardcodedLines.length).toBe(0);
    });
  });

  // ──────────────────────────────────────────────
  // Gap 5: Boost pad detection in race mode
  // ──────────────────────────────────────────────

  describe('Gap 5 — Boost pad surface detection', () => {
    it('Track3D defines BOOST_PAD_POSITIONS array', () => {
      expect(track3dSrc).toContain('BOOST_PAD_POSITIONS');
    });

    it('boost pads have radius-based proximity detection', () => {
      expect(track3dSrc).toContain('pad.radius');
    });

    it('boost pad returns SURFACE_BOOST with full grip', () => {
      expect(track3dSrc).toMatch(/SURFACE_BOOST.*lateralGrip: 1\.0/);
    });
  });

  // ──────────────────────────────────────────────
  // No regression: core systems preserved
  // ──────────────────────────────────────────────

  describe('No regression — core systems preserved', () => {
    it('isInMudPit still exported from JumpArena', () => {
      expect(jumpArenaSrc).toContain('export function isInMudPit');
    });

    it('getRaceTrackHeight still exported from Track3D', () => {
      expect(track3dSrc).toContain('export function getRaceTrackHeight');
    });

    it('gravity still aligned at 25', () => {
      expect(monsterTruckSrc).toMatch(/const GRAVITY = 25/);
    });

    it('drift system still intact', () => {
      expect(monsterTruckSrc).toContain("driftState.current === 'drifting'");
      expect(monsterTruckSrc).toContain('DRIFT_MINI_TURBO_SPEEDS');
    });

    it('weight/inertia system still intact', () => {
      expect(monsterTruckSrc).toContain('yawVelocity');
      expect(monsterTruckSrc).toContain('STEERING_INERTIA');
      expect(monsterTruckSrc).toContain('suspensionOffset');
    });

    it('boundary push-back still works in both modes', () => {
      expect(monsterTruckSrc).toContain('pushStrength');
      expect(monsterTruckSrc).toContain('KID-FRIENDLY track boundaries');
    });
  });
});
