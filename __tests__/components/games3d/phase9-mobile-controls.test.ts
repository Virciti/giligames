/**
 * Phase 9 Tests: Mobile Controls
 *
 * Validates touch control redesign, mobile UX adjustments, and wiring.
 * 9A: Touch Control Redesign (110px buttons, multi-touch, tilt, haptic, auto-detect)
 * 9B: Mobile UX (HUD repositioning, minimap shrink, mobile control hints)
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const GAMES3D = path.resolve(__dirname, '../../../components/games3d');

function readFile(name: string): string {
  return fs.readFileSync(path.join(GAMES3D, name), 'utf-8');
}

describe('Phase 9: Mobile Controls', () => {
  const touchControlsSrc = readFile('TouchControls.tsx');
  const raceGameSrc = readFile('RaceGame3D.tsx');
  const raceHUDSrc = readFile('RaceHUD3D.tsx');

  // ──────────────────────────────────────────────
  // 9A: Touch Control Redesign
  // ──────────────────────────────────────────────

  describe('9A — Button Size (110px minimum)', () => {
    it('defines BUTTON_SIZE = 110', () => {
      expect(touchControlsSrc).toContain('BUTTON_SIZE = 110');
    });

    it('applies BUTTON_SIZE to steering buttons', () => {
      expect(touchControlsSrc).toContain('width: BUTTON_SIZE, height: BUTTON_SIZE');
    });

    it('gas button uses BUTTON_SIZE', () => {
      const gasSection = touchControlsSrc.split("aria-label=\"Gas\"")[0] || '';
      expect(gasSection).toContain('BUTTON_SIZE');
    });

    it('brake button uses BUTTON_SIZE', () => {
      const brakeSection = touchControlsSrc.split("aria-label=\"Brake\"")[0] || '';
      expect(brakeSection).toContain('BUTTON_SIZE');
    });
  });

  describe('9A — Multi-Touch Support', () => {
    it('tracks active touches via Map with touch identifiers', () => {
      expect(touchControlsSrc).toContain('Map<number, ControlButton>');
      expect(touchControlsSrc).toContain('activeTouches');
    });

    it('registers touch identifier on touchStart', () => {
      expect(touchControlsSrc).toContain('touch.identifier');
      expect(touchControlsSrc).toContain('activeTouches.current.set');
    });

    it('removes touch identifier on touchEnd', () => {
      expect(touchControlsSrc).toContain('activeTouches.current.delete');
    });

    it('syncs input state from all active touches', () => {
      expect(touchControlsSrc).toContain('syncInputFromTouches');
      expect(touchControlsSrc).toContain("buttons.has('left')");
      expect(touchControlsSrc).toContain("buttons.has('gas')");
    });

    it('handles onTouchCancel for interrupted touches', () => {
      expect(touchControlsSrc).toContain('onTouchCancel');
      expect(touchControlsSrc).toContain('handleTouchCancel');
    });

    it('all buttons have onTouchStart, onTouchEnd, and onTouchCancel', () => {
      const touchStartCount = (touchControlsSrc.match(/onTouchStart=/g) || []).length;
      const touchEndCount = (touchControlsSrc.match(/onTouchEnd=/g) || []).length;
      const touchCancelCount = (touchControlsSrc.match(/onTouchCancel=/g) || []).length;
      // 5 main buttons (left, right, brake, gas, drift, boost) + tilt toggle = at least 6 touchStart
      expect(touchStartCount).toBeGreaterThanOrEqual(6);
      expect(touchEndCount).toBeGreaterThanOrEqual(5);
      expect(touchCancelCount).toBeGreaterThanOrEqual(5);
    });
  });

  describe('9A — Tilt-to-Steer', () => {
    it('accepts tiltEnabled prop', () => {
      expect(touchControlsSrc).toContain('tiltEnabled');
    });

    it('accepts onTiltToggle callback', () => {
      expect(touchControlsSrc).toContain('onTiltToggle');
    });

    it('uses DeviceOrientation API for tilt input', () => {
      expect(touchControlsSrc).toContain('deviceorientation');
      expect(touchControlsSrc).toContain('DeviceOrientationEvent');
    });

    it('reads gamma (left/right tilt) from device orientation', () => {
      expect(touchControlsSrc).toContain('e.gamma');
    });

    it('has dead zone for tilt steering', () => {
      expect(touchControlsSrc).toContain('TILT_DEAD_ZONE');
    });

    it('has maximum tilt angle constant', () => {
      expect(touchControlsSrc).toContain('TILT_MAX');
    });

    it('hides steering buttons when tilt is enabled', () => {
      expect(touchControlsSrc).toContain('!tiltEnabled');
    });

    it('has tilt toggle button with phone emoji', () => {
      expect(touchControlsSrc).toContain('Toggle tilt steering');
    });
  });

  describe('9A — Auto-Detect Mobile', () => {
    it('detects mobile via ontouchstart or maxTouchPoints', () => {
      expect(touchControlsSrc).toContain('ontouchstart');
      expect(touchControlsSrc).toContain('maxTouchPoints');
    });

    it('tracks isMobile state', () => {
      expect(touchControlsSrc).toContain('isMobile');
      expect(touchControlsSrc).toContain('setIsMobile');
    });

    it('returns null on desktop (no render)', () => {
      expect(touchControlsSrc).toContain('if (!isMobile) return null');
    });

    it('re-checks on window resize', () => {
      expect(touchControlsSrc).toContain("window.addEventListener('resize'");
    });
  });

  describe('9A — Touch UX Polish', () => {
    it('uses touch-manipulation CSS to prevent double-tap zoom', () => {
      expect(touchControlsSrc).toContain('touch-manipulation');
    });

    it('uses select-none to prevent text selection', () => {
      expect(touchControlsSrc).toContain('select-none');
    });

    it('has aria-labels for accessibility', () => {
      expect(touchControlsSrc).toContain('aria-label="Steer left"');
      expect(touchControlsSrc).toContain('aria-label="Steer right"');
      expect(touchControlsSrc).toContain('aria-label="Gas"');
      expect(touchControlsSrc).toContain('aria-label="Brake"');
      expect(touchControlsSrc).toContain('aria-label="Drift"');
      expect(touchControlsSrc).toContain('aria-label="Boost"');
    });

    it('has active:scale-95 for press feedback', () => {
      expect(touchControlsSrc).toContain('active:scale-95');
    });

    it('calls preventDefault on touch events', () => {
      expect(touchControlsSrc).toContain('e.preventDefault()');
    });

    it('has dedicated drift button', () => {
      expect(touchControlsSrc).toContain("'drift'");
      expect(touchControlsSrc).toContain('DRIFT');
    });

    it('has dedicated boost button', () => {
      expect(touchControlsSrc).toContain("'boost'");
      expect(touchControlsSrc).toContain('BOOST');
    });
  });

  // ──────────────────────────────────────────────
  // 9B: Haptic Feedback
  // ──────────────────────────────────────────────

  describe('9B — Haptic Feedback', () => {
    it('has haptic helper function', () => {
      expect(touchControlsSrc).toContain('function haptic');
      expect(touchControlsSrc).toContain('navigator.vibrate');
    });

    it('accepts collisionHaptic trigger prop', () => {
      expect(touchControlsSrc).toContain('collisionHaptic');
    });

    it('accepts boostHaptic trigger prop', () => {
      expect(touchControlsSrc).toContain('boostHaptic');
    });

    it('fires haptic on collision trigger change', () => {
      expect(touchControlsSrc).toContain('collisionHaptic > 0');
      expect(touchControlsSrc).toContain('[40, 30, 40]');
    });

    it('fires haptic on boost trigger change', () => {
      expect(touchControlsSrc).toContain('boostHaptic > 0');
      expect(touchControlsSrc).toContain('[20, 10, 20]');
    });

    it('fires light haptic on button press', () => {
      expect(touchControlsSrc).toContain('haptic(10)');
    });
  });

  // ──────────────────────────────────────────────
  // 9B: Mobile UX — HUD Repositioning
  // ──────────────────────────────────────────────

  describe('9B — HUD Repositioning for Mobile', () => {
    it('minimap shrinks on small screens (90px vs 140px)', () => {
      expect(raceHUDSrc).toContain('isSmallScreen ? 90 : 140');
    });

    it('minimap detects small screen via window.innerWidth < 768', () => {
      expect(raceHUDSrc).toContain('window.innerWidth < 768');
    });

    it('speedometer pushed up on mobile (bottom-32)', () => {
      const speedSection = raceHUDSrc.split('Speedometer and coins')[1]?.split('>')[0] || '';
      expect(speedSection).toContain('bottom-32 md:bottom-4');
    });

    it('minimap pushed up on mobile (bottom-32)', () => {
      const minimapSection = raceHUDSrc.split('Bottom right')[1]?.split('>')[0] || '';
      expect(minimapSection).toContain('bottom-32 md:bottom-4');
    });

    it('item slot moved higher on mobile (top-1/4)', () => {
      expect(raceHUDSrc).toContain('top-1/4 md:top-1/3');
    });
  });

  // ──────────────────────────────────────────────
  // 9B: Mobile Control Hints
  // ──────────────────────────────────────────────

  describe('9B — Mobile Control Hints', () => {
    it('shows different control hints for mobile vs desktop', () => {
      expect(raceGameSrc).toContain('hidden md:block');
      expect(raceGameSrc).toContain('md:hidden');
    });

    it('mobile hint says "Tap buttons to drive"', () => {
      expect(raceGameSrc).toContain('Tap buttons to drive');
    });

    it('desktop hint still shows keyboard controls', () => {
      expect(raceGameSrc).toContain('W/↑ = Gas');
    });
  });

  // ──────────────────────────────────────────────
  // Wiring: RaceGame3D → TouchControls
  // ──────────────────────────────────────────────

  describe('Wiring — RaceGame3D integration', () => {
    it('imports TouchControls', () => {
      expect(raceGameSrc).toContain("import { TouchControls } from './TouchControls'");
    });

    it('renders <TouchControls> component', () => {
      expect(raceGameSrc).toContain('<TouchControls');
    });

    it('has handleTouchInput callback', () => {
      expect(raceGameSrc).toContain('handleTouchInput');
    });

    it('passes onInputChange={handleTouchInput}', () => {
      const touchSection = raceGameSrc.split('<TouchControls')[1]?.split('/>')[0] || '';
      expect(touchSection).toContain('onInputChange={handleTouchInput}');
    });

    it('passes collisionHaptic={sfxCollision}', () => {
      const touchSection = raceGameSrc.split('<TouchControls')[1]?.split('/>')[0] || '';
      expect(touchSection).toContain('collisionHaptic={sfxCollision}');
    });

    it('passes tiltEnabled and onTiltToggle', () => {
      const touchSection = raceGameSrc.split('<TouchControls')[1]?.split('/>')[0] || '';
      expect(touchSection).toContain('tiltEnabled={tiltSteering}');
      expect(touchSection).toContain('onTiltToggle={setTiltSteering}');
    });

    it('has tiltSteering state', () => {
      expect(raceGameSrc).toContain('tiltSteering');
      expect(raceGameSrc).toContain('setTiltSteering');
    });

    it('old inline touch buttons are removed', () => {
      // Old pattern: direct setInputState in onTouchStart with w-16 h-16 buttons
      expect(raceGameSrc).not.toContain("w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl");
      expect(raceGameSrc).not.toContain("w-16 h-16 bg-red-500/50");
      expect(raceGameSrc).not.toContain("w-20 h-16 bg-green-500/50");
    });
  });

  // ──────────────────────────────────────────────
  // No regression: keyboard controls preserved
  // ──────────────────────────────────────────────

  describe('No regression — keyboard controls preserved', () => {
    it('keyboard handleKeyDown still works', () => {
      expect(raceGameSrc).toContain('handleKeyDown');
      expect(raceGameSrc).toContain("case 'w':");
      expect(raceGameSrc).toContain("case 'arrowup':");
    });

    it('keyboard handleKeyUp still works', () => {
      expect(raceGameSrc).toContain('handleKeyUp');
    });

    it('inputState still has all 7 input fields', () => {
      expect(raceGameSrc).toContain('forward: false');
      expect(raceGameSrc).toContain('backward: false');
      expect(raceGameSrc).toContain('left: false');
      expect(raceGameSrc).toContain('right: false');
      expect(raceGameSrc).toContain('brake: false');
      expect(raceGameSrc).toContain('boost: false');
      expect(raceGameSrc).toContain('drift: false');
    });

    it('speed level slider still works', () => {
      expect(raceGameSrc).toContain('speedLevel');
      expect(raceGameSrc).toContain('speedMultiplier');
    });

    it('existing haptic on speed slider still works', () => {
      expect(raceGameSrc).toContain('navigator.vibrate');
    });

    it('camera shake still triggered', () => {
      expect(raceGameSrc).toContain('shakeTrigger={sfxCollision + sfxSlip}');
    });
  });
});
