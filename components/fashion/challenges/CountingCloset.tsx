'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TOTAL_QUESTIONS = 5;

interface CountingClosetProps {
  tier: number;
  onAnswer: (correct: boolean, itemId: string) => void;
  onComplete: () => void;
  onBack: () => void;
}

const HANGER_ITEMS = ['👗', '👕', '👖', '🧥', '👔', '🥿', '👒'];

function generateQuestion(tier: number) {
  // Tier determines max count
  const maxCount = Math.min(4 + tier * 3, 20);
  const minCount = Math.max(1, tier - 1);
  const count = Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount;
  const item = HANGER_ITEMS[Math.floor(Math.random() * HANGER_ITEMS.length)];

  // Generate wrong answers
  const wrongs = new Set<number>();
  while (wrongs.size < 3) {
    const wrong = count + Math.floor(Math.random() * 5) - 2;
    if (wrong > 0 && wrong !== count) wrongs.add(wrong);
  }

  const options = [count, ...Array.from(wrongs)].sort(() => Math.random() - 0.5);

  return { count, item, options, id: `count-${count}-${Date.now()}` };
}

export function CountingCloset({ tier, onAnswer, onComplete, onBack }: CountingClosetProps) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const questions = useMemo(
    () => Array.from({ length: TOTAL_QUESTIONS }, () => generateQuestion(tier)),
    [tier]
  );

  const current = questions[questionIndex];

  const handleSelect = useCallback(
    (answer: number) => {
      if (showResult || !current) return;
      setSelectedAnswer(answer);
      setShowResult(true);

      const correct = answer === current.count;
      onAnswer(correct, `number-${current.count}`);

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
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="text-white/70 hover:text-white text-sm">
          ← Back
        </button>
        <span className="text-white font-bold">👗 Counting Closet</span>
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="text-center"
        >
          <p className="text-white/70 text-sm mb-4">Count the items in the closet!</p>

          {/* Items display */}
          <div className="bg-white/10 rounded-2xl p-6 mb-6 min-h-[120px] flex flex-wrap items-center justify-center gap-2">
            {Array.from({ length: current.count }).map((_, i) => (
              <motion.span
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.08, type: 'spring' }}
                className="text-3xl"
              >
                {current.item}
              </motion.span>
            ))}
          </div>

          <p className="text-white text-lg mb-4">How many?</p>

          <div className="grid grid-cols-2 gap-3">
            {current.options.map((opt) => {
              let bg = 'bg-white/20 hover:bg-white/30';
              if (showResult && opt === current.count) {
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
                  className={`${bg} text-white font-bold text-2xl py-5 rounded-xl transition-colors`}
                >
                  {opt}
                </motion.button>
              );
            })}
          </div>

          {showResult && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`mt-4 font-bold ${
                selectedAnswer === current.count ? 'text-green-300' : 'text-white/70'
              }`}
            >
              {selectedAnswer === current.count
                ? 'Great counting!'
                : `There are ${current.count}!`}
            </motion.p>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
