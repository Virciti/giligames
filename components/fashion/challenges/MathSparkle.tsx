'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPromptsUpToTier, getWrongAnswers, formatPrompt } from '@/content/mathPrompts';

const TOTAL_QUESTIONS = 5;

interface MathSparkleProps {
  tier: number;
  onAnswer: (correct: boolean, itemId: string) => void;
  onComplete: () => void;
  onBack: () => void;
}

export function MathSparkle({ tier, onAnswer, onComplete, onBack }: MathSparkleProps) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const prompts = useMemo(() => {
    const pool = getPromptsUpToTier(Math.min(tier, 5));
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, TOTAL_QUESTIONS);
  }, [tier]);

  const current = prompts[questionIndex];

  const options = useMemo(() => {
    if (!current) return [];
    const wrongs = getWrongAnswers(current, 3);
    const all = [current.answer, ...wrongs];
    return all.sort(() => Math.random() - 0.5);
  }, [current]);

  const handleSelect = useCallback(
    (answer: number) => {
      if (showResult || !current) return;
      setSelectedAnswer(answer);
      setShowResult(true);

      const correct = answer === current.answer;
      onAnswer(correct, current.id);

      setTimeout(() => {
        if (questionIndex + 1 >= TOTAL_QUESTIONS) {
          onComplete();
        } else {
          setQuestionIndex((i) => i + 1);
          setSelectedAnswer(null);
          setShowResult(false);
        }
      }, 1200);
    },
    [current, showResult, questionIndex, onAnswer, onComplete]
  );

  if (!current) return null;

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="text-white/70 hover:text-white text-sm">
          ← Back
        </button>
        <div className="flex items-center gap-2">
          <span className="text-white font-bold">✨ Math Sparkle</span>
        </div>
        <span className="text-white/70 text-sm">
          {questionIndex + 1}/{TOTAL_QUESTIONS}
        </span>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2 justify-center mb-8">
        {prompts.map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full ${
              i < questionIndex ? 'bg-green-400' : i === questionIndex ? 'bg-white' : 'bg-white/30'
            }`}
          />
        ))}
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={questionIndex}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          className="text-center"
        >
          <p className="text-white/70 text-sm mb-2">Solve to earn sparkle gems!</p>
          <p className="text-4xl font-bold text-white mb-8">{formatPrompt(current)}</p>

          <div className="grid grid-cols-2 gap-4">
            {options.map((opt) => {
              let bg = 'bg-white/20 hover:bg-white/30';
              if (showResult && opt === current.answer) {
                bg = 'bg-green-500';
              } else if (showResult && opt === selectedAnswer) {
                bg = 'bg-red-500/70';
              }

              return (
                <motion.button
                  key={opt}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelect(opt)}
                  disabled={showResult}
                  className={`${bg} text-white font-bold text-2xl py-6 rounded-2xl transition-colors`}
                >
                  {opt}
                </motion.button>
              );
            })}
          </div>

          {showResult && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-4 font-bold text-lg ${
                selectedAnswer === current.answer ? 'text-green-300' : 'text-white/70'
              }`}
            >
              {selectedAnswer === current.answer ? '✨ Sparkle Points!' : `It's ${current.answer}!`}
            </motion.p>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
