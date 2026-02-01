'use client';

import { useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Volume2, RotateCcw } from 'lucide-react';
import { BigButton } from '@/components/ui/BigButton';
import { CelebrationOverlay } from '@/components/ui/CelebrationOverlay';
import { StarRating } from '@/components/ui/StarRating';
import { usePlayerStore } from '@/lib/stores/player-store';

interface GameWrapperProps {
  title: string;
  category: 'numbers' | 'letters' | 'math' | 'words';
  children: ReactNode;
  onBack: () => void;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  isComplete: boolean;
  onRestart: () => void;
  onPlaySound?: () => void;
}

const categoryColors = {
  numbers: 'from-brand-red to-red-600',
  letters: 'from-brand-blue to-cyan-600',
  math: 'from-brand-yellow to-amber-500',
  words: 'from-brand-purple to-violet-600',
};

export function GameWrapper({
  title,
  category,
  children,
  onBack,
  score,
  totalQuestions,
  correctAnswers,
  isComplete,
  onRestart,
  onPlaySound,
}: GameWrapperProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const addStars = usePlayerStore((s) => s.addStars);

  const stars = correctAnswers >= totalQuestions ? 3 : correctAnswers >= totalQuestions * 0.7 ? 2 : correctAnswers >= totalQuestions * 0.5 ? 1 : 0;

  const handleComplete = useCallback(() => {
    if (stars > 0) {
      addStars(stars);
      setShowCelebration(true);
    }
  }, [stars, addStars]);

  // Auto-trigger celebration when complete
  if (isComplete && !showCelebration && stars > 0) {
    handleComplete();
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className={`bg-gradient-to-r ${categoryColors[category]} p-4 shadow-lg`}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/90 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
            <span className="font-medium">Back</span>
          </button>

          <h1 className="text-xl font-bold text-white">{title}</h1>

          <div className="flex items-center gap-3">
            {onPlaySound && (
              <button
                onClick={onPlaySound}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                aria-label="Play sound"
              >
                <Volume2 className="w-5 h-5 text-white" />
              </button>
            )}
            <div className="bg-white/20 rounded-full px-4 py-1">
              <span className="text-white font-bold">{score} pts</span>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white/10 h-2">
        <motion.div
          className={`h-full bg-gradient-to-r ${categoryColors[category]}`}
          initial={{ width: 0 }}
          animate={{ width: `${(correctAnswers / totalQuestions) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Game Content */}
      <main className="flex-1 p-4 md:p-8">
        <AnimatePresence mode="wait">
          {isComplete ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="max-w-md mx-auto text-center py-12"
            >
              <h2 className="text-3xl font-bold text-white mb-6">
                {stars >= 3 ? 'Amazing!' : stars >= 2 ? 'Great Job!' : stars >= 1 ? 'Good Try!' : 'Keep Practicing!'}
              </h2>

              <div className="mb-8">
                <StarRating stars={stars} maxStars={3} size="lg" />
              </div>

              <div className="bg-white/20 rounded-2xl p-6 mb-8">
                <p className="text-white text-lg mb-2">
                  You got <span className="font-bold">{correctAnswers}</span> out of{' '}
                  <span className="font-bold">{totalQuestions}</span> correct!
                </p>
                <p className="text-white/80">
                  Score: <span className="font-bold">{score}</span> points
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <BigButton color="green" size="lg" onClick={onRestart}>
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Play Again
                </BigButton>
                <BigButton color="blue" size="lg" onClick={onBack}>
                  Back to Games
                </BigButton>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="game"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Celebration Overlay */}
      {showCelebration && (
        <CelebrationOverlay
          onComplete={() => setShowCelebration(false)}
          type={stars >= 3 ? 'fireworks' : 'confetti'}
        />
      )}
    </div>
  );
}

export default GameWrapper;
