'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RotateCcw, Home, Star } from 'lucide-react';
import { BigButton } from '@/components/ui/BigButton';
import { StarRating } from '@/components/ui/StarRating';
import { CelebrationOverlay } from '@/components/ui/CelebrationOverlay';

// ============================================================
// Types
// ============================================================

interface TrophyCeremonyProps {
  position: 1 | 2 | 3;
  onContinue: () => void;
  onRaceAgain: () => void;
  onBackToGarage: () => void;
  levelName?: string;
  lapTimes?: number[];
}

// ============================================================
// Constants
// ============================================================

const TROPHY_COLORS = {
  1: {
    primary: '#FFE66D',
    secondary: '#D4AF37',
    text: 'Gold',
    bg: 'from-yellow-400 to-yellow-600',
  },
  2: {
    primary: '#C0C0C0',
    secondary: '#A8A8A8',
    text: 'Silver',
    bg: 'from-gray-300 to-gray-500',
  },
  3: {
    primary: '#CD7F32',
    secondary: '#A0522D',
    text: 'Bronze',
    bg: 'from-amber-600 to-amber-800',
  },
};

const POSITION_TEXT = {
  1: '1st Place!',
  2: '2nd Place!',
  3: '3rd Place!',
};

const STARS_EARNED = {
  1: 3,
  2: 2,
  3: 1,
};

const CELEBRATION_MESSAGES = {
  1: ['Amazing!', 'Champion!', 'You did it!', 'Incredible!'],
  2: ['Great job!', 'Well done!', 'Almost there!', 'Nice racing!'],
  3: ['Good effort!', 'Keep trying!', 'Not bad!', 'Keep practicing!'],
};

// ============================================================
// Trophy Component
// ============================================================

function TrophyDisplay({ position }: { position: 1 | 2 | 3 }) {
  const colors = TROPHY_COLORS[position];

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{
        type: 'spring',
        damping: 12,
        stiffness: 100,
        delay: 0.2,
      }}
      className="relative"
    >
      {/* Glow effect */}
      <motion.div
        animate={{
          opacity: [0.5, 1, 0.5],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className={`absolute inset-0 rounded-full bg-gradient-to-br ${colors.bg} blur-2xl opacity-50`}
        style={{ width: 200, height: 200, marginLeft: -20, marginTop: -20 }}
      />

      {/* Trophy icon */}
      <motion.div
        animate={{
          y: [0, -10, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <Trophy
          className="w-40 h-40 drop-shadow-2xl"
          style={{
            color: colors.primary,
            filter: `drop-shadow(0 4px 8px ${colors.secondary})`,
          }}
          strokeWidth={1.5}
        />
      </motion.div>

      {/* Position number on trophy */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/3"
      >
        <span
          className="text-4xl font-black"
          style={{ color: colors.secondary }}
        >
          {position}
        </span>
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// Podium Component
// ============================================================

function Podium({ position }: { position: 1 | 2 | 3 }) {
  const heights = { 1: 120, 2: 90, 3: 70 };
  const colors = TROPHY_COLORS[position];

  return (
    <motion.div
      initial={{ scaleY: 0 }}
      animate={{ scaleY: 1 }}
      transition={{
        type: 'spring',
        damping: 15,
        stiffness: 100,
        delay: 0.4,
      }}
      className="origin-bottom"
    >
      <div
        className={`w-32 rounded-t-lg bg-gradient-to-br ${colors.bg} shadow-lg`}
        style={{ height: heights[position] }}
      >
        {/* Podium number */}
        <div className="flex items-center justify-center h-full">
          <span className="text-6xl font-black text-white/30">{position}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// Lap Times Display
// ============================================================

function LapTimesDisplay({ lapTimes }: { lapTimes: number[] }) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const bestLap = Math.min(...lapTimes);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg"
    >
      <h3 className="text-lg font-bold text-gray-700 mb-2">Lap Times</h3>
      <div className="space-y-1">
        {lapTimes.map((time, i) => (
          <div
            key={i}
            className={`flex justify-between items-center ${
              time === bestLap ? 'text-brand-green font-bold' : 'text-gray-600'
            }`}
          >
            <span>Lap {i + 1}</span>
            <span className="font-mono">{formatTime(time)}</span>
            {time === bestLap && (
              <Star className="w-4 h-4 text-brand-yellow fill-brand-yellow" />
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function TrophyCeremony({
  position,
  onContinue,
  onRaceAgain,
  onBackToGarage,
  levelName,
  lapTimes = [],
}: TrophyCeremonyProps) {
  const [showCelebration, setShowCelebration] = useState(true);
  const [celebrationMessage] = useState(
    () => CELEBRATION_MESSAGES[position][
      Math.floor(Math.random() * CELEBRATION_MESSAGES[position].length)
    ]
  );

  const colors = TROPHY_COLORS[position];
  const starsEarned = STARS_EARNED[position];

  const handleCelebrationComplete = useCallback(() => {
    setShowCelebration(false);
  }, []);

  // Auto-dismiss celebration after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowCelebration(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-brand-blue/90 to-brand-purple/90 backdrop-blur-sm">
      {/* Celebration overlay */}
      <AnimatePresence>
        {showCelebration && (
          <CelebrationOverlay
            type={position === 1 ? 'fireworks' : 'confetti'}
            duration={3000}
            onComplete={handleCelebrationComplete}
          />
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="flex flex-col items-center gap-6 p-8">
        {/* Level name */}
        {levelName && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-white/80 text-lg font-medium"
          >
            {levelName}
          </motion.div>
        )}

        {/* Celebration message */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 10 }}
          className="text-5xl font-black text-white drop-shadow-lg text-center"
        >
          {celebrationMessage}
        </motion.h1>

        {/* Trophy */}
        <TrophyDisplay position={position} />

        {/* Position text */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`text-4xl font-bold bg-gradient-to-br ${colors.bg} bg-clip-text text-transparent drop-shadow-lg`}
        >
          {POSITION_TEXT[position]}
        </motion.h2>

        {/* Stars earned */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: 'spring', damping: 10 }}
        >
          <StarRating stars={starsEarned} size="xl" animated />
        </motion.div>

        {/* Podium */}
        <Podium position={position} />

        {/* Lap times */}
        {lapTimes.length > 0 && <LapTimesDisplay lapTimes={lapTimes} />}

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="flex flex-col sm:flex-row gap-4 mt-4"
        >
          <BigButton
            color="green"
            size="lg"
            onClick={onRaceAgain}
            aria-label="Race again"
          >
            <RotateCcw className="w-6 h-6 mr-2" />
            Race Again
          </BigButton>
          <BigButton
            color="orange"
            size="lg"
            onClick={onBackToGarage}
            aria-label="Back to garage"
          >
            <Home className="w-6 h-6 mr-2" />
            Back to Garage
          </BigButton>
        </motion.div>

        {/* Continue hint */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          onClick={onContinue}
          className="text-white/60 hover:text-white transition-colors mt-4"
        >
          Tap anywhere to continue
        </motion.button>
      </div>
    </div>
  );
}

export default TrophyCeremony;
