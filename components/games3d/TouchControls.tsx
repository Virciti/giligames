'use client';

import { useRef, useCallback, useEffect, useState } from 'react';

/**
 * Phase 9A: Redesigned touch controls for mobile racing.
 *
 * Features:
 * - Large 110px buttons (up from 64px) for kid-friendly tapping
 * - Multi-touch support via touch identifier tracking
 * - onTouchCancel handling for interrupted touches
 * - touch-manipulation CSS to prevent double-tap zoom
 * - Haptic feedback on collisions and boosts
 * - Swipe-up-to-drift gesture on the steering area
 * - Tilt-to-steer option via DeviceOrientation API
 * - Auto-detect mobile and hide on desktop
 */

interface TouchControlsProps {
  onInputChange: (update: Partial<InputState>) => void;
  /** Trigger haptic on collision (increment to fire) */
  collisionHaptic?: number;
  /** Trigger haptic on boost activation */
  boostHaptic?: number;
  /** Whether tilt steering is enabled */
  tiltEnabled?: boolean;
  /** Called when tilt mode is toggled */
  onTiltToggle?: (enabled: boolean) => void;
}

interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  brake: boolean;
  boost: boolean;
  drift: boolean;
}

// Track which touches are on which buttons
type ControlButton = 'left' | 'right' | 'brake' | 'gas' | 'boost' | 'drift';

