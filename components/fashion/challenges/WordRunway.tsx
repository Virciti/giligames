'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getWordsUpToTier } from '@/content/sightWords';

const TOTAL_QUESTIONS = 5;

interface WordRunwayProps {
  tier: number;
  onAnswer: (correct: boolean, itemId: string) => void;
  onComplete: () => void;
  onBack: () => void;
}

export function WordRunway({ tier, onAnswer, onComplete, onBack }: WordRunwayProps) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const questions = useMemo(() => {
    const pool = getWordsUpToTier(Math.min(tier + 2, 5)); // Tier 1 gets words up to tier 3
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, TOTAL_QUESTIONS).map((word) => {
      // Get 3 wrong options from nearby tiers
      const wrongs = pool
        .filter((w) => w.id !== word.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((w) => w.word);
      const options = [word.word, ...wrongs].sort(() => Math.random() - 0.5);
      return { word, options };
    });
  }, [tier]);

  const current = questions[questionIndex];

  const handleSelect = useCallback(
    (word: string) => {
      if (showResult || !current) return;
      setSelectedWord(word);
      setShowResult(true);

      const correct = word === current.word.word;
      onAnswer(correct, current.word.id);

      setTimeout(() => {
        if (questionIndex + 1 >= TOTAL_QUESTIONS) {
          onComplete();
        } else {
          setQuestionIndex((i) => i + 1);
          setSelectedWord(null);
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
        <span className="text-white font-bold">📖 Word Runway</span>
        <span className="text-white/70 text-sm">
          {questionIndex + 1}/{TOTAL_QUESTIONS}
        </span>
      </div>

      <div className="flex gap-2 justify-center mb-8">
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
          <p className="text-white/70 text-sm mb-2">Find the correct spelling!</p>
          <div className="bg-white/10 rounded-2xl p-6 mb-8">
            <p className="text-5xl font-bold text-white tracking-widest">
              {current.word.word}
            </p>
          </div>

          <p className="text-white/70 text-sm mb-4">Tap the matching word:</p>

          <div className="grid grid-cols-2 gap-3">
            {current.options.map((opt) => {
              let bg = 'bg-white/20 hover:bg-white/30';
              if (showResult && opt === current.word.word) {
                bg = 'bg-green-500';
              } else if (showResult && opt === selectedWord) {
                bg = 'bg-red-500/70';
              }

              return (
                <motion.button
                  key={opt}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelect(opt)}
                  disabled={showResult}
                  className={`${bg} text-white font-bold text-xl py-5 rounded-xl transition-colors`}
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
              className={`mt-4 font-bold ${
                selectedWord === current.word.word ? 'text-green-300' : 'text-white/70'
              }`}
            >
              {selectedWord === current.word.word ? 'You found it!' : `The word is "${current.word.word}"`}
            </motion.p>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
