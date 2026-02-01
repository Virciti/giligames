'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { forwardRef, KeyboardEvent } from 'react';

export interface GameCardProps {
  title: string;
  description?: string;
  image?: string;
  locked?: boolean;
  unlockProgress?: number; // 0-100
  selected?: boolean;
  onClick?: () => void;
}

export const GameCard = forwardRef<HTMLDivElement, GameCardProps>(
  ({ title, description, image, locked = false, unlockProgress = 0, selected = false, onClick }, ref) => {
    const shouldReduceMotion = useReducedMotion();

    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
      if ((e.key === 'Enter' || e.key === ' ') && onClick && !locked) {
        e.preventDefault();
        onClick();
      }
    };

    const handleClick = () => {
      if (!locked && onClick) {
        onClick();
      }
    };

    return (
      <motion.div
        ref={ref}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        whileHover={shouldReduceMotion || locked ? undefined : { scale: 1.03 }}
        whileFocus={shouldReduceMotion || locked ? undefined : { scale: 1.03 }}
        whileTap={shouldReduceMotion || locked ? undefined : { scale: 0.98 }}
        transition={
          shouldReduceMotion
            ? undefined
            : {
                type: 'spring' as const,
                stiffness: 300,
                damping: 20,
              }
        }
        role="button"
        tabIndex={locked ? -1 : 0}
        aria-label={`${title}${locked ? ' (locked)' : ''}${selected ? ' (selected)' : ''}`}
        aria-disabled={locked}
        className={`
          relative
          min-h-[180px]
          min-w-[160px]
          rounded-3xl
          overflow-hidden
          cursor-pointer
          select-none
          touch-manipulation
          focus:outline-none
          focus:ring-4
          focus:ring-brand-blue/50
          transition-shadow
          duration-300
          ${selected ? 'ring-4 ring-brand-yellow shadow-[0_0_30px_rgba(255,230,109,0.6)]' : 'shadow-soft'}
          ${locked ? 'cursor-not-allowed grayscale' : ''}
        `.trim()}
      >
        {/* Background Image or Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-blue to-brand-purple">
          {image && (
            <img
              src={image}
              alt=""
              aria-hidden="true"
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Content Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Text Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-xl font-bold text-white drop-shadow-lg">{title}</h3>
          {description && (
            <p className="text-sm text-white/80 mt-1 line-clamp-2">{description}</p>
          )}
        </div>

        {/* Locked Overlay */}
        {locked && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 rounded-full bg-gray-800/80 flex items-center justify-center">
              <Lock className="w-8 h-8 text-white" aria-hidden="true" />
            </div>

            {/* Unlock Progress */}
            {unlockProgress > 0 && (
              <div className="w-3/4 max-w-[120px]">
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-yellow rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, unlockProgress))}%` }}
                    role="progressbar"
                    aria-valuenow={unlockProgress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Unlock progress: ${unlockProgress}%`}
                  />
                </div>
                <p className="text-xs text-white/70 text-center mt-1">
                  {unlockProgress}% to unlock
                </p>
              </div>
            )}
          </div>
        )}

        {/* Selected Glow Effect */}
        {selected && !shouldReduceMotion && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{
              boxShadow: [
                'inset 0 0 20px rgba(255,230,109,0.3)',
                'inset 0 0 40px rgba(255,230,109,0.5)',
                'inset 0 0 20px rgba(255,230,109,0.3)',
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
      </motion.div>
    );
  }
);

GameCard.displayName = 'GameCard';

export default GameCard;