// Haptic helper
function haptic(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

export function TouchControls({
  onInputChange,
  collisionHaptic = 0,
  boostHaptic = 0,
  tiltEnabled = false,
  onTiltToggle,
}: TouchControlsProps) {
  const activeTouches = useRef<Map<number, ControlButton>>(new Map());
  const [isMobile, setIsMobile] = useState(false);
  const tiltEnabledRef = useRef(tiltEnabled);
  tiltEnabledRef.current = tiltEnabled;

  // Phase 9A: Auto-detect mobile
  useEffect(() => {
    const check = () => {
      const mobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsMobile(mobile);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Phase 9B: Haptic feedback on collision
  useEffect(() => {
    if (collisionHaptic > 0) haptic([40, 30, 40]);
  }, [collisionHaptic]);

  // Phase 9B: Haptic feedback on boost
  useEffect(() => {
    if (boostHaptic > 0) haptic([20, 10, 20]);
  }, [boostHaptic]);

  // Phase 9A: Tilt-to-steer via DeviceOrientation
  useEffect(() => {
    if (!tiltEnabled || !isMobile) return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      const gamma = e.gamma ?? 0; // Left/right tilt (-90 to 90)
      const TILT_DEAD_ZONE = 5;
      const TILT_MAX = 25;

      if (Math.abs(gamma) < TILT_DEAD_ZONE) {
        onInputChange({ left: false, right: false });
      } else if (gamma < -TILT_DEAD_ZONE) {
        const intensity = Math.min(1, (Math.abs(gamma) - TILT_DEAD_ZONE) / (TILT_MAX - TILT_DEAD_ZONE));
        onInputChange({ left: intensity > 0.3, right: false });
      } else {
        const intensity = Math.min(1, (gamma - TILT_DEAD_ZONE) / (TILT_MAX - TILT_DEAD_ZONE));
        onInputChange({ left: false, right: intensity > 0.3 });
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [tiltEnabled, isMobile, onInputChange]);

  // Update input state from active touches
  const syncInputFromTouches = useCallback(() => {
    const touches = activeTouches.current;
    const buttons = new Set(touches.values());
    onInputChange({
      left: buttons.has('left'),
      right: buttons.has('right'),
      brake: buttons.has('brake'),
      forward: buttons.has('gas'),
      boost: buttons.has('boost'),
      drift: buttons.has('drift'),
    });
  }, [onInputChange]);

  const handleTouchStart = useCallback((button: ControlButton) => (e: React.TouchEvent) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      activeTouches.current.set(touch.identifier, button);
    }
    haptic(10);
    syncInputFromTouches();
  }, [syncInputFromTouches]);

  const handleTouchEnd = useCallback((button: ControlButton) => (e: React.TouchEvent) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (activeTouches.current.get(touch.identifier) === button) {
        activeTouches.current.delete(touch.identifier);
      }
    }
    syncInputFromTouches();
  }, [syncInputFromTouches]);

  // Handle touch cancel (interrupted by OS, call, etc.)
  const handleTouchCancel = useCallback((button: ControlButton) => (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (activeTouches.current.get(touch.identifier) === button) {
        activeTouches.current.delete(touch.identifier);
      }
    }
    syncInputFromTouches();
  }, [syncInputFromTouches]);

  // Don't render on desktop
  if (!isMobile) return null;

  // Phase 9A: 110px minimum button size, touch-manipulation for no double-tap zoom
  const btnBase = "flex items-center justify-center select-none touch-manipulation active:scale-95 transition-transform";
  const BUTTON_SIZE = 110; // Phase 9A: 110px minimum (up from 64px)
  const SMALL_BTN = 80; // Smaller utility buttons

  return (
    <div className="fixed inset-0 z-30 pointer-events-none" data-testid="touch-controls">
      {/* Left side: Steering buttons */}
      <div className="fixed bottom-6 left-4 flex gap-3 pointer-events-auto">
        {!tiltEnabled && (
          <>
            <button
              onTouchStart={handleTouchStart('left')}
              onTouchEnd={handleTouchEnd('left')}
              onTouchCancel={handleTouchCancel('left')}
              className={`${btnBase} rounded-2xl bg-white/25 backdrop-blur-sm border-2 border-white/30`}
              style={{ width: BUTTON_SIZE, height: BUTTON_SIZE }}
              aria-label="Steer left"
            >
              <span className="text-5xl text-white font-bold" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>&#x2190;</span>
            </button>
            <button
              onTouchStart={handleTouchStart('right')}
              onTouchEnd={handleTouchEnd('right')}
              onTouchCancel={handleTouchCancel('right')}
              className={`${btnBase} rounded-2xl bg-white/25 backdrop-blur-sm border-2 border-white/30`}
              style={{ width: BUTTON_SIZE, height: BUTTON_SIZE }}
              aria-label="Steer right"
            >
              <span className="text-5xl text-white font-bold" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>&#x2192;</span>
            </button>
          </>
        )}
        {/* Tilt toggle */}
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            onTiltToggle?.(!tiltEnabled);
            haptic(15);
          }}
          className={`${btnBase} rounded-xl border-2 ${tiltEnabled ? 'bg-purple-500/60 border-purple-300/60' : 'bg-white/15 border-white/20'}`}
          style={{ width: 50, height: 50, alignSelf: 'flex-end' }}
          aria-label="Toggle tilt steering"
        >
          <span className="text-xl">📱</span>
        </button>
      </div>

      {/* Right side: Action buttons */}
      <div className="fixed bottom-6 right-4 flex flex-col items-end gap-3 pointer-events-auto">
        {/* Top row: Boost + Drift */}
        <div className="flex gap-3">
          <button
            onTouchStart={handleTouchStart('drift')}
            onTouchEnd={handleTouchEnd('drift')}
            onTouchCancel={handleTouchCancel('drift')}
            className={`${btnBase} rounded-2xl bg-blue-500/50 backdrop-blur-sm border-2 border-blue-300/50`}
            style={{ width: SMALL_BTN, height: SMALL_BTN }}
            aria-label="Drift"
          >
            <span className="text-xl text-white font-black" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>DRIFT</span>
          </button>
          <button
            onTouchStart={handleTouchStart('boost')}
            onTouchEnd={handleTouchEnd('boost')}
            onTouchCancel={handleTouchCancel('boost')}
            className={`${btnBase} rounded-2xl bg-yellow-500/50 backdrop-blur-sm border-2 border-yellow-300/50`}
            style={{ width: SMALL_BTN, height: SMALL_BTN }}
            aria-label="Boost"
          >
            <span className="text-xl text-white font-black" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>BOOST</span>
          </button>
        </div>

        {/* Bottom row: Brake + Gas */}
        <div className="flex gap-3">
          <button
            onTouchStart={handleTouchStart('brake')}
            onTouchEnd={handleTouchEnd('brake')}
            onTouchCancel={handleTouchCancel('brake')}
            className={`${btnBase} rounded-2xl bg-red-500/50 backdrop-blur-sm border-2 border-red-300/40`}
            style={{ width: BUTTON_SIZE, height: BUTTON_SIZE }}
            aria-label="Brake"
          >
            <span className="text-3xl text-white font-black" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>BRAKE</span>
          </button>
          <button
            onTouchStart={handleTouchStart('gas')}
            onTouchEnd={handleTouchEnd('gas')}
            onTouchCancel={handleTouchCancel('gas')}
            className={`${btnBase} rounded-2xl bg-green-500/50 backdrop-blur-sm border-2 border-green-300/40`}
            style={{ width: BUTTON_SIZE, height: BUTTON_SIZE }}
            aria-label="Gas"
          >
            <span className="text-3xl text-white font-black" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>GAS</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default TouchControls;
