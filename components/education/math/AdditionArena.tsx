'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Truck } from 'lucide-react';
import { getPromptsByOperation, getWrongAnswers, formatPrompt, type MathPrompt } from '@/content/mathPrompts';
import { usePlayerStore } from '@/lib/stores/player-store';
import { GameWrapper } from '../GameWrapper';

interface AdditionArenaProps {
  onBack: () => void;
  difficulty?: number;
}

interface Question {
  prompt: MathPrompt;
  options: number[];
}

function generateQuestion(tier: number): Question {
  const prompts = getPromptsByOperation('addition').filter((p) => p.tier <= tier);
  const prompt = prompts[Math.floor(Math.random() * prompts.length)];
  const wrongAnswers = getWrongAnswers(prompt, 3);
  const options = [prompt.answer, ...wrongAnswers].sort(() => Math.random() - 0.5);

  return { prompt, options };
}

const TOTAL_QUESTIONS = 5;
const truckColors = ['bg-brand-green', 'bg-brand-blue', 'bg-brand-purple', 'bg-brand-orange'];

export function AdditionArena({ onBack, difficulty = 1 }: AdditionArenaProps) {
  const shouldReduceMotion = useReducedMotion();
  const updateMastery = usePlayerStore((s) => s.updateMastery);

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [tier, setTier] = useState(difficulty);
  const [streak, setStreak] = useState(0);

  const isComplete = questionIndex >= TOTAL_QUESTIONS;

  useEffect(() => {
    if (!isComplete) {
      setCurrentQuestion(generateQuestion(tier));
      setFeedback(null);
      setSelectedAnswer(null);
    }
  }, [questionIndex, tier, isComplete]);

  const handleAnswer = useCallback((answer: number) => {
    if (feedback !== null || !currentQuestion) return;

    setSelectedAnswer(answer);
    const isCorrect = answer === currentQuestion.prompt.answer;

    setFeedback(isCorrect ? 'correct' : 'wrong');
    updateMastery(currentQuestion.prompt.id, isCorrect);

    if (isCorrect) {
      setScore((s) => s + 10 * tier);
      setCorrectAnswers((c) => c + 1);
      setStreak((s) => s + 1);

      // Increase difficulty after 3 correct in a row
      if (streak >= 2 && tier < 5) {
        setTier((t) => t + 1);
        setStreak(0);
      }
    } else {
      setStreak(0);
      // Decrease difficulty after wrong answer
      if (tier > 1) {
        setTier((t) => t - 1);
      }
    }

    setTimeout(() => {
      setQuestionIndex((i) => i + 1);
    }, 1200);
  }, [feedback, currentQuestion, tier, streak, updateMastery]);

  const handleRestart = () => {
    setQuestionIndex(0);
    setScore(0);
    setCorrectAnswers(0);
    setFeedback(null);
    setSelectedAnswer(null);
    setTier(difficulty);
    setStreak(0);
  };

  return (
    <GameWrapper
      title="Addition Arena"
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
          {/* Problem Display */}
          <motion.div
            key={questionIndex}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            {/* Visual representation */}
            <div className="flex justify-center items-center gap-4 mb-6">
              <div className="flex gap-1">
                {Array.from({ length: currentQuestion.prompt.operand1 }).map((_, i) => (
                  <motion.div
                    key={`a-${i}`}
                    initial={shouldReduceMotion ? {} : { scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="w-8 h-8 bg-brand-green rounded-lg flex items-center justify-center"
                  >
                    <Truck className="w-5 h-5 text-white" />
                  </motion.div>
                ))}
              </div>
              <span className="text-4xl font-bold text-white">+</span>
              <div className="flex gap-1">
                {Array.from({ length: currentQuestion.prompt.operand2 }).map((_, i) => (
                  <motion.div
                    key={`b-${i}`}
                    initial={shouldReduceMotion ? {} : { scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    className="w-8 h-8 bg-brand-blue rounded-lg flex items-center justify-center"
                  >
                    <Truck className="w-5 h-5 text-white" />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Equation */}
            <div className="bg-white/20 rounded-3xl p-6 inline-block">
              <span className="text-5xl font-bold text-white">
                {formatPrompt(currentQuestion.prompt)}
              </span>
            </div>
          </motion.div>

          {/* Progress */}
          <div className="text-center mb-6">
            <span className="text-white/60">
              Question {questionIndex + 1} of {TOTAL_QUESTIONS}
            </span>
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 gap-4">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === option;
              const isCorrect = option === currentQuestion.prompt.answer;
              const showResult = feedback !== null;

              let bgColor = truckColors[index];
              if (showResult) {
                if (isCorrect) bgColor = 'bg-green-500';
                else if (isSelected) bgColor = 'bg-red-400';
              }

              return (
                <motion.button
                  key={option}
                  initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
                  onClick={() => handleAnswer(option)}
                  disabled={feedback !== null}
                  className={`
                    ${bgColor}
                    rounded-2xl p-6 min-h-24
                    flex flex-col items-center justify-center
                    shadow-lg transition-colors
                    disabled:cursor-not-allowed
                  `}
                >
                  <Truck className="w-8 h-8 text-white/80 mb-1" />
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
                  {feedback === 'correct'
                    ? `Correct! ${currentQuestion.prompt.operand1} + ${currentQuestion.prompt.operand2} = ${currentQuestion.prompt.answer}`
                    : `The answer is ${currentQuestion.prompt.answer}!`}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </GameWrapper>
  );
}

export default AdditionArena;
