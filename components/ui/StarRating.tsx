'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Star } from 'lucide-react';

export type StarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface StarRatingProps {
  stars: number; // 0-3
  size?: StarSize;
  animated?: boolean;
  maxStars?: number;
  ariaLabel?: string;
}

const sizeClasses: Record<StarSize, string> = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

const gapClasses: Record<StarSize, string> = {
  sm: 'gap-1',
  md: 'gap-2',
  lg: 'gap-3',
  xl: 'gap-4',
};

export function StarRating({
  stars,
  size = 'md',
  animated = true,
  maxStars = 3,
  ariaLabel,
}: StarRatingProps) {
  const shouldReduceMotion = useReducedMotion();
  const shouldAnimate = animated && !shouldReduceMotion;
  const clampedStars = Math.min(maxStars, Math.max(0, Math.round(stars)));
  const isFullStars = clampedStars === maxStars;

  const label = ariaLabel || `${clampedStars} out of ${maxStars} stars`;

  return (
    <div
      className={`flex items-center ${gapClasses[size]}`}
      role="img"
      aria-label={label}
    >
      {Array.from({ length: maxStars }, (_, index) => {
        const isFilled = index < clampedStars;

        return (
          <motion.div
            key={index}
            initial={shouldAnimate ? { scale: 0, rotate: -180 } : { scale: 1 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={
              shouldAnimate
                ? {
                    type: 'spring',
                    stiffness: 260,
                    damping: 20,
                    delay: index * 0.15,
                  }
                : { duration: 0 }
            }
          >
            <motion.div
              animate={
                isFilled && isFullStars && shouldAnimate
                  ? {
                      scale: [1, 1.3, 1],
                      rotate: [0, 15, -15, 0],
                    }
                  : {}
              }
              transition={{
                duration: 0.6,
                delay: 0.5 + index * 0.1,
                ease: 'easeInOut',
              }}
            >
              <Star
                className={`
                  ${sizeClasses[size]}
                  drop-shadow-lg
                  ${
                    isFilled
                      ? 'text-brand-yellow fill-brand-yellow'
                      : 'text-gray-300 fill-gray-200 dark:text-gray-600 dark:fill-gray-700'
                  }
                `}
                aria-hidden="true"
              />
            </motion.div>

            {/* Celebration sparkle for full stars */}
            {isFilled && isFullStars && shouldAnimate && (
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{
                  duration: 0.8,
                  delay: 0.8 + index * 0.1,
                }}
              >
                {/* Sparkle particles */}
                {[...Array(4)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-brand-yellow rounded-full"
                    style={{
                      top: '50%',
                      left: '50%',
                    }}
                    animate={{
                      x: [0, (i % 2 === 0 ? 1 : -1) * 20],
                      y: [0, (i < 2 ? -1 : 1) * 20],
                      opacity: [1, 0],
                      scale: [1, 0],
                    }}
                    transition={{
                      duration: 0.5,
                      delay: 0.8 + index * 0.1,
                    }}
                  />
                ))}
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

export default StarRating;
