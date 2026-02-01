'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Truck } from 'lucide-react';
import { numbers, getNumberByValue } from '@/content/numbers';
import { usePlayerStore } from '@/lib/stores/player-store';
import { GameWrapper } from '../GameWrapper';

interface NumberCrushProps {
  onBack: () => void;
  difficulty?: number;
}

interface Question {
  target: number;
  options: number[];
}

function generateQuestion(difficulty: number): Question {
  const maxNum = Math.min(5 + difficulty * 3, 20);
  const target = Math.floor(Math.random() * maxNum) + 1;

  const options = new Set<number>([target]);
  while (options.size < 4) {
    let wrong = Math.floor(Math.random() * maxNum) + 1;
    // Add some near-misses for challenge
    if (Math.random() < 0.5) {
      wrong = target + (Math.random() < 0.5 ? 1 : -1);
      if (wrong < 1) wrong = target + 1;
      if (wrong > 20) wrong = target - 1;
    }
    if (wrong >= 1 && wrong <= 20) options.add(wrong);
  }

  return {
    target,
    options: Array.from(options).sort(() => Math.random() - 0.5),
  };
}

const TOTAL_QUESTIONS = 5;

const truckColors = ['bg-brand-red', 'bg-brand-blue', 'bg-brand-green', 'bg-brand-purple'];

export function NumberCrush({ onBack, difficulty = 1 }: NumberCrushProps) {
  const shouldReduceMotion = useReducedMotion();
  const updateMastery = usePlayerStore((s) => s.updateMastery);

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const isComplete = questionIndex >= TOTAL_QUESTIONS;

  useEffect(() => {
    if (!isComplete) {
      setCurrentQuestion(generateQuestion(difficulty));
      setFeedback(null);
      setSelectedOption(null);
    }
  }, [questionIndex, difficulty, isComplete]);

  const handleAnswer = useCallback((answer: number) => {
    if (feedback !== null || !currentQuestion) return;

    setSelectedOption(answer);
    const isCorrect = answer === currentQuestion.target;

    setFeedback(isCorrect ? 'correct' : 'wrong');
    updateMastery(`number-${currentQuestion.target}`, isCorrect);

    if (isCorrect) {
      setScore((s) => s + 10 * difficulty);
      setCorrectAnswers((c) => c + 1);
    }

    setTimeout(() => {
      setQuestionIndex((i) => i + 1);
    }, 1000);
  }, [feedback, currentQuestion, difficulty, updateMastery]);

  const handleRestart = () => {
    setQuestionIndex(0);
    setScore(0);
    setCorrectAnswers(0);
    setFeedback(null);
    setSelectedOption(null);
  };

  const targetNumber = currentQuestion ? getNumberByValue(currentQuestion.target) : null;

  return (
    <GameWrapper
      title="Number Crush"
      category="numbers"
      onBack={onBack}
      score={score}
      totalQuestions={TOTAL_QUESTIONS}
      correctAnswers={correctAnswers}
      isComplete={isComplete}
      onRestart={handleRestart}
    >
      {currentQuestion && (
        <div className="max-w-2xl mx-auto">
          {/* Question */}
          <motion.div
            key={questionIndex}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <p className="text-white/80 text-lg mb-2">Find the number</p>
            <div className="bg-white/20 rounded-3xl p-8 inline-block">
              <span className="text-7xl font-bold text-white">
                {currentQuestion.target}
              </span>
            </div>
            {targetNumber && (
              <p className="text-white/70 text-xl mt-4">
                &quot;{targetNumber.word}&quot;
              </p>
            )}
          </motion.div>

          {/* Progress */}
          <div className="text-center mb-6">
            <span className="text-white/60">
              Question {questionIndex + 1} of {TOTAL_QUESTIONS}
            </span>
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 gap-4">
            <AnimatePresence mode="wait">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedOption === option;
                const isCorrect = option === currentQuestion.target;
                const showResult = feedback !== null;

                let bgColor = truckColors[index];
                if (showResult) {
                  if (isCorrect) bgColor = 'bg-green-500';
                  else if (isSelected) bgColor = 'bg-red-400';
                }

                return (
                  <motion.button
                    key={`${questionIndex}-${option}`}
                    initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ delay: index * 0.1 }}
                    whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
                    onClick={() => handleAnswer(option)}
                    disabled={feedback !== null}
                    className={`
                      ${bgColor}
                      rounded-2xl p-6 min-h-32
                      flex flex-col items-center justify-center
                      shadow-lg transition-colors
                      disabled:cursor-not-allowed
                    `}
                  >
                    <Truck className="w-12 h-12 text-white/80 mb-2" />
                    <span className="text-4xl font-bold text-white">
                      {option}
                    </span>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Feedback */}
          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`
                  text-center mt-6 p-4 rounded-xl
                  ${feedback === 'correct' ? 'bg-green-500/30' : 'bg-red-400/30'}
                `}
              >
                <span className="text-2xl font-bold text-white">
                  {feedback === 'correct' ? 'Correct! Great job!' : `Oops! It was ${currentQuestion.target}`}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </GameWrapper>
  );
}

export default NumberCrush;
