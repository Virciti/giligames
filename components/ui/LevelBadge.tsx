'use client';

import { motion } from 'framer-motion';
import { Lock, Star } from 'lucide-react';

interface LevelBadgeProps {
  level: number;
  isLocked?: boolean;
  isCompleted?: boolean;
  stars?: number;
  onClick?: () => void;
}

export function LevelBadge({
  level,
  isLocked = false,
  isCompleted = false,
  stars = 0,
  onClick,
}: LevelBadgeProps) {
  const isClickable = !isLocked && onClick;

  return (
    <motion.button
      onClick={isClickable ? onClick : undefined}
      disabled={isLocked}
      whileHover={isClickable ? { scale: 1.1 } : {}}
      whileTap={isClickable ? { scale: 0.95 } : {}}
      className={`
        relative w-20 h-20 rounded-2xl
        flex flex-col items-center justify-center
        font-bold text-2xl
        transition-all duration-200
        focus:outline-none focus:ring-4 focus:ring-brand-blue/50
        ${
          isLocked
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : isCompleted
            ? 'bg-brand-green text-white shadow-lg'
            : 'bg-brand-blue text-white shadow-lg cursor-pointer'
        }
      `}
      aria-label={
        isLocked
          ? `Level ${level} locked`
          : isCompleted
          ? `Level ${level} completed with ${stars} stars`
          : `Play level ${level}`
      }
    >
      {/* Glow effect for available levels */}
      {!isLocked && !isCompleted && (
        <motion.div
          className="absolute inset-0 rounded-2xl bg-brand-blue"
          animate={{
            boxShadow: [
              '0 0 0 0 rgba(78, 205, 196, 0.4)',
              '0 0 20px 10px rgba(78, 205, 196, 0.2)',
              '0 0 0 0 rgba(78, 205, 196, 0.4)',
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Badge content */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        {isLocked ? (
          <Lock className="w-8 h-8" strokeWidth={2.5} />
        ) : (
          <span>{level}</span>
        )}
      </div>

      {/* Completed checkmark overlay */}
      {isCompleted && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md"
        >
          <svg
            className="w-4 h-4 text-brand-green"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </motion.div>
      )}

      {/* Stars display for completed levels */}
      {isCompleted && stars > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -bottom-3 flex gap-0.5"
        >
          {[1, 2, 3].map((starNum) => (
            <Star
              key={starNum}
              className={`w-4 h-4 ${
                starNum <= stars
                  ? 'fill-brand-yellow text-brand-yellow'
                  : 'fill-gray-300 text-gray-300'
              }`}
              strokeWidth={1}
            />
          ))}
        </motion.div>
      )}
    </motion.button>
  );
}

// Level grid component for displaying multiple levels
interface LevelGridProps {
  levels: Array<{
    level: number;
    isLocked?: boolean;
    isCompleted?: boolean;
    stars?: number;
  }>;
  onLevelSelect: (level: number) => void;
}

export function LevelGrid({ levels, onLevelSelect }: LevelGridProps) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4 p-4">
      {levels.map((levelData) => (
        <LevelBadge
          key={levelData.level}
          level={levelData.level}
          isLocked={levelData.isLocked}
          isCompleted={levelData.isCompleted}
          stars={levelData.stars}
          onClick={() => onLevelSelect(levelData.level)}
        />
      ))}
    </div>
  );
}
