'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { letters } from '@/content/letters';

const TOTAL_QUESTIONS = 5;

interface LetterStitchProps {
  tier: number;
  onAnswer: (correct: boolean, itemId: string) => void;
  onComplete: () => void;
  onBack: () => void;
}

export function LetterStitch({ tier, onAnswer, onComplete, onBack }: LetterStitchProps) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const questions = useMemo(() => {
    const shuffled = [...letters].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, TOTAL_QUESTIONS).map((letter, i) => {
      // Mode alternates: find uppercase, find lowercase, match sound
      const mode = tier >= 3 ? 'sound' : i % 2 === 0 ? 'uppercase' : 'lowercase';

      // Generate wrong options from confusion pairs + random
      const wrongLetters = letter.confusesWith
        ? letter.confusesWith
            .map((id) => letters.find((l) => l.id === id))
            .filter(Boolean)
        : [];
      while (wrongLetters.length < 3) {
        const rand = letters[Math.floor(Math.random() * letters.length)];
        if (rand.id !== letter.id && !wrongLetters.find((w) => w?.id === rand.id)) {
          wrongLetters.push(rand);
        }
      }

      const options = [letter, ...wrongLetters.slice(0, 3)].sort(() => Math.random() - 0.5);

      return { letter, options, mode };
    });
  }, [tier]);

  const current = questions[questionIndex];

  const handleSelect = useCallback(
    (letterId: string) => {
      if (showResult || !current) return;
      setSelectedLetter(letterId);
      setShowResult(true);

      const correct = letterId === current.letter.id;
      onAnswer(correct, current.letter.id);

      setTimeout(() => {
        if (questionIndex + 1 >= TOTAL_QUESTIONS) {
          onComplete();
        } else {
          setQuestionIndex((i) => i + 1);
          setSelectedLetter(null);
          setShowResult(false);
        }
      }, 1200);
    },
    [current, showResult, questionIndex, onAnswer, onComplete]
  );

  if (!current) return null;

  const { letter, mode } = current;

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="text-white/70 hover:text-white text-sm">
          ← Back
        </button>
        <span className="text-white font-bold">🧵 Letter Stitch</span>
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
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          className="text-center"
        >
          <p className="text-white/70 text-sm mb-2">
            {mode === 'sound'
              ? 'Find the letter that makes this sound!'
              : mode === 'uppercase'
                ? 'Find the uppercase letter!'
                : 'Find the lowercase letter!'}
          </p>

          <div className="bg-white/10 rounded-2xl p-6 mb-8">
            <p className="text-5xl font-bold text-white">
              {mode === 'sound'
                ? `"${letter.phoneme}"`
                : mode === 'uppercase'
                  ? letter.lowercase
                  : letter.uppercase}
            </p>
            {mode === 'sound' && (
              <p className="text-white/50 text-sm mt-2">like in &quot;{letter.exampleWord}&quot;</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {current.options.map((opt) => {
              if (!opt) return null;
              let bg = 'bg-white/20 hover:bg-white/30';
              if (showResult && opt.id === letter.id) {
                bg = 'bg-green-500';
              } else if (showResult && opt.id === selectedLetter) {
                bg = 'bg-red-500/70';
              }

              const display =
                mode === 'uppercase'
                  ? opt.uppercase
                  : mode === 'lowercase'
                    ? opt.lowercase
                    : opt.uppercase;

              return (
                <motion.button
                  key={opt.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelect(opt.id)}
                  disabled={showResult}
                  className={`${bg} text-white font-bold text-3xl py-5 rounded-xl transition-colors`}
                >
                  {display}
                </motion.button>
              );
            })}
          </div>

          {showResult && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`mt-4 font-bold ${
                selectedLetter === letter.id ? 'text-green-300' : 'text-white/70'
              }`}
            >
              {selectedLetter === letter.id
                ? 'Perfect stitch!'
                : `It's ${letter.uppercase}!`}
            </motion.p>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
