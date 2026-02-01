'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Truck, Check } from 'lucide-react';
import { letters } from '@/content/letters';
import { usePlayerStore } from '@/lib/stores/player-store';
import { GameWrapper } from '../GameWrapper';

interface MatchUpProps {
  onBack: () => void;
  difficulty?: number;
}

interface MatchPair {
  letter: typeof letters[0];
  matched: boolean;
}

function generatePairs(count: number): MatchPair[] {
  const shuffled = [...letters].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((letter) => ({
    letter,
    matched: false,
  }));
}

const TOTAL_ROUNDS = 3;
const PAIRS_PER_ROUND = 4;

const truckColors = ['bg-brand-red', 'bg-brand-blue', 'bg-brand-green', 'bg-brand-purple'];

export function MatchUp({ onBack, difficulty = 1 }: MatchUpProps) {
  const shouldReduceMotion = useReducedMotion();
  const updateMastery = usePlayerStore((s) => s.updateMastery);

  const [pairs, setPairs] = useState<MatchPair[]>([]);
  const [selectedUpper, setSelectedUpper] = useState<string | null>(null);
  const [roundIndex, setRoundIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong'; letter: string } | null>(null);

  const isComplete = roundIndex >= TOTAL_ROUNDS;
  const totalQuestions = TOTAL_ROUNDS * PAIRS_PER_ROUND;

  useEffect(() => {
    if (!isComplete) {
      setPairs(generatePairs(PAIRS_PER_ROUND));
      setSelectedUpper(null);
    }
  }, [roundIndex, isComplete]);

  // Check if round is complete
  useEffect(() => {
    if (pairs.length > 0 && pairs.every((p) => p.matched)) {
      const timer = setTimeout(() => {
        setRoundIndex((r) => r + 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [pairs]);

  const handleSelectUpper = (letterId: string) => {
    if (pairs.find((p) => p.letter.id === letterId)?.matched) return;
    setSelectedUpper(letterId);
  };

  const handleSelectLower = useCallback((letterId: string) => {
    if (!selectedUpper) return;
    if (pairs.find((p) => p.letter.id === letterId)?.matched) return;

    const isMatch = selectedUpper === letterId;
    const letter = letters.find((l) => l.id === letterId);

    setFeedback({ type: isMatch ? 'correct' : 'wrong', letter: letter?.uppercase || '' });
    updateMastery(letterId, isMatch);

    if (isMatch) {
      setScore((s) => s + 10 * difficulty);
      setCorrectAnswers((c) => c + 1);
      setPairs((prev) =>
        prev.map((p) =>
          p.letter.id === letterId ? { ...p, matched: true } : p
        )
      );
    }

    setSelectedUpper(null);
    setTimeout(() => setFeedback(null), 600);
  }, [selectedUpper, difficulty, updateMastery, pairs]);

  const handleRestart = () => {
    setRoundIndex(0);
    setScore(0);
    setCorrectAnswers(0);
    setSelectedUpper(null);
    setFeedback(null);
  };

  // Shuffle lowercase order
  const shuffledLower = [...pairs].sort((a, b) => a.letter.lowercase.localeCompare(b.letter.lowercase));

  return (
    <GameWrapper
      title="Match Up"
      category="letters"
      onBack={onBack}
      score={score}
      totalQuestions={totalQuestions}
      correctAnswers={correctAnswers}
      isComplete={isComplete}
      onRestart={handleRestart}
    >
      <div className="max-w-2xl mx-auto">
        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mb-6"
        >
          <p className="text-white text-xl font-bold mb-2">
            Match uppercase to lowercase!
          </p>
          <p className="text-white/70">
            Tap a big letter, then tap the matching small letter
          </p>
        </motion.div>

        {/* Progress */}
        <div className="text-center mb-6">
          <span className="text-white/60">
            Round {roundIndex + 1} of {TOTAL_ROUNDS}
          </span>
        </div>

        {/* Uppercase letters */}
        <div className="mb-4">
          <p className="text-white/60 text-sm mb-2 text-center">UPPERCASE</p>
          <div className="flex justify-center gap-3">
            {pairs.map((pair, index) => (
              <motion.button
                key={`upper-${pair.letter.id}`}
                initial={shouldReduceMotion ? {} : { scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
                onClick={() => handleSelectUpper(pair.letter.id)}
                disabled={pair.matched}
                className={`
                  w-20 h-20 rounded-2xl flex flex-col items-center justify-center
                  shadow-lg transition-all
                  ${pair.matched
                    ? 'bg-green-500/30 border-2 border-green-500'
                    : selectedUpper === pair.letter.id
                      ? 'bg-white/40 border-2 border-white'
                      : `${truckColors[index]} hover:scale-105`}
                  disabled:cursor-not-allowed
                `}
              >
                {pair.matched ? (
                  <Check className="w-10 h-10 text-green-500" />
                ) : (
                  <>
                    <Truck className="w-6 h-6 text-white/80" />
                    <span className="text-3xl font-bold text-white">
                      {pair.letter.uppercase}
                    </span>
                  </>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Connector */}
        <div className="flex justify-center my-4">
          <div className="text-white/50 text-2xl">↕</div>
        </div>

        {/* Lowercase letters */}
        <div className="mb-6">
          <p className="text-white/60 text-sm mb-2 text-center">lowercase</p>
          <div className="flex justify-center gap-3">
            {shuffledLower.map((pair, index) => (
              <motion.button
                key={`lower-${pair.letter.id}`}
                initial={shouldReduceMotion ? {} : { scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 + 0.2 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
                onClick={() => handleSelectLower(pair.letter.id)}
                disabled={pair.matched || !selectedUpper}
                className={`
                  w-20 h-20 rounded-2xl flex flex-col items-center justify-center
                  shadow-lg transition-all
                  ${pair.matched
                    ? 'bg-green-500/30 border-2 border-green-500'
                    : !selectedUpper
                      ? 'bg-white/10 cursor-not-allowed'
                      : `${truckColors[(index + 2) % truckColors.length]} hover:scale-105`}
                  disabled:cursor-not-allowed
                `}
              >
                {pair.matched ? (
                  <Check className="w-10 h-10 text-green-500" />
                ) : (
                  <>
                    <Truck className="w-6 h-6 text-white/80" />
                    <span className="text-3xl font-bold text-white">
                      {pair.letter.lowercase}
                    </span>
                  </>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Feedback */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`
                text-center p-3 rounded-xl
                ${feedback.type === 'correct' ? 'bg-green-500/30' : 'bg-red-400/30'}
              `}
            >
              <span className="text-xl font-bold text-white">
                {feedback.type === 'correct'
                  ? `Match! ${feedback.letter}`
                  : 'Try again!'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </GameWrapper>
  );
}

export default MatchUp;
