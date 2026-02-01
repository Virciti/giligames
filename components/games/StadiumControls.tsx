'use client';

import { useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ChevronUp, Pause } from 'lucide-react';
import { useGameStore, type ControlLayout } from '@/lib/stores';

// ============================================================
// Types
// ============================================================

export interface StadiumControlsProps {
  onMoveLeft: (active: boolean) => void;
  onMoveRight: (active: boolean) => void;
  onJump: (active: boolean) => void;
  onPause: () => void;
  disabled?: boolean;
}

interface ControlButtonProps {
  onPress: () => void;
  onRelease: () => void;
  icon: React.ReactNode;
  label: string;
  className?: string;
  disabled?: boolean;
}

// ============================================================
// Control Button Component
// ============================================================

function ControlButton({
  onPress,
  onRelease,
  icon,
  label,
  className = '',
  disabled = false,
}: ControlButtonProps) {
  const isPressed = useRef(false);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      if (disabled || isPressed.current) return;
      isPressed.current = true;
      onPress();
    },
    [onPress, disabled]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      if (!isPressed.current) return;
      isPressed.current = false;
      onRelease();
    },
    [onRelease]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (disabled || isPressed.current) return;
      isPressed.current = true;
      onPress();
    },
    [onPress, disabled]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (!isPressed.current) return;
      isPressed.current = false;
      onRelease();
    },
    [onRelease]
  );

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent) => {
      if (!isPressed.current) return;
      isPressed.current = false;
      onRelease();
    },
    [onRelease]
  );

  return (
    <motion.button
      className={`
        w-16 h-16 min-w-[64px] min-h-[64px]
        flex items-center justify-center
        bg-white/20 backdrop-blur-sm
        rounded-2xl
        text-white
        border-2 border-white/30
        active:bg-white/40 active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed
        select-none touch-none
        transition-colors
        ${className}
      `}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      whileTap={{ scale: 0.9 }}
      disabled={disabled}
      aria-label={label}
      aria-pressed={isPressed.current}
    >
      {icon}
    </motion.button>
  );
}

// ============================================================
// Pause Button Component
// ============================================================

function PauseButton({ onPause, disabled }: { onPause: () => void; disabled?: boolean }) {
  return (
    <motion.button
      className={`
        w-14 h-14 min-w-[56px] min-h-[56px]
        flex items-center justify-center
        bg-black/40 backdrop-blur-sm
        rounded-xl
        text-white
        border border-white/20
        active:bg-black/60
        disabled:opacity-50
        select-none touch-none
      `}
      onClick={onPause}
      whileTap={{ scale: 0.9 }}
      disabled={disabled}
      aria-label="Pause game"
    >
      <Pause className="w-6 h-6" strokeWidth={2.5} />
    </motion.button>
  );
}

// ============================================================
// Movement Controls Component
// ============================================================

interface MovementControlsProps {
  onMoveLeft: (active: boolean) => void;
  onMoveRight: (active: boolean) => void;
  disabled?: boolean;
}

function MovementControls({ onMoveLeft, onMoveRight, disabled }: MovementControlsProps) {
  return (
    <div className="flex gap-3">
      <ControlButton
        onPress={() => onMoveLeft(true)}
        onRelease={() => onMoveLeft(false)}
        icon={<ChevronLeft className="w-10 h-10" strokeWidth={3} />}
        label="Move left"
        disabled={disabled}
      />
      <ControlButton
        onPress={() => onMoveRight(true)}
        onRelease={() => onMoveRight(false)}
        icon={<ChevronRight className="w-10 h-10" strokeWidth={3} />}
        label="Move right"
        disabled={disabled}
      />
    </div>
  );
}

// ============================================================
// Jump Button Component
// ============================================================

interface JumpButtonProps {
  onJump: (active: boolean) => void;
  disabled?: boolean;
}

