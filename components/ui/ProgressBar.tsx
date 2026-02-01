'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Star } from 'lucide-react';

export type ProgressColor = 'red' | 'blue' | 'yellow' | 'green' | 'purple' | 'orange';

export interface Milestone {
  position: number; // 0-100
  reached?: boolean;
}

export interface ProgressBarProps {
  value: number; // 0-100
  milestones?: Milestone[];
  color?: ProgressColor;
  animated?: boolean;
  ariaLabel?: string;
}

const colorClasses: Record<ProgressColor, string> = {
  red: 'bg-brand-red',
  blue: 'bg-brand-blue',
  yellow: 'bg-brand-yellow',
  green: 'bg-brand-green',
  purple: 'bg-brand-purple',
  orange: 'bg-brand-orange',
};

export function ProgressBar({
  value,
  milestones = [],
  color = 'green',
  animated = true,
  ariaLabel = 'Progress',
}: ProgressBarProps) {
  const shouldReduceMotion = useReducedMotion();
  const clampedValue = Math.min(100, Math.max(0, value));
  const shouldAnimate = animated && !shouldReduceMotion;

  return (
    <div className="relative w-full">
      {/* Progress Track */}
      <div
        className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner"
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabel}
      >
        {/* Progress Fill */}
        <motion.div
          className={`h-full ${colorClasses[color]} rounded-full`}
          initial={shouldAnimate ? { width: 0 } : { width: `${clampedValue}%` }}
          animate={{ width: `${clampedValue}%` }}
          transition={
            shouldAnimate
              ? {
                  type: 'spring',
                  stiffness: 100,
                  damping: 20,
                  mass: 1,
                }
              : { duration: 0 }
          }
        >
          {/* Shine Effect */}
          {shouldAnimate && (
            <motion.div
              className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{
                x: ['-100%', '200%'],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
                ease: 'easeInOut',
              }}
            />
          )}
        </motion.div>
      </div>

      {/* Milestones */}
      {milestones.map((milestone, index) => {
        const isReached = clampedValue >= milestone.position;

        return (
          <motion.div
            key={index}
            className="absolute top-1/2 -translate-y-1/2"
            style={{ left: `${milestone.position}%`, transform: 'translate(-50%, -50%)' }}
            initial={shouldAnimate ? { scale: 0 } : { scale: 1 }}
            animate={{ scale: 1 }}
            transition={
              shouldAnimate
                ? {
                    type: 'spring',
                    stiffness: 300,
                    damping: 15,
                    delay: index * 0.1,
                  }
                : { duration: 0 }
            }
          >
            <motion.div
              animate={
                isReached && shouldAnimate
                  ? {
                      rotate: [0, -10, 10, -10, 0],
                      scale: [1, 1.2, 1],
                    }
                  : {}
              }
              transition={{
                duration: 0.5,
                delay: 0.3,
              }}
            >
              <Star
                className={`w-8 h-8 drop-shadow-lg ${
                  isReached
                    ? 'text-brand-yellow fill-brand-yellow'
                    : 'text-gray-400 fill-gray-300'
                }`}
                aria-label={isReached ? 'Milestone reached' : 'Milestone not reached'}
              />
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}

export default ProgressBar;
