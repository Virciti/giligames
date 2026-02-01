'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Truck } from 'lucide-react';
import { usePlayerStore } from '@/lib/stores/player-store';
import { GameWrapper } from '../GameWrapper';

interface PictureMatchProps {
  onBack: () => void;
  difficulty?: number;
}

const PICTURE_WORDS = [
  { word: 'truck', emoji: '🚚', hint: 'A vehicle that carries things' },
  { word: 'sun', emoji: '☀️', hint: 'It shines in the sky' },
  { word: 'cat', emoji: '🐱', hint: 'A furry pet that meows' },
  { word: 'dog', emoji: '🐕', hint: 'A friendly pet that barks' },
  { word: 'ball', emoji: '⚽', hint: 'Round toy you can kick' },
  { word: 'star', emoji: '⭐', hint: 'It twinkles at night' },
  { word: 'apple', emoji: '🍎', hint: 'A red fruit' },
  { word: 'fish', emoji: '🐟', hint: 'It swims in water' },
  { word: 'bird', emoji: '🐦', hint: 'It flies in the sky' },
  { word: 'tree', emoji: '🌲', hint: 'It has leaves and branches' },
  { word: 'moon', emoji: '🌙', hint: 'It glows at night' },
  { word: 'rain', emoji: '🌧️', hint: 'Water falling from clouds' },
];

interface Question {
  target: typeof PICTURE_WORDS[0];
  options: string[];
}

function generateQuestion(difficulty: number): Question {
  const target = PICTURE_WORDS[Math.floor(Math.random() * PICTURE_WORDS.length)];
  const options = new Set([target.word]);

  // Add wrong options
  while (options.size < 4) {
    const randomWord = PICTURE_WORDS[Math.floor(Math.random() * PICTURE_WORDS.length)];
    options.add(randomWord.word);
  }

  return {
    target,
    options: Array.from(options).sort(() => Math.random() - 0.5),
  };
}

const TOTAL_QUESTIONS = 5;
const truckColors = ['bg-brand-red', 'bg-brand-blue', 'bg-brand-green', 'bg-brand-purple'];

export function PictureMatch({ onBack, difficulty = 1 }: PictureMatchProps) {
  const shouldReduceMotion = useReducedMotion();
  const updateMastery = usePlayerStore((s) => s.updateMastery);

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  const isComplete = questionIndex >= TOTAL_QUESTIONS;

  useEffect(() => {
    if (!isComplete) {
      setCurrentQuestion(generateQuestion(difficulty));
      setFeedback(null);
      setSelectedWord(null);
    }
  }, [questionIndex, difficulty, isComplete]);

  const handleAnswer = useCallback((word: string) => {
    if (feedback !== null || !currentQuestion) return;

    setSelectedWord(word);
    const isCorrect = word === currentQuestion.target.word;

    setFeedback(isCorrect ? 'correct' : 'wrong');
    updateMastery(`picture-${currentQuestion.target.word}`, isCorrect);

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
    setSelectedWord(null);
  };

  return (
    <GameWrapper
      title="Picture Match"
      category="words"
      onBack={onBack}
      score={score}
      totalQuestions={TOTAL_QUESTIONS}
      correctAnswers={correctAnswers}
      isComplete={isComplete}
      onRestart={handleRestart}
    >
      {currentQuestion && (
        <div className="max-w-2xl mx-auto">
          {/* Picture */}
          <motion.div
            key={questionIndex}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center mb-8"
          >
            <p className="text-white/80 text-lg mb-4">
              What word matches this picture?
            </p>

            <div className="bg-white/20 rounded-3xl p-8 inline-block">
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                className="text-9xl"
              >
                {currentQuestion.target.emoji}
              </motion.span>
            </div>

            <p className="text-white/60 mt-4">
              {currentQuestion.target.hint}
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
            <AnimatePresence mode="wait">
              {currentQuestion.options.map((word, index) => {
                const isSelected = selectedWord === word;
                const isCorrect = word === currentQuestion.target.word;
                const showResult = feedback !== null;

                let bgColor = truckColors[index];
                if (showResult) {
                  if (isCorrect) bgColor = 'bg-green-500';
                  else if (isSelected) bgColor = 'bg-red-400';
                }

                return (
                  <motion.button
                    key={`${questionIndex}-${word}`}
                    initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                    whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
                    onClick={() => handleAnswer(word)}
                    disabled={feedback !== null}
                    className={`
                      ${bgColor}
                      rounded-2xl p-6 min-h-24
                      flex flex-col items-center justify-center
                      shadow-lg transition-colors
                      disabled:cursor-not-allowed
                    `}
                  >
                    <Truck className="w-8 h-8 text-white/80 mb-2" />
                    <span className="text-2xl font-bold text-white uppercase">
                      {word}
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
                  {feedback === 'correct'
                    ? `Yes! ${currentQuestion.target.emoji} is a ${currentQuestion.target.word}!`
                    : `That's a ${currentQuestion.target.word}!`}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </GameWrapper>
  );
}

export default PictureMatch;
