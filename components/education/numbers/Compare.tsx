'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Truck } from 'lucide-react';
import { usePlayerStore } from '@/lib/stores/player-store';
import { GameWrapper } from '../GameWrapper';

interface CompareProps {
  onBack: () => void;
  difficulty?: number;
}

interface Question {
  leftCount: number;
  rightCount: number;
  questionType: 'more' | 'less';
  correctSide: 'left' | 'right';
}

function generateQuestion(difficulty: number): Question {
  const maxCount = Math.min(5 + difficulty * 2, 10);
  let leftCount = Math.floor(Math.random() * maxCount) + 1;
  let rightCount = Math.floor(Math.random() * maxCount) + 1;

  // Ensure they're different
  while (rightCount === leftCount) {
    rightCount = Math.floor(Math.random() * maxCount) + 1;
  }

  const questionType = Math.random() < 0.5 ? 'more' : 'less';
  const correctSide = questionType === 'more'
    ? (leftCount > rightCount ? 'left' : 'right')
    : (leftCount < rightCount ? 'left' : 'right');

  return { leftCount, rightCount, questionType, correctSide };
}

const TOTAL_QUESTIONS = 5;

export function Compare({ onBack, difficulty = 1 }: CompareProps) {
  const shouldReduceMotion = useReducedMotion();
  const updateMastery = usePlayerStore((s) => s.updateMastery);

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [selectedSide, setSelectedSide] = useState<'left' | 'right' | null>(null);

  const isComplete = questionIndex >= TOTAL_QUESTIONS;

  useEffect(() => {
    if (!isComplete) {
      setCurrentQuestion(generateQuestion(difficulty));
      setFeedback(null);
      setSelectedSide(null);
    }
  }, [questionIndex, difficulty, isComplete]);

  const handleSelect = useCallback((side: 'left' | 'right') => {
    if (feedback !== null || !currentQuestion) return;

    setSelectedSide(side);
    const isCorrect = side === currentQuestion.correctSide;

    setFeedback(isCorrect ? 'correct' : 'wrong');
    updateMastery(`compare-${currentQuestion.questionType}`, isCorrect);

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
    setSelectedSide(null);
  };

  const renderTrucks = (count: number, color: string) => (
    <div className="flex flex-wrap justify-center gap-2 p-4">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={shouldReduceMotion ? {} : { scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: i * 0.1 }}
          className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center`}
        >
          <Truck className="w-6 h-6 text-white" />
        </motion.div>
      ))}
    </div>
  );

  return (
    <GameWrapper
      title="Compare"
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
            <p className="text-white text-3xl font-bold">
              Which has {currentQuestion.questionType === 'more' ? 'MORE' : 'LESS'}?
            </p>
          </motion.div>

          {/* Progress */}
          <div className="text-center mb-6">
            <span className="text-white/60">
              Question {questionIndex + 1} of {TOTAL_QUESTIONS}
            </span>
          </div>

          {/* Comparison */}
          <div className="grid grid-cols-2 gap-6">
            {/* Left Side */}
            <motion.button
              whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
              onClick={() => handleSelect('left')}
              disabled={feedback !== null}
              className={`
                rounded-3xl min-h-48 flex flex-col items-center justify-center
                transition-all border-4
                ${selectedSide === 'left'
                  ? feedback === 'correct'
                    ? 'bg-green-500/30 border-green-500'
                    : 'bg-red-400/30 border-red-400'
                  : feedback !== null && currentQuestion.correctSide === 'left'
                    ? 'bg-green-500/30 border-green-500'
                    : 'bg-white/10 border-transparent hover:bg-white/20'}
                disabled:cursor-not-allowed
              `}
            >
              {renderTrucks(currentQuestion.leftCount, 'bg-brand-red')}
              <span className="text-4xl font-bold text-white mt-2">
                {currentQuestion.leftCount}
              </span>
            </motion.button>

            {/* Right Side */}
            <motion.button
              whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
              onClick={() => handleSelect('right')}
              disabled={feedback !== null}
              className={`
                rounded-3xl min-h-48 flex flex-col items-center justify-center
                transition-all border-4
                ${selectedSide === 'right'
                  ? feedback === 'correct'
                    ? 'bg-green-500/30 border-green-500'
                    : 'bg-red-400/30 border-red-400'
                  : feedback !== null && currentQuestion.correctSide === 'right'
                    ? 'bg-green-500/30 border-green-500'
                    : 'bg-white/10 border-transparent hover:bg-white/20'}
                disabled:cursor-not-allowed
              `}
            >
              {renderTrucks(currentQuestion.rightCount, 'bg-brand-blue')}
              <span className="text-4xl font-bold text-white mt-2">
                {currentQuestion.rightCount}
              </span>
            </motion.button>
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
                  {feedback === 'correct'
                    ? 'You got it!'
                    : `${currentQuestion.correctSide === 'left' ? currentQuestion.leftCount : currentQuestion.rightCount} is ${currentQuestion.questionType}!`}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </GameWrapper>
  );
}

export default Compare;
