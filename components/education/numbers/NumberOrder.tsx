'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Truck, Check } from 'lucide-react';
import { usePlayerStore } from '@/lib/stores/player-store';
import { GameWrapper } from '../GameWrapper';

interface NumberOrderProps {
  onBack: () => void;
  difficulty?: number;
}

function generateSequence(difficulty: number): number[] {
  const length = Math.min(3 + difficulty, 6);
  const start = Math.floor(Math.random() * (10 - length)) + 1;
  return Array.from({ length }, (_, i) => start + i);
}

const TOTAL_QUESTIONS = 5;
const truckColors = ['bg-brand-red', 'bg-brand-blue', 'bg-brand-green', 'bg-brand-purple', 'bg-brand-orange', 'bg-brand-yellow'];

export function NumberOrder({ onBack, difficulty = 1 }: NumberOrderProps) {
  const shouldReduceMotion = useReducedMotion();
  const updateMastery = usePlayerStore((s) => s.updateMastery);

  const [targetSequence, setTargetSequence] = useState<number[]>([]);
  const [shuffledNumbers, setShuffledNumbers] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const isComplete = questionIndex >= TOTAL_QUESTIONS;

  useEffect(() => {
    if (!isComplete) {
      const sequence = generateSequence(difficulty);
      setTargetSequence(sequence);
      setShuffledNumbers([...sequence].sort(() => Math.random() - 0.5));
      setUserSequence([]);
      setFeedback(null);
    }
  }, [questionIndex, difficulty, isComplete]);

  const handleSelectNumber = useCallback((num: number) => {
    if (feedback !== null) return;

    const nextExpected = targetSequence[userSequence.length];
    const newSequence = [...userSequence, num];
    setUserSequence(newSequence);

    // Check if wrong
    if (num !== nextExpected) {
      setFeedback('wrong');
      updateMastery(`number-order-${targetSequence[0]}-${targetSequence[targetSequence.length - 1]}`, false);
      setTimeout(() => {
        setQuestionIndex((i) => i + 1);
      }, 1500);
      return;
    }

    // Check if complete
    if (newSequence.length === targetSequence.length) {
      setFeedback('correct');
      setScore((s) => s + 15 * difficulty);
      setCorrectAnswers((c) => c + 1);
      updateMastery(`number-order-${targetSequence[0]}-${targetSequence[targetSequence.length - 1]}`, true);
      setTimeout(() => {
        setQuestionIndex((i) => i + 1);
      }, 1500);
    }
  }, [feedback, targetSequence, userSequence, difficulty, updateMastery]);

  const handleRestart = () => {
    setQuestionIndex(0);
    setScore(0);
    setCorrectAnswers(0);
    setUserSequence([]);
    setFeedback(null);
  };

  const availableNumbers = shuffledNumbers.filter((n) => !userSequence.includes(n));

  return (
    <GameWrapper
      title="Number Order"
      category="numbers"
      onBack={onBack}
      score={score}
      totalQuestions={TOTAL_QUESTIONS}
      correctAnswers={correctAnswers}
      isComplete={isComplete}
      onRestart={handleRestart}
    >
      <div className="max-w-2xl mx-auto">
        {/* Instructions */}
        <motion.div
          key={questionIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mb-6"
        >
          <p className="text-white text-2xl font-bold mb-2">
            Put the numbers in order!
          </p>
          <p className="text-white/70">
            Tap from smallest to biggest
          </p>
        </motion.div>

        {/* Progress */}
        <div className="text-center mb-6">
          <span className="text-white/60">
            Question {questionIndex + 1} of {TOTAL_QUESTIONS}
          </span>
        </div>

        {/* User's sequence (slots) */}
        <div className="bg-white/10 rounded-2xl p-4 mb-6">
          <p className="text-white/60 text-sm mb-3 text-center">Your order:</p>
          <div className="flex justify-center gap-3">
            {targetSequence.map((_, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className={`
                  w-16 h-16 rounded-xl flex items-center justify-center
                  ${userSequence[index] !== undefined
                    ? truckColors[index % truckColors.length]
                    : 'bg-white/10 border-2 border-dashed border-white/30'}
                `}
              >
                {userSequence[index] !== undefined ? (
                  <span className="text-2xl font-bold text-white">
                    {userSequence[index]}
                  </span>
                ) : (
                  <span className="text-white/30 text-lg">{index + 1}</span>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Available numbers */}
        <div className="mb-6">
          <p className="text-white/60 text-sm mb-3 text-center">Tap a number:</p>
          <div className="flex flex-wrap justify-center gap-3">
            <AnimatePresence mode="popLayout">
              {availableNumbers.map((num, index) => (
                <motion.button
                  key={num}
                  layout
                  initial={shouldReduceMotion ? {} : { scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, opacity: 0 }}
                  whileTap={shouldReduceMotion ? {} : { scale: 0.9 }}
                  onClick={() => handleSelectNumber(num)}
                  disabled={feedback !== null}
                  className={`
                    ${truckColors[shuffledNumbers.indexOf(num) % truckColors.length]}
                    w-20 h-20 rounded-2xl
                    flex flex-col items-center justify-center
                    shadow-lg
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  <Truck className="w-8 h-8 text-white/80 mb-1" />
                  <span className="text-2xl font-bold text-white">{num}</span>
                </motion.button>
              ))}
            </AnimatePresence>
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
                text-center p-4 rounded-xl flex items-center justify-center gap-2
                ${feedback === 'correct' ? 'bg-green-500/30' : 'bg-red-400/30'}
              `}
            >
              {feedback === 'correct' && <Check className="w-6 h-6 text-white" />}
              <span className="text-2xl font-bold text-white">
                {feedback === 'correct'
                  ? 'Perfect order!'
                  : `The order is: ${targetSequence.join(', ')}`}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </GameWrapper>
  );
}

export default NumberOrder;
