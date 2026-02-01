'use client';

import { motion, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';

export interface ScoreDisplayProps {
  score: number;
  label?: string;
  animated?: boolean;
  className?: string;
}

export function ScoreDisplay({
  score,
  label,
  animated = true,
  className = '',
}: ScoreDisplayProps) {
  const shouldReduceMotion = useReducedMotion();
  const shouldAnimate = animated && !shouldReduceMotion;
  const [displayScore, setDisplayScore] = useState(shouldAnimate ? 0 : score);
  const [prevScore, setPrevScore] = useState(score);

  // Spring animation for the score number
  const springValue = useSpring(shouldAnimate ? 0 : score, {
    stiffness: 100,
    damping: 30,
    mass: 1,
  });

  // Transform spring value to rounded integer
  const roundedValue = useTransform(springValue, (latest) => Math.round(latest));

  // Update display when roundedValue changes
  useEffect(() => {
    const unsubscribe = roundedValue.on('change', (latest) => {
      setDisplayScore(latest);
    });
    return unsubscribe;
  }, [roundedValue]);

  // Trigger animation when score changes
  useEffect(() => {
    if (shouldAnimate) {
      springValue.set(score);
    } else {
      setDisplayScore(score);
    }
  }, [score, shouldAnimate, springValue]);

  // Detect score increase for celebration effect
  const isIncreasing = score > prevScore;
  useEffect(() => {
    setPrevScore(score);
  }, [score]);

  return (
    <div
      className={`flex flex-col items-center ${className}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {label && (
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
          {label}
        </span>
      )}

      <motion.div
        className="relative"
        animate={
          isIncreasing && shouldAnimate
            ? {
                scale: [1, 1.2, 1],
              }
            : {}
        }
        transition={{
          duration: 0.3,
          ease: 'easeOut',
        }}
      >
        <span
          className="text-4xl font-bold text-brand-purple tabular-nums"
          aria-label={`Score: ${score}`}
        >
          {displayScore.toLocaleString()}
        </span>

        {/* Score increase particle effect */}
        {isIncreasing && shouldAnimate && (
          <motion.div
            className="absolute -top-2 left-1/2 -translate-x-1/2 text-brand-green font-bold text-lg"
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            +{score - prevScore}
          </motion.div>
        )}
      </motion.div>

      {/* Celebration ring effect on milestone scores */}
      {shouldAnimate && score > 0 && score % 100 === 0 && (
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-brand-yellow"
          initial={{ scale: 1, opacity: 1 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.6 }}
        />
      )}
    </div>
  );
}

export default ScoreDisplay;
