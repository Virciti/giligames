'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Truck, Check } from 'lucide-react';
import { getNumberBonds } from '@/content/mathPrompts';
import { usePlayerStore } from '@/lib/stores/player-store';
import { GameWrapper } from '../GameWrapper';

interface NumberBondsProps {
  onBack: () => void;
  difficulty?: number;
}

interface Question {
  target: number;
  numbers: number[];
  correctPairs: Array<[number, number]>;
}

function generateQuestion(difficulty: number): Question {
  const targets = [5, 10, 10, 15, 20];
  const target = targets[Math.min(difficulty - 1, targets.length - 1)];
  const bonds = getNumberBonds(target);

  // Pick one correct pair
  const correctBond = bonds[Math.floor(Math.random() * (bonds.length - 2)) + 1]; // Avoid 0+target and target+0

  // Generate numbers including the correct pair
  const numbers = new Set([correctBond.a, correctBond.b]);

  // Add some wrong numbers
  while (numbers.size < 6) {
    const wrong = Math.floor(Math.random() * target) + 1;
    numbers.add(wrong);
  }

  return {
    target,
    numbers: Array.from(numbers).sort(() => Math.random() - 0.5),
    correctPairs: [[correctBond.a, correctBond.b]],
  };
}

const TOTAL_QUESTIONS = 5;
const truckColors = ['bg-brand-red', 'bg-brand-blue', 'bg-brand-green', 'bg-brand-purple', 'bg-brand-orange', 'bg-brand-yellow'];

export function NumberBonds({ onBack, difficulty = 1 }: NumberBondsProps) {
  const shouldReduceMotion = useReducedMotion();
  const updateMastery = usePlayerStore((s) => s.updateMastery);

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);

  const isComplete = questionIndex >= TOTAL_QUESTIONS;

  useEffect(() => {
    if (!isComplete) {
      setCurrentQuestion(generateQuestion(difficulty));
      setFeedback(null);
      setSelectedNumbers([]);
    }
  }, [questionIndex, difficulty, isComplete]);

  const handleSelectNumber = useCallback((num: number) => {
    if (feedback !== null || !currentQuestion) return;

    const newSelected = selectedNumbers.includes(num)
      ? selectedNumbers.filter((n) => n !== num)
      : [...selectedNumbers, num];

    setSelectedNumbers(newSelected);

    // Check when two numbers are selected
    if (newSelected.length === 2) {
      const sum = newSelected[0] + newSelected[1];
      const isCorrect = sum === currentQuestion.target;

      setFeedback(isCorrect ? 'correct' : 'wrong');
      updateMastery(`number-bond-${currentQuestion.target}`, isCorrect);

      if (isCorrect) {
        setScore((s) => s + 15 * difficulty);
        setCorrectAnswers((c) => c + 1);
      }

      setTimeout(() => {
        setQuestionIndex((i) => i + 1);
      }, 1500);
    }
  }, [feedback, currentQuestion, selectedNumbers, difficulty, updateMastery]);

  const handleRestart = () => {
    setQuestionIndex(0);
    setScore(0);
    setCorrectAnswers(0);
    setFeedback(null);
    setSelectedNumbers([]);
  };

  return (
    <GameWrapper
      title="Number Bonds"
      category="math"
      onBack={onBack}
      score={score}
      totalQuestions={TOTAL_QUESTIONS}
      correctAnswers={correctAnswers}
      isComplete={isComplete}
      onRestart={handleRestart}
    >
      {currentQuestion && (
        <div className="max-w-2xl mx-auto">
          {/* Target */}
          <motion.div
            key={questionIndex}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <p className="text-white/80 text-lg mb-2">
              Find two numbers that make
            </p>
            <div className="bg-white/20 rounded-3xl p-6 inline-block">
              <span className="text-6xl font-bold text-white">
                {currentQuestion.target}
              </span>
            </div>
            <p className="text-white/60 mt-4">
              Tap two trucks that add up to {currentQuestion.target}
            </p>
          </motion.div>

          {/* Progress */}
          <div className="text-center mb-6">
            <span className="text-white/60">
              Question {questionIndex + 1} of {TOTAL_QUESTIONS}
            </span>
          </div>

          {/* Selected display */}
          {selectedNumbers.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center mb-4"
            >
              <span className="text-2xl text-white">
                {selectedNumbers[0]}
                {selectedNumbers.length === 2 && ` + ${selectedNumbers[1]} = ${selectedNumbers[0] + selectedNumbers[1]}`}
                {selectedNumbers.length === 1 && ' + ?'}
              </span>
            </motion.div>
          )}

          {/* Numbers */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {currentQuestion.numbers.map((num, index) => {
              const isSelected = selectedNumbers.includes(num);
              const showResult = feedback !== null;
              const isInCorrectPair = currentQuestion.correctPairs.some(
                ([a, b]) => num === a || num === b
              );

              let bgColor = truckColors[index];
              if (showResult) {
                if (isInCorrectPair) bgColor = 'bg-green-500';
                else if (isSelected) bgColor = 'bg-red-400';
              } else if (isSelected) {
                bgColor = 'bg-white/40';
              }

              return (
                <motion.button
                  key={num}
                  initial={shouldReduceMotion ? {} : { scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
                  onClick={() => handleSelectNumber(num)}
                  disabled={feedback !== null}
                  className={`
                    ${bgColor}
                    rounded-2xl p-4 min-h-24
                    flex flex-col items-center justify-center
                    shadow-lg transition-all
                    ${isSelected && !showResult ? 'ring-4 ring-white' : ''}
                    disabled:cursor-not-allowed
                  `}
                >
                  <Truck className="w-10 h-10 text-white/80 mb-1" />
                  <span className="text-3xl font-bold text-white">
                    {num}
                  </span>
                </motion.button>
              );
            })}
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
                    ? `Yes! ${selectedNumbers[0]} + ${selectedNumbers[1]} = ${currentQuestion.target}`
                    : `${selectedNumbers[0]} + ${selectedNumbers[1]} = ${selectedNumbers[0] + selectedNumbers[1]}, not ${currentQuestion.target}`}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </GameWrapper>
  );
}

export default NumberBonds;
