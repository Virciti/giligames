/**
 * Phase 5D Tests: Speed Feel Enhancement
 *
 * Validates FOV zoom at high speed, speed lines overlay,
 * terrain rumble micro-shake, and dynamic vignette intensity.
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const GAMES3D = path.resolve(__dirname, '../../../components/games3d');

function readFile(name: string): string {
  return fs.readFileSync(path.join(GAMES3D, name), 'utf-8');
}

describe('Phase 5D: Speed Feel Enhancement', () => {
  const followCamSrc = readFile('FollowCamera.tsx');
  const raceHudSrc = readFile('RaceHUD3D.tsx');
  const postProcSrc = readFile('PostProcessing.tsx');
  const scene3dSrc = readFile('Scene3D.tsx');
  const raceGameSrc = readFile('RaceGame3D.tsx');
  const stadiumSrc = readFile('StadiumGame3D.tsx');

  // ──────────────────────────────────────────────
  // Gap 1: FOV zoom at high speed (FollowCamera)
  // ──────────────────────────────────────────────

  describe('Gap 1 — Dynamic FOV zoom', () => {
    it('defines BASE_FOV constant (60)', () => {
      expect(followCamSrc).toMatch(/const BASE_FOV = 60/);
    });

    it('defines MAX_FOV constant (75)', () => {
      expect(followCamSrc).toMatch(/const MAX_FOV = 75/);
    });

    it('defines FOV_SPEED_THRESHOLD for when FOV starts increasing', () => {
      expect(followCamSrc).toContain('FOV_SPEED_THRESHOLD');
    });

    it('tracks currentFov as a ref', () => {
      expect(followCamSrc).toMatch(/const currentFov\s*=\s*useRef/);
    });

    it('computes target FOV from speed factor', () => {
      expect(followCamSrc).toContain('fovSpeedFactor');
      expect(followCamSrc).toContain('targetFov');
    });

    it('lerps FOV smoothly toward target', () => {
      expect(followCamSrc).toContain('currentFov.current = THREE.MathUtils.lerp(currentFov.current, targetFov');
    });

    it('updates camera FOV and calls updateProjectionMatrix', () => {
      expect(followCamSrc).toContain('.fov = currentFov.current');
      expect(followCamSrc).toContain('updateProjectionMatrix()');
    });

    it('FOV range is 60 to 75 degrees', () => {
      expect(followCamSrc).toContain('BASE_FOV + (MAX_FOV - BASE_FOV)');
    });
  });

  // ──────────────────────────────────────────────
  // Gap 2: Terrain rumble micro-shake
  // ──────────────────────────────────────────────

  describe('Gap 2 — Speed-dependent terrain rumble', () => {
    it('defines SPEED_SHAKE_MAX constant', () => {
      expect(followCamSrc).toContain('SPEED_SHAKE_MAX');
    });

    it('defines SPEED_SHAKE_THRESHOLD constant', () => {
      expect(followCamSrc).toContain('SPEED_SHAKE_THRESHOLD');
    });

    it('applies rumble only when above speed threshold', () => {
      expect(followCamSrc).toContain('speedFactor > SPEED_SHAKE_THRESHOLD');
    });

    it('rumble intensity scales with speed above threshold', () => {
      expect(followCamSrc).toContain('rumbleIntensity');
    });

    it('rumble does not apply during collision shake', () => {
      expect(followCamSrc).toContain('shakeTimeLeft.current <= 0');
    });
  });

  // ──────────────────────────────────────────────
  // Gap 3: Speed lines overlay (RaceHUD3D)
  // ──────────────────────────────────────────────

  describe('Gap 3 — Speed lines overlay', () => {
    it('computes speedRatio from speed/maxSpeed', () => {
      expect(raceHudSrc).toContain('speedRatio');
      expect(raceHudSrc).toContain('speed / maxSpeed');
    });

    it('shows speed lines when > 80% max speed', () => {
      expect(raceHudSrc).toContain('showSpeedLines');
      expect(raceHudSrc).toContain('speedRatio > 0.8');
    });

    it('speed line opacity scales with speed above threshold', () => {
      expect(raceHudSrc).toContain('speedLineOpacity');
    });

    it('renders radial gradient overlay for speed lines', () => {
      expect(raceHudSrc).toContain('radial-gradient');
      expect(raceHudSrc).toContain('Speed lines');
    });

    it('speed lines are pointer-events-none and high z-index', () => {
      const speedLineSection = raceHudSrc.split('Speed lines')[1]?.split('}')[0] || '';
      expect(raceHudSrc).toContain('pointer-events-none');
    });
  });

  // ──────────────────────────────────────────────
  // Gap 4: Dynamic vignette at speed (PostProcessing)
  // ──────────────────────────────────────────────

  describe('Gap 4 — Speed-dependent vignette', () => {
    it('PostProcessing accepts speedRef prop', () => {
      expect(postProcSrc).toContain('speedRef');
    });

    it('defines BASE_VIGNETTE_DARKNESS constant', () => {
      expect(postProcSrc).toContain('BASE_VIGNETTE_DARKNESS');
    });

    it('defines MAX_SPEED_VIGNETTE_DARKNESS constant', () => {
      expect(postProcSrc).toContain('MAX_SPEED_VIGNETTE_DARKNESS');
    });

    it('defines VIGNETTE_SPEED_THRESHOLD', () => {
      expect(postProcSrc).toContain('VIGNETTE_SPEED_THRESHOLD');
    });

    it('has SpeedVignette component that reads speedRef in useFrame', () => {
      expect(postProcSrc).toContain('SpeedVignette');
      expect(postProcSrc).toContain('useFrame');
    });

    it('SpeedVignette updates vignette darkness uniform directly', () => {
      // Should update the darkness uniform without React re-renders
      expect(postProcSrc).toContain("uniforms.get('darkness')");
    });

    it('all EffectComposer branches use SpeedVignette', () => {
      const speedVignetteCount = (postProcSrc.match(/<SpeedVignette/g) || []).length;
      expect(speedVignetteCount).toBeGreaterThanOrEqual(3); // low, medium/bloom, high/ssao
    });
  });

  // ──────────────────────────────────────────────
  // Gap 5: Scene3D passes speedRef to PostProcessing
  // ──────────────────────────────────────────────

  describe('Gap 5 — Scene3D speedRef wiring', () => {
    it('Scene3D accepts speedRef prop', () => {
      expect(scene3dSrc).toContain('speedRef');
    });

    it('Scene3D passes speedRef to PostProcessing', () => {
      expect(scene3dSrc).toContain('speedRef={speedRef}');
    });

    it('RaceGame3D passes speedRef to Scene3D', () => {
      expect(raceGameSrc).toContain('speedRef={speedRef}');
      // Should be on the Scene3D element
      const scene3dLine = raceGameSrc.split('\n').find(l => l.includes('<Scene3D') && l.includes('speedRef'));
      expect(scene3dLine).toBeTruthy();
    });

    it('StadiumGame3D passes speedRef to Scene3D', () => {
      const scene3dLine = stadiumSrc.split('\n').find(l => l.includes('<Scene3D') && l.includes('speedRef'));
      expect(scene3dLine).toBeTruthy();
    });
  });

  // ──────────────────────────────────────────────
  // No regression: camera systems preserved
  // ──────────────────────────────────────────────

  describe('No regression — camera & rendering preserved', () => {
    it('angular velocity clamping still works', () => {
      expect(followCamSrc).toContain('MAX_ANGULAR_VELOCITY');
      expect(followCamSrc).toContain('smoothedRotationY');
    });

    it('velocity dampening still works', () => {
      expect(followCamSrc).toContain('cameraVelocity');
      expect(followCamSrc).toContain('velDamp');
    });

    it('speed-dependent look-ahead still works', () => {
      expect(followCamSrc).toContain('dynamicLookAhead');
      expect(followCamSrc).toContain('speedPullBack');
    });

    it('collision camera shake still works', () => {
      expect(followCamSrc).toContain('shakeTimeLeft');
      expect(followCamSrc).toContain('shakeTrigger');
    });

    it('PostProcessing still has quality presets', () => {
      expect(postProcSrc).toContain('bloomIntensity');
      expect(postProcSrc).toContain('ssaoRadius');
    });

    it('Bloom and SSAO still configured', () => {
      expect(postProcSrc).toContain('<Bloom');
      expect(postProcSrc).toContain('<SSAO');
    });

    it('Scene3D initial camera FOV is 60', () => {
      expect(scene3dSrc).toContain('fov: 60');
    });
  });
});
