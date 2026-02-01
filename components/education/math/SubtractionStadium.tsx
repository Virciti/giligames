'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Truck, X } from 'lucide-react';
import { getPromptsByOperation, getWrongAnswers, formatPrompt, type MathPrompt } from '@/content/mathPrompts';
import { usePlayerStore } from '@/lib/stores/player-store';
import { GameWrapper } from '../GameWrapper';

interface SubtractionStadiumProps {
  onBack: () => void;
  difficulty?: number;
}

interface Question {
  prompt: MathPrompt;
  options: number[];
}

function generateQuestion(tier: number): Question {
  const prompts = getPromptsByOperation('subtraction').filter((p) => p.tier <= tier);
  const prompt = prompts[Math.floor(Math.random() * prompts.length)];
  const wrongAnswers = getWrongAnswers(prompt, 3);
  const options = [prompt.answer, ...wrongAnswers].sort(() => Math.random() - 0.5);

  return { prompt, options };
}

const TOTAL_QUESTIONS = 5;
const truckColors = ['bg-brand-orange', 'bg-brand-red', 'bg-brand-purple', 'bg-brand-blue'];

export function SubtractionStadium({ onBack, difficulty = 1 }: SubtractionStadiumProps) {
  const shouldReduceMotion = useReducedMotion();
  const updateMastery = usePlayerStore((s) => s.updateMastery);

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [tier, setTier] = useState(difficulty);
  const [showAnimation, setShowAnimation] = useState(false);

  const isComplete = questionIndex >= TOTAL_QUESTIONS;

  useEffect(() => {
    if (!isComplete) {
      setCurrentQuestion(generateQuestion(tier));
      setFeedback(null);
      setSelectedAnswer(null);
      setShowAnimation(true);
      setTimeout(() => setShowAnimation(false), 1500);
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
    }

    setTimeout(() => {
      setQuestionIndex((i) => i + 1);
    }, 1200);
  }, [feedback, currentQuestion, tier, updateMastery]);

  const handleRestart = () => {
    setQuestionIndex(0);
    setScore(0);
    setCorrectAnswers(0);
    setFeedback(null);
    setSelectedAnswer(null);
    setTier(difficulty);
  };

  return (
    <GameWrapper
      title="Subtraction Stadium"
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
            <div className="flex justify-center items-center gap-2 mb-6 min-h-16">
              {Array.from({ length: currentQuestion.prompt.operand1 }).map((_, i) => {
                const isRemoved = i >= currentQuestion.prompt.answer;
                return (
                  <motion.div
                    key={`truck-${i}`}
                    initial={shouldReduceMotion ? {} : { scale: 0 }}
                    animate={{
                      scale: 1,
                      opacity: showAnimation && isRemoved ? [1, 1, 0] : isRemoved ? 0.3 : 1,
                      x: showAnimation && isRemoved ? [0, 0, 50] : 0,
                    }}
                    transition={{
                      delay: i * 0.05,
                      opacity: { delay: 0.8, duration: 0.5 },
                      x: { delay: 0.8, duration: 0.5 },
                    }}
                    className={`
                      w-10 h-10 rounded-lg flex items-center justify-center relative
                      ${isRemoved ? 'bg-brand-red/50' : 'bg-brand-orange'}
                    `}
                  >
                    <Truck className="w-6 h-6 text-white" />
                    {isRemoved && !showAnimation && (
                      <div className="absolute inset-0 flex items-center justify-center bg-red-500/50 rounded-lg">
                        <X className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Equation */}
            <div className="bg-white/20 rounded-3xl p-6 inline-block">
              <span className="text-5xl font-bold text-white">
                {formatPrompt(currentQuestion.prompt)}
              </span>
            </div>

            <p className="text-white/70 mt-4">
              {currentQuestion.prompt.operand1} trucks, {currentQuestion.prompt.operand2} drive away...
            </p>
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
                    ? `Correct! ${currentQuestion.prompt.operand1} - ${currentQuestion.prompt.operand2} = ${currentQuestion.prompt.answer}`
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

export default SubtractionStadium;
