'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getColorMixUpToTier, getWrongColors } from '@/content/colorMixing';

const TOTAL_QUESTIONS = 5;

interface ColorMixStudioProps {
  tier: number;
  onAnswer: (correct: boolean, itemId: string) => void;
  onComplete: () => void;
  onBack: () => void;
}

export function ColorMixStudio({ tier, onAnswer, onComplete, onBack }: ColorMixStudioProps) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const questions = useMemo(() => {
    const pool = getColorMixUpToTier(Math.min(tier + 1, 5));
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, TOTAL_QUESTIONS).map((q) => {
      const wrongs = getWrongColors(q.result, 3);
      const options = [q.result, ...wrongs].sort(() => Math.random() - 0.5);
      return { question: q, options };
    });
  }, [tier]);

  const current = questions[questionIndex];

  const handleSelect = useCallback(
    (colorName: string) => {
      if (showResult || !current) return;
      setSelectedColor(colorName);
      setShowResult(true);

      const correct = colorName === current.question.result.name;
      onAnswer(correct, current.question.id);

      setTimeout(() => {
        if (questionIndex + 1 >= TOTAL_QUESTIONS) {
          onComplete();
        } else {
          setQuestionIndex((i) => i + 1);
          setSelectedColor(null);
          setShowResult(false);
        }
      }, 1500);
    },
    [current, showResult, questionIndex, onAnswer, onComplete]
  );

  if (!current) return null;

  const { question } = current;

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="text-white/70 hover:text-white text-sm">
          ← Back
        </button>
        <span className="text-white font-bold">🎨 Color Mix Studio</span>
        <span className="text-white/70 text-sm">
          {questionIndex + 1}/{TOTAL_QUESTIONS}
        </span>
      </div>

      <div className="flex gap-2 justify-center mb-6">
        {questions.map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full ${
              i < questionIndex ? 'bg-green-400' : i === questionIndex ? 'bg-white' : 'bg-white/30'
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={questionIndex}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="text-center"
        >
          <p className="text-white/70 text-sm mb-4">Mix these colors! What do you get?</p>

          {/* Color mixing visualization */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring' }}
              className="flex flex-col items-center"
            >
              <div
                className="w-16 h-16 rounded-full border-2 border-white/30 shadow-lg"
                style={{ backgroundColor: question.color1.hex }}
              />
              <span className="text-white text-sm mt-2">{question.color1.name}</span>
            </motion.div>

            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="text-3xl text-white font-bold"
            >
              +
            </motion.span>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="flex flex-col items-center"
            >
              <div
                className="w-16 h-16 rounded-full border-2 border-white/30 shadow-lg"
                style={{ backgroundColor: question.color2.hex }}
              />
              <span className="text-white text-sm mt-2">{question.color2.name}</span>
            </motion.div>

            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 }}
              className="text-3xl text-white font-bold"
            >
              =
            </motion.span>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col items-center"
            >
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/50 flex items-center justify-center">
                {showResult ? (
                  <div
                    className="w-14 h-14 rounded-full"
                    style={{ backgroundColor: question.result.hex }}
                  />
                ) : (
                  <span className="text-white text-2xl">?</span>
                )}
              </div>
            </motion.div>
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 gap-3">
            {current.options.map((opt) => {
              let ring = '';
              if (showResult && opt.name === question.result.name) {
                ring = 'ring-2 ring-green-400';
              } else if (showResult && opt.name === selectedColor) {
                ring = 'ring-2 ring-red-400';
              }

              return (
                <motion.button
                  key={opt.name}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelect(opt.name)}
                  disabled={showResult}
                  className={`bg-white/15 hover:bg-white/25 rounded-xl p-4 flex items-center gap-3 transition-colors ${ring}`}
                >
                  <div
                    className="w-10 h-10 rounded-full border border-white/20 flex-shrink-0"
                    style={{ backgroundColor: opt.hex }}
                  />
                  <span className="text-white font-medium">{opt.name}</span>
                </motion.button>
              );
            })}
          </div>

          {showResult && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-4 font-bold ${
                selectedColor === question.result.name ? 'text-green-300' : 'text-white/70'
              }`}
            >
              {selectedColor === question.result.name
                ? `Yes! ${question.color1.name} + ${question.color2.name} = ${question.result.name}!`
                : `It makes ${question.result.name}!`}
            </motion.p>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
