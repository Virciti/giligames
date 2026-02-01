'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Gauge,
  CircleStop,
  Pause,
} from 'lucide-react';
import { useGameStore } from '@/lib/stores';
import type { InputState } from '@/lib/game/types';

// ============================================================
// Types
// ============================================================

interface RaceControlsProps {
  onInputChange: (input: Partial<InputState>) => void;
  onPause: () => void;
}

type ControlButton = 'left' | 'right' | 'accelerate' | 'brake';

// ============================================================
// Styles
// ============================================================

const buttonBase = `
  w-20 h-20 rounded-full flex items-center justify-center
  shadow-lg transition-all duration-100
  active:scale-95 select-none touch-manipulation
`;

const steeringButton = `
  ${buttonBase}
  bg-white/90 backdrop-blur-sm
`;

const accelerateButton = `
  ${buttonBase}
  bg-brand-green text-white
`;

const brakeButton = `
  ${buttonBase}
  bg-brand-red text-white
`;

const pauseButton = `
  w-14 h-14 rounded-full flex items-center justify-center
  bg-white/80 backdrop-blur-sm shadow-lg
  active:scale-95 transition-transform touch-manipulation
`;

// ============================================================
// Component
// ============================================================

export function RaceControls({ onInputChange, onPause }: RaceControlsProps) {
  const { controlLayout, autoAccelerate } = useGameStore();

  // Track active buttons
  const [activeButtons, setActiveButtons] = useState<Set<ControlButton>>(new Set());

  // Refs for touch handling
  const touchStateRef = useRef<Map<number, ControlButton>>(new Map());

  // Handle button press
  const handlePress = useCallback(
    (button: ControlButton) => {
      setActiveButtons((prev) => {
        const next = new Set(prev);
        next.add(button);
        return next;
      });

      // Update input state
      const inputUpdate: Partial<InputState> = {};
      switch (button) {
        case 'left':
          inputUpdate.left = true;
          break;
        case 'right':
          inputUpdate.right = true;
          break;
        case 'accelerate':
          inputUpdate.up = true;
          break;
        case 'brake':
          inputUpdate.down = true;
          break;
      }
      onInputChange(inputUpdate);
    },
    [onInputChange]
  );

  // Handle button release
  const handleRelease = useCallback(
    (button: ControlButton) => {
      setActiveButtons((prev) => {
        const next = new Set(prev);
        next.delete(button);
        return next;
      });

      // Update input state
      const inputUpdate: Partial<InputState> = {};
      switch (button) {
        case 'left':
          inputUpdate.left = false;
          break;
        case 'right':
          inputUpdate.right = false;
          break;
        case 'accelerate':
          inputUpdate.up = false;
          break;
        case 'brake':
          inputUpdate.down = false;
          break;
      }
      onInputChange(inputUpdate);
    },
    [onInputChange]
  );

  // Touch event handlers
  const handleTouchStart = useCallback(
    (button: ControlButton) => (e: React.TouchEvent) => {
      e.preventDefault();
      Array.from(e.changedTouches).forEach((touch) => {
        touchStateRef.current.set(touch.identifier, button);
      });
      handlePress(button);
    },
    [handlePress]
  );

  const handleTouchEnd = useCallback(
    (button: ControlButton) => (e: React.TouchEvent) => {
      e.preventDefault();
      Array.from(e.changedTouches).forEach((touch) => {
        touchStateRef.current.delete(touch.identifier);
      });
      handleRelease(button);
    },
    [handleRelease]
  );

  // Mouse event handlers (for desktop testing)
  const handleMouseDown = useCallback(
    (button: ControlButton) => (e: React.MouseEvent) => {
      e.preventDefault();
      handlePress(button);
    },
    [handlePress]
  );

  const handleMouseUp = useCallback(
    (button: ControlButton) => (e: React.MouseEvent) => {
      e.preventDefault();
      handleRelease(button);
    },
    [handleRelease]
  );

  const handleMouseLeave = useCallback(
    (button: ControlButton) => () => {
      if (activeButtons.has(button)) {
        handleRelease(button);
      }
    },
    [activeButtons, handleRelease]
  );

  // Auto-accelerate effect
  useEffect(() => {
    if (autoAccelerate) {
      onInputChange({ up: true });
    }
    return () => {
      if (autoAccelerate) {
        onInputChange({ up: false });
      }
    };
  }, [autoAccelerate, onInputChange]);

  // Determine layout
  const isLeftLayout = controlLayout === 'left';
  const isBothLayout = controlLayout === 'both';

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Pause Button - Top Right */}
      <div className="absolute top-4 right-4 pointer-events-auto">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onPause}
          className={pauseButton}
          aria-label="Pause game"
        >
          <Pause className="w-6 h-6 text-gray-700" />
        </motion.button>
      </div>

      {/* Controls Container */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-auto">
        <div className="flex justify-between items-end">
          {/* Left Side Controls */}
          <div className={`flex gap-2 ${isLeftLayout || isBothLayout ? '' : 'opacity-0 pointer-events-none'}`}>
            {/* Steering (Left Layout or Both) */}
            {(isLeftLayout || isBothLayout) && (
              <div className="flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onTouchStart={handleTouchStart('left')}
                  onTouchEnd={handleTouchEnd('left')}
                  onTouchCancel={handleTouchEnd('left')}
                  onMouseDown={handleMouseDown('left')}
                  onMouseUp={handleMouseUp('left')}
                  onMouseLeave={handleMouseLeave('left')}
                  className={`${steeringButton} ${activeButtons.has('left') ? 'bg-brand-blue/90 text-white' : ''}`}
                  aria-label="Steer left"
                >
                  <ChevronLeft className="w-10 h-10" strokeWidth={3} />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onTouchStart={handleTouchStart('right')}
                  onTouchEnd={handleTouchEnd('right')}
                  onTouchCancel={handleTouchEnd('right')}
                  onMouseDown={handleMouseDown('right')}
                  onMouseUp={handleMouseUp('right')}
                  onMouseLeave={handleMouseLeave('right')}
                  className={`${steeringButton} ${activeButtons.has('right') ? 'bg-brand-blue/90 text-white' : ''}`}
                  aria-label="Steer right"
                >
                  <ChevronRight className="w-10 h-10" strokeWidth={3} />
                </motion.button>
              </div>
            )}

            {/* Accelerate/Brake on left (Right Layout) */}
            {!isLeftLayout && !isBothLayout && (
              <div className="flex flex-col gap-2">
                {!autoAccelerate && (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onTouchStart={handleTouchStart('accelerate')}
                    onTouchEnd={handleTouchEnd('accelerate')}
                    onTouchCancel={handleTouchEnd('accelerate')}
                    onMouseDown={handleMouseDown('accelerate')}
                    onMouseUp={handleMouseUp('accelerate')}
                    onMouseLeave={handleMouseLeave('accelerate')}
                    className={`${accelerateButton} ${activeButtons.has('accelerate') ? 'brightness-110 scale-105' : ''}`}
                    aria-label="Accelerate"
                  >
                    <Gauge className="w-10 h-10" />
                  </motion.button>
                )}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onTouchStart={handleTouchStart('brake')}
                  onTouchEnd={handleTouchEnd('brake')}
                  onTouchCancel={handleTouchEnd('brake')}
                  onMouseDown={handleMouseDown('brake')}
                  onMouseUp={handleMouseUp('brake')}
                  onMouseLeave={handleMouseLeave('brake')}
                  className={`${brakeButton} ${activeButtons.has('brake') ? 'brightness-110 scale-105' : ''}`}
                  aria-label="Brake"
                >
                  <CircleStop className="w-10 h-10" />
                </motion.button>
              </div>
            )}
          </div>

          {/* Right Side Controls */}
          <div className={`flex gap-2 ${!isLeftLayout || isBothLayout ? '' : 'opacity-0 pointer-events-none'}`}>
            {/* Accelerate/Brake on right (Left Layout) */}
            {isLeftLayout && (
              <div className="flex flex-col gap-2">
                {!autoAccelerate && (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onTouchStart={handleTouchStart('accelerate')}
                    onTouchEnd={handleTouchEnd('accelerate')}
                    onTouchCancel={handleTouchEnd('accelerate')}
                    onMouseDown={handleMouseDown('accelerate')}
                    onMouseUp={handleMouseUp('accelerate')}
                    onMouseLeave={handleMouseLeave('accelerate')}
                    className={`${accelerateButton} ${activeButtons.has('accelerate') ? 'brightness-110 scale-105' : ''}`}
                    aria-label="Accelerate"
                  >
                    <Gauge className="w-10 h-10" />
                  </motion.button>
                )}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onTouchStart={handleTouchStart('brake')}
                  onTouchEnd={handleTouchEnd('brake')}
                  onTouchCancel={handleTouchEnd('brake')}
                  onMouseDown={handleMouseDown('brake')}
                  onMouseUp={handleMouseUp('brake')}
                  onMouseLeave={handleMouseLeave('brake')}
                  className={`${brakeButton} ${activeButtons.has('brake') ? 'brightness-110 scale-105' : ''}`}
                  aria-label="Brake"
                >
                  <CircleStop className="w-10 h-10" />
                </motion.button>
              </div>
            )}

            {/* Steering (Right Layout or Both) */}
            {(!isLeftLayout || isBothLayout) && (
              <div className="flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onTouchStart={handleTouchStart('left')}
                  onTouchEnd={handleTouchEnd('left')}
                  onTouchCancel={handleTouchEnd('left')}
                  onMouseDown={handleMouseDown('left')}
                  onMouseUp={handleMouseUp('left')}
                  onMouseLeave={handleMouseLeave('left')}
                  className={`${steeringButton} ${activeButtons.has('left') ? 'bg-brand-blue/90 text-white' : ''}`}
                  aria-label="Steer left"
                >
                  <ChevronLeft className="w-10 h-10" strokeWidth={3} />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onTouchStart={handleTouchStart('right')}
                  onTouchEnd={handleTouchEnd('right')}
                  onTouchCancel={handleTouchEnd('right')}
                  onMouseDown={handleMouseDown('right')}
                  onMouseUp={handleMouseUp('right')}
                  onMouseLeave={handleMouseLeave('right')}
                  className={`${steeringButton} ${activeButtons.has('right') ? 'bg-brand-blue/90 text-white' : ''}`}
                  aria-label="Steer right"
                >
                  <ChevronRight className="w-10 h-10" strokeWidth={3} />
                </motion.button>
              </div>
            )}

            {/* Accelerate/Brake (Both Layout - right side) */}
            {isBothLayout && (
              <div className="flex flex-col gap-2">
                {!autoAccelerate && (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onTouchStart={handleTouchStart('accelerate')}
                    onTouchEnd={handleTouchEnd('accelerate')}
                    onTouchCancel={handleTouchEnd('accelerate')}
                    onMouseDown={handleMouseDown('accelerate')}
                    onMouseUp={handleMouseUp('accelerate')}
                    onMouseLeave={handleMouseLeave('accelerate')}
                    className={`${accelerateButton} ${activeButtons.has('accelerate') ? 'brightness-110 scale-105' : ''}`}
                    aria-label="Accelerate"
                  >
                    <Gauge className="w-10 h-10" />
                  </motion.button>
                )}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onTouchStart={handleTouchStart('brake')}
                  onTouchEnd={handleTouchEnd('brake')}
                  onTouchCancel={handleTouchEnd('brake')}
                  onMouseDown={handleMouseDown('brake')}
                  onMouseUp={handleMouseUp('brake')}
                  onMouseLeave={handleMouseLeave('brake')}
                  className={`${brakeButton} ${activeButtons.has('brake') ? 'brightness-110 scale-105' : ''}`}
                  aria-label="Brake"
                >
                  <CircleStop className="w-10 h-10" />
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Auto-accelerate indicator */}
      {autoAccelerate && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="bg-brand-green/80 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
            AUTO
          </div>
        </div>
      )}
    </div>
  );
}

export default RaceControls;