function JumpButton({ onJump, disabled }: JumpButtonProps) {
  return (
    <ControlButton
      onPress={() => onJump(true)}
      onRelease={() => onJump(false)}
      icon={<ChevronUp className="w-10 h-10" strokeWidth={3} />}
      label="Jump"
      className="w-20 h-20 min-w-[80px] min-h-[80px] bg-brand-green/40 border-brand-green/50"
      disabled={disabled}
    />
  );
}

// ============================================================
// Layout Components
// ============================================================

interface LayoutProps {
  onMoveLeft: (active: boolean) => void;
  onMoveRight: (active: boolean) => void;
  onJump: (active: boolean) => void;
  onPause: () => void;
  disabled?: boolean;
}

function LeftLayout({ onMoveLeft, onMoveRight, onJump, onPause, disabled }: LayoutProps) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Pause button - top right */}
      <div className="absolute top-4 right-4 pointer-events-auto">
        <PauseButton onPause={onPause} disabled={disabled} />
      </div>

      {/* Movement controls - bottom left */}
      <div className="absolute bottom-6 left-4 pointer-events-auto">
        <MovementControls onMoveLeft={onMoveLeft} onMoveRight={onMoveRight} disabled={disabled} />
      </div>

      {/* Jump button - bottom right */}
      <div className="absolute bottom-6 right-4 pointer-events-auto">
        <JumpButton onJump={onJump} disabled={disabled} />
      </div>
    </div>
  );
}

function RightLayout({ onMoveLeft, onMoveRight, onJump, onPause, disabled }: LayoutProps) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Pause button - top right */}
      <div className="absolute top-4 right-4 pointer-events-auto">
        <PauseButton onPause={onPause} disabled={disabled} />
      </div>

      {/* Jump button - bottom left */}
      <div className="absolute bottom-6 left-4 pointer-events-auto">
        <JumpButton onJump={onJump} disabled={disabled} />
      </div>

      {/* Movement controls - bottom right */}
      <div className="absolute bottom-6 right-4 pointer-events-auto">
        <MovementControls onMoveLeft={onMoveLeft} onMoveRight={onMoveRight} disabled={disabled} />
      </div>
    </div>
  );
}

function BothLayout({ onMoveLeft, onMoveRight, onJump, onPause, disabled }: LayoutProps) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Pause button - top right */}
      <div className="absolute top-4 right-4 pointer-events-auto">
        <PauseButton onPause={onPause} disabled={disabled} />
      </div>

      {/* Left control - bottom left */}
      <div className="absolute bottom-6 left-4 pointer-events-auto">
        <ControlButton
          onPress={() => onMoveLeft(true)}
          onRelease={() => onMoveLeft(false)}
          icon={<ChevronLeft className="w-10 h-10" strokeWidth={3} />}
          label="Move left"
          disabled={disabled}
        />
      </div>

      {/* Right control - bottom right */}
      <div className="absolute bottom-6 right-4 pointer-events-auto">
        <ControlButton
          onPress={() => onMoveRight(true)}
          onRelease={() => onMoveRight(false)}
          icon={<ChevronRight className="w-10 h-10" strokeWidth={3} />}
          label="Move right"
          disabled={disabled}
        />
      </div>

      {/* Jump button - bottom center */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-auto">
        <JumpButton onJump={onJump} disabled={disabled} />
      </div>
    </div>
  );
}

// ============================================================
// StadiumControls Component
// ============================================================

export function StadiumControls({
  onMoveLeft,
  onMoveRight,
  onJump,
  onPause,
  disabled = false,
}: StadiumControlsProps) {
  const controlLayout = useGameStore((state) => state.controlLayout);

  const layoutProps: LayoutProps = {
    onMoveLeft,
    onMoveRight,
    onJump,
    onPause,
    disabled,
  };

  // Render appropriate layout based on setting
  switch (controlLayout) {
    case 'left':
      return <LeftLayout {...layoutProps} />;
    case 'right':
      return <RightLayout {...layoutProps} />;
    case 'both':
      return <BothLayout {...layoutProps} />;
    default:
      return <RightLayout {...layoutProps} />;
  }
}

export default StadiumControls;
