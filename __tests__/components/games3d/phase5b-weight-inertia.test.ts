/**
 * Phase 5B Tests: Weight & Inertia
 *
 * Validates momentum-based steering, lateral grip model,
 * suspension bounce on landing, and body lean/pitch.
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const GAMES3D = path.resolve(__dirname, '../../../components/games3d');

function readFile(name: string): string {
  return fs.readFileSync(path.join(GAMES3D, name), 'utf-8');
}

describe('Phase 5B: Weight & Inertia', () => {
  const monsterTruckSrc = readFile('MonsterTruck.tsx');

  // ──────────────────────────────────────────────
  // Gap 1: Inertia constants defined
  // ──────────────────────────────────────────────

  describe('Gap 1 — Inertia constants', () => {
    it('defines STEERING_INERTIA constant', () => {
      expect(monsterTruckSrc).toMatch(/const STEERING_INERTIA = [\d.]+/);
    });

    it('defines LATERAL_GRIP constant', () => {
      expect(monsterTruckSrc).toMatch(/const LATERAL_GRIP = [\d.]+/);
    });

    it('defines LATERAL_DECAY for frame-rate independent slide decay', () => {
      expect(monsterTruckSrc).toMatch(/const LATERAL_DECAY = [\d.]+/);
    });

    it('defines SUSPENSION_STIFFNESS for spring simulation', () => {
      expect(monsterTruckSrc).toMatch(/const SUSPENSION_STIFFNESS = [\d.]+/);
    });

    it('defines SUSPENSION_DAMPING to prevent infinite oscillation', () => {
      expect(monsterTruckSrc).toMatch(/const SUSPENSION_DAMPING = [\d.]+/);
    });

    it('defines LANDING_BOUNCE_FACTOR for impact-to-bounce conversion', () => {
      expect(monsterTruckSrc).toMatch(/const LANDING_BOUNCE_FACTOR = [\d.]+/);
    });

    it('defines BODY_LEAN_FACTOR for turn roll', () => {
      expect(monsterTruckSrc).toMatch(/const BODY_LEAN_FACTOR = [\d.]+/);
    });

    it('defines BODY_PITCH_FACTOR for acceleration pitch', () => {
      expect(monsterTruckSrc).toMatch(/const BODY_PITCH_FACTOR = [\d.]+/);
    });
  });

  // ──────────────────────────────────────────────
  // Gap 2: Momentum-based steering refs
  // ──────────────────────────────────────────────

  describe('Gap 2 — Inertia state refs', () => {
    it('has yawVelocity ref for steering momentum', () => {
      expect(monsterTruckSrc).toMatch(/const yawVelocity\s*=\s*useRef/);
    });

    it('has lateralVelocity ref for sideways slide', () => {
      expect(monsterTruckSrc).toMatch(/const lateralVelocity\s*=\s*useRef/);
    });

    it('has suspensionOffset ref for visual bounce', () => {
      expect(monsterTruckSrc).toMatch(/const suspensionOffset\s*=\s*useRef/);
    });

    it('has suspensionVelocity ref for spring simulation', () => {
      expect(monsterTruckSrc).toMatch(/const suspensionVelocity\s*=\s*useRef/);
    });

    it('has bodyLean ref for roll angle', () => {
      expect(monsterTruckSrc).toMatch(/const bodyLean\s*=\s*useRef/);
    });

    it('has bodyPitch ref for pitch angle', () => {
      expect(monsterTruckSrc).toMatch(/const bodyPitch\s*=\s*useRef/);
    });
  });

  // ──────────────────────────────────────────────
  // Gap 3: Momentum-based steering (not instant)
  // ──────────────────────────────────────────────

  describe('Gap 3 — Momentum-based steering', () => {
    it('computes target yaw velocity from input', () => {
      expect(monsterTruckSrc).toContain('targetYawVelocity');
    });

    it('smooths yaw velocity toward target via STEERING_INERTIA', () => {
      expect(monsterTruckSrc).toContain('STEERING_INERTIA');
      expect(monsterTruckSrc).toContain('inertiaFactor');
    });

    it('applies yaw velocity to rotation (not direct input)', () => {
      expect(monsterTruckSrc).toContain('currentRotation.current += yawVelocity.current * delta');
    });

    it('decays yaw velocity when not steering (self-centering)', () => {
      // yawVelocity should decay when isSteering is false
      const decayLines = monsterTruckSrc.split('\n').filter(l =>
        l.includes('yawVelocity.current *=') && l.includes('Math.pow')
      );
      expect(decayLines.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ──────────────────────────────────────────────
  // Gap 4: Lateral grip model
  // ──────────────────────────────────────────────

  describe('Gap 4 — Lateral grip model', () => {
    it('computes lateral force from yaw velocity and speed', () => {
      expect(monsterTruckSrc).toContain('lateralForce');
      expect(monsterTruckSrc).toContain('LATERAL_GRIP');
    });

    it('accumulates lateral velocity from force', () => {
      expect(monsterTruckSrc).toContain('lateralVelocity.current += lateralForce * delta');
    });

    it('decays lateral velocity via LATERAL_DECAY (frame-rate independent)', () => {
      expect(monsterTruckSrc).toContain('Math.pow(LATERAL_DECAY, delta * 60)');
    });

    it('clamps lateral velocity to prevent extreme slides', () => {
      expect(monsterTruckSrc).toContain('Math.max(-15, Math.min(15, lateralVelocity.current))');
    });

    it('applies lateral velocity perpendicular to heading', () => {
      expect(monsterTruckSrc).toContain('lateralX');
      expect(monsterTruckSrc).toContain('lateralZ');
      expect(monsterTruckSrc).toContain('lateralVelocity.current * delta');
    });

    it('movement includes both forward and lateral components', () => {
      expect(monsterTruckSrc).toContain('pos.x + moveX + lateralX');
      expect(monsterTruckSrc).toContain('pos.z + moveZ + lateralZ');
    });
  });

  // ──────────────────────────────────────────────
  // Gap 5: Suspension bounce on landing
  // ──────────────────────────────────────────────

  describe('Gap 5 — Suspension bounce on landing', () => {
    it('converts impact velocity to suspension velocity on landing', () => {
      expect(monsterTruckSrc).toContain('LANDING_BOUNCE_FACTOR');
      expect(monsterTruckSrc).toContain('impactVelocity');
    });

    it('suspension uses spring-damper simulation', () => {
      expect(monsterTruckSrc).toContain('springForce');
      expect(monsterTruckSrc).toContain('dampingForce');
      expect(monsterTruckSrc).toContain('SUSPENSION_STIFFNESS');
      expect(monsterTruckSrc).toContain('SUSPENSION_DAMPING');
    });

    it('suspensionOffset affects visual Y position', () => {
      expect(monsterTruckSrc).toContain('suspensionOffset.current');
      expect(monsterTruckSrc).toContain('currentY.current + suspensionOffset.current');
    });

    it('suspension is clamped to reasonable range', () => {
      expect(monsterTruckSrc).toContain('Math.max(-0.6, Math.min(0.6, suspensionOffset.current))');
    });

    it('tiny oscillations are killed to prevent perpetual jitter', () => {
      // Should zero out when both offset and velocity are negligible
      const killLines = monsterTruckSrc.split('\n').filter(l =>
        l.includes('suspensionOffset.current = 0') || l.includes('suspensionVelocity.current = 0')
      );
      expect(killLines.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ──────────────────────────────────────────────
  // Gap 6: Body lean and pitch
  // ──────────────────────────────────────────────

  describe('Gap 6 — Body lean & pitch', () => {
    it('body lean is computed from yaw velocity and speed', () => {
      expect(monsterTruckSrc).toContain('targetLean');
      expect(monsterTruckSrc).toContain('BODY_LEAN_FACTOR');
    });

    it('body lean is smoothed via lerp', () => {
      expect(monsterTruckSrc).toContain('bodyLean.current = THREE.MathUtils.lerp(bodyLean.current');
    });

    it('body pitch responds to acceleration/braking', () => {
      expect(monsterTruckSrc).toContain('targetPitch');
      expect(monsterTruckSrc).toContain('BODY_PITCH_FACTOR');
    });

    it('chassis rotation includes lean (roll) and pitch', () => {
      // Euler should use (pitch, yaw, roll) — bodyPitch, currentRotation, bodyLean
      expect(monsterTruckSrc).toContain('bodyPitch.current, currentRotation.current, bodyLean.current');
    });
  });

  // ──────────────────────────────────────────────
  // No regression: core physics preserved
  // ──────────────────────────────────────────────

  describe('No regression — core systems preserved', () => {
    it('speed factor still uses MAX_SPEED', () => {
      expect(monsterTruckSrc).toContain('Math.abs(currentSpeed.current) / MAX_SPEED');
    });

    it('TURN_SPEED_REDUCTION still applies', () => {
      expect(monsterTruckSrc).toContain('TURN_SPEED_REDUCTION');
      expect(monsterTruckSrc).toContain('turnMultiplier');
    });

    it('auto-straightening still works for kids', () => {
      expect(monsterTruckSrc).toContain('AUTO_STRAIGHTEN');
    });

    it('frame-rate independent friction still applied', () => {
      expect(monsterTruckSrc).toContain('Math.pow(FRICTION, delta * 60)');
    });

    it('drift state machine still intact', () => {
      expect(monsterTruckSrc).toContain("driftState.current === 'drifting'");
      expect(monsterTruckSrc).toContain("driftState.current = 'mini-turbo'");
    });

    it('ground height lerp still uses 4/s rate', () => {
      expect(monsterTruckSrc).toContain('const lerpSpeed = 4');
    });

    it('gravity still aligned at 25', () => {
      expect(monsterTruckSrc).toMatch(/const GRAVITY = 25/);
    });

    it('particles still rendered for player', () => {
      expect(monsterTruckSrc).toContain('<DustTrail');
      expect(monsterTruckSrc).toContain('<BoostFlame');
      expect(monsterTruckSrc).toContain('<DriftSparks');
    });
  });
});
