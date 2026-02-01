'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Star, Clock, Target } from 'lucide-react';
import { ScoreDisplay } from '@/components/ui';

// ============================================================
// Types
// ============================================================

export interface ChallengeObjective {
  type: 'collect' | 'crush' | 'time';
  target: number;
  current: number;
  timeLimit?: number;
}

export interface StadiumHUDProps {
  score: number;
  starsCollected: number;
  totalStars: number;
  elapsedTime: number;
  challenge?: ChallengeObjective;
  showTimer?: boolean;
}

// ============================================================
// Star Counter Component
// ============================================================

interface StarCounterProps {
  collected: number;
  total: number;
}

function StarCounter({ collected, total }: StarCounterProps) {
  return (
    <motion.div
      className="flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-xl px-4 py-2"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <motion.div
        animate={
          collected > 0
            ? {
                scale: [1, 1.3, 1],
                rotate: [0, 10, -10, 0],
              }
            : {}
        }
        transition={{ duration: 0.3 }}
        key={collected}
      >
        <Star
          className={`w-6 h-6 ${
            collected > 0 ? 'text-yellow-400 fill-yellow-400' : 'text-white/50'
          }`}
        />
      </motion.div>
      <span className="text-white font-bold text-lg tabular-nums">
        {collected}/{total}
      </span>

      {/* Star collection animation */}
      <AnimatePresence>
        {collected > 0 && (
          <motion.span
            key={`star-plus-${collected}`}
            className="absolute -top-2 right-0 text-yellow-400 font-bold text-sm"
            initial={{ opacity: 1, y: 0, scale: 1 }}
            animate={{ opacity: 0, y: -15, scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            +1
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================
// Timer Component
// ============================================================

interface TimerProps {
  seconds: number;
  timeLimit?: number;
}

function Timer({ seconds, timeLimit }: TimerProps) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  const remainingTime = timeLimit ? timeLimit - seconds : undefined;
  const isWarning = remainingTime !== undefined && remainingTime <= 10 && remainingTime > 0;
  const isExpired = remainingTime !== undefined && remainingTime <= 0;

  return (
    <motion.div
      className={`
        flex items-center gap-2
        bg-black/40 backdrop-blur-sm
        rounded-xl px-4 py-2
        ${isWarning ? 'bg-red-500/50' : ''}
        ${isExpired ? 'bg-red-700/50' : ''}
      `}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <motion.div
        animate={
          isWarning
            ? {
                scale: [1, 1.2, 1],
              }
            : {}
        }
        transition={{
          duration: 0.5,
          repeat: isWarning ? Infinity : 0,
        }}
      >
        <Clock
          className={`w-5 h-5 ${isWarning || isExpired ? 'text-red-400' : 'text-white/70'}`}
        />
      </motion.div>
      <span
        className={`font-bold text-lg tabular-nums ${
          isWarning || isExpired ? 'text-red-400' : 'text-white'
        }`}
      >
        {timeLimit ? (
          // Countdown mode
          <span>
            {Math.max(0, Math.floor((remainingTime ?? 0) / 60))}:
            {String(Math.max(0, (remainingTime ?? 0) % 60)).padStart(2, '0')}
          </span>
        ) : (
          // Count up mode
          <span>
            {minutes}:{String(secs).padStart(2, '0')}
          </span>
        )}
      </span>
    </motion.div>
  );
}

// ============================================================
// Challenge Objective Component
// ============================================================

interface ChallengeDisplayProps {
  challenge: ChallengeObjective;
}

function ChallengeDisplay({ challenge }: ChallengeDisplayProps) {
  const progress = Math.min(1, challenge.current / challenge.target);
  const isComplete = challenge.current >= challenge.target;

  const getChallengeText = () => {
    switch (challenge.type) {
      case 'collect':
        return `Collect ${challenge.target} stars`;
      case 'crush':
        return `Crush ${challenge.target} obstacles`;
      case 'time':
        return `Finish in ${challenge.timeLimit}s`;
      default:
        return 'Complete the challenge';
    }
  };

  return (
    <motion.div
      className={`
        flex items-center gap-3
        bg-black/40 backdrop-blur-sm
        rounded-xl px-4 py-2
        ${isComplete ? 'bg-green-500/30' : ''}
      `}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
    >
      <motion.div
        animate={
          isComplete
            ? {
                scale: [1, 1.3, 1],
                rotate: [0, 360],
              }
            : {}
        }
        transition={{ duration: 0.5 }}
      >
        <Target
          className={`w-5 h-5 ${isComplete ? 'text-green-400' : 'text-brand-blue'}`}
        />
      </motion.div>

      <div className="flex flex-col">
        <span className="text-white/80 text-xs">{getChallengeText()}</span>
        <div className="flex items-center gap-2">
          {/* Progress bar */}
          <div className="w-20 h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className={`h-full ${isComplete ? 'bg-green-400' : 'bg-brand-blue'}`}
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ type: 'spring', stiffness: 100, damping: 15 }}
            />
          </div>
          <span className="text-white font-bold text-sm tabular-nums">
            {challenge.current}/{challenge.target}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// StadiumHUD Component
// ============================================================

export function StadiumHUD({
  score,
  starsCollected,
  totalStars,
  elapsedTime,
  challenge,
  showTimer = true,
}: StadiumHUDProps) {
  return (
    <div className="absolute inset-x-0 top-0 pointer-events-none p-4">
      <div className="flex justify-between items-start">
        {/* Left side - Score */}
        <motion.div
          className="bg-black/40 backdrop-blur-sm rounded-xl px-4 py-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <ScoreDisplay score={score} animated className="!text-white" />
        </motion.div>

        {/* Center - Stars and Timer */}
        <div className="flex flex-col items-center gap-2">
          <StarCounter collected={starsCollected} total={totalStars} />
          {showTimer && (
            <Timer
              seconds={elapsedTime}
              timeLimit={challenge?.timeLimit}
            />
          )}
        </div>

        {/* Right side - Challenge objective */}
        <div className="flex flex-col items-end gap-2">
          {challenge && <ChallengeDisplay challenge={challenge} />}
        </div>
      </div>
    </div>
  );
}

export default StadiumHUD;
