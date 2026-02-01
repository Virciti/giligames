'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Truck } from 'lucide-react';
import { usePlayerStore } from '@/lib/stores/player-store';
import { GameWrapper } from '../GameWrapper';

interface CountTheTrucksProps {
  onBack: () => void;
  difficulty?: number;
}

interface Question {
  count: number;
  options: number[];
}

function generateQuestion(difficulty: number): Question {
  const maxCount = Math.min(3 + difficulty * 2, 10);
  const count = Math.floor(Math.random() * maxCount) + 1;

  const options = new Set<number>([count]);
  while (options.size < 4) {
    let wrong = count + (Math.random() < 0.5 ? 1 : -1) * Math.ceil(Math.random() * 2);
    if (wrong < 1) wrong = count + Math.ceil(Math.random() * 2);
    if (wrong > 10) wrong = count - Math.ceil(Math.random() * 2);
    if (wrong >= 1 && wrong <= 10) options.add(wrong);
  }

  return {
    count,
    options: Array.from(options).sort(() => Math.random() - 0.5),
  };
}

const TOTAL_QUESTIONS = 5;
const truckColors = ['#FF6B6B', '#4ECDC4', '#7BC74D', '#9B5DE5', '#FF9F43', '#FFE66D'];

export function CountTheTrucks({ onBack, difficulty = 1 }: CountTheTrucksProps) {
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
    const isCorrect = answer === currentQuestion.count;

    setFeedback(isCorrect ? 'correct' : 'wrong');
    updateMastery(`counting-${currentQuestion.count}`, isCorrect);

    if (isCorrect) {
      setScore((s) => s + 10 * difficulty);
      setCorrectAnswers((c) => c + 1);
    }

    setTimeout(() => {
      setQuestionIndex((i) => i + 1);
    }, 1200);
  }, [feedback, currentQuestion, difficulty, updateMastery]);

  const handleRestart = () => {
    setQuestionIndex(0);
    setScore(0);
    setCorrectAnswers(0);
    setFeedback(null);
    setSelectedOption(null);
  };

  return (
    <GameWrapper
      title="Count the Trucks"
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mb-6"
          >
            <p className="text-white text-2xl font-bold mb-6">
              How many trucks?
            </p>
          </motion.div>

          {/* Trucks Display */}
          <motion.div
            key={`trucks-${questionIndex}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/10 rounded-3xl p-6 mb-8 min-h-48 flex flex-wrap items-center justify-center gap-4"
          >
            {Array.from({ length: currentQuestion.count }).map((_, i) => (
              <motion.div
                key={i}
                initial={shouldReduceMotion ? {} : { scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: i * 0.15, type: 'spring', stiffness: 200 }}
                className="w-16 h-16 rounded-xl flex items-center justify-center shadow-lg"
                style={{ backgroundColor: truckColors[i % truckColors.length] }}
              >
                <Truck className="w-10 h-10 text-white" />
              </motion.div>
            ))}
          </motion.div>

          {/* Progress */}
          <div className="text-center mb-6">
            <span className="text-white/60">
              Question {questionIndex + 1} of {TOTAL_QUESTIONS}
            </span>
          </div>

          {/* Options */}
          <div className="grid grid-cols-4 gap-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedOption === option;
              const isCorrect = option === currentQuestion.count;
              const showResult = feedback !== null;

              let bgColor = 'bg-white/20';
              if (showResult) {
                if (isCorrect) bgColor = 'bg-green-500';
                else if (isSelected) bgColor = 'bg-red-400';
              }

              return (
                <motion.button
                  key={option}
                  initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
                  onClick={() => handleAnswer(option)}
                  disabled={feedback !== null}
                  className={`
                    ${bgColor}
                    rounded-2xl p-4 min-h-20
                    flex items-center justify-center
                    shadow-lg transition-colors
                    disabled:cursor-not-allowed
                  `}
                >
                  <span className="text-4xl font-bold text-white">
                    {option}
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
                  text-center mt-6 p-4 rounded-xl
                  ${feedback === 'correct' ? 'bg-green-500/30' : 'bg-red-400/30'}
                `}
              >
                <span className="text-2xl font-bold text-white">
                  {feedback === 'correct' ? 'You counted right!' : `There were ${currentQuestion.count} trucks!`}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </GameWrapper>
  );
}

export default CountTheTrucks;
