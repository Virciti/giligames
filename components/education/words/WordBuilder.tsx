'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Truck, RotateCcw } from 'lucide-react';
import { usePlayerStore } from '@/lib/stores/player-store';
import { GameWrapper } from '../GameWrapper';

interface WordBuilderProps {
  onBack: () => void;
  difficulty?: number;
}

const WORDS = [
  { word: 'CAT', hint: 'A fluffy pet that says meow' },
  { word: 'DOG', hint: 'A friendly pet that barks' },
  { word: 'SUN', hint: 'It shines in the sky' },
  { word: 'HAT', hint: 'You wear it on your head' },
  { word: 'BIG', hint: 'The opposite of small' },
  { word: 'RUN', hint: 'Moving fast with your legs' },
  { word: 'RED', hint: 'The color of an apple' },
  { word: 'BUS', hint: 'A big vehicle for many people' },
  { word: 'CUP', hint: 'You drink from it' },
  { word: 'TOP', hint: 'The highest part' },
];

interface Question {
  word: string;
  hint: string;
  letters: string[];
  extraLetters: string[];
}

function generateQuestion(difficulty: number): Question {
  const wordData = WORDS[Math.floor(Math.random() * WORDS.length)];
  const letters = wordData.word.split('');

  // Add extra letters based on difficulty
  const extraCount = Math.min(1 + difficulty, 4);
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const extraLetters: string[] = [];

  while (extraLetters.length < extraCount) {
    const randomLetter = alphabet[Math.floor(Math.random() * alphabet.length)];
    if (!letters.includes(randomLetter) && !extraLetters.includes(randomLetter)) {
      extraLetters.push(randomLetter);
    }
  }

  return {
    word: wordData.word,
    hint: wordData.hint,
    letters,
    extraLetters,
  };
}

const TOTAL_QUESTIONS = 5;
const truckColors = ['bg-brand-red', 'bg-brand-blue', 'bg-brand-green', 'bg-brand-purple', 'bg-brand-orange', 'bg-brand-yellow'];

export function WordBuilder({ onBack, difficulty = 1 }: WordBuilderProps) {
  const shouldReduceMotion = useReducedMotion();
  const updateMastery = usePlayerStore((s) => s.updateMastery);

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [builtWord, setBuiltWord] = useState<string[]>([]);
  const [availableLetters, setAvailableLetters] = useState<string[]>([]);

  const isComplete = questionIndex >= TOTAL_QUESTIONS;

  useEffect(() => {
    if (!isComplete) {
      const question = generateQuestion(difficulty);
      setCurrentQuestion(question);
      setBuiltWord([]);
      setAvailableLetters(
        [...question.letters, ...question.extraLetters].sort(() => Math.random() - 0.5)
      );
      setFeedback(null);
    }
  }, [questionIndex, difficulty, isComplete]);

  const handleSelectLetter = useCallback((letter: string, index: number) => {
    if (feedback !== null || !currentQuestion) return;

    const nextExpectedLetter = currentQuestion.letters[builtWord.length];

    if (letter === nextExpectedLetter) {
      const newBuiltWord = [...builtWord, letter];
      setBuiltWord(newBuiltWord);
      setAvailableLetters((prev) => {
        const newAvailable = [...prev];
        newAvailable.splice(index, 1);
        return newAvailable;
      });

      // Check if word is complete
      if (newBuiltWord.length === currentQuestion.letters.length) {
        setFeedback('correct');
        setScore((s) => s + 15 * difficulty);
        setCorrectAnswers((c) => c + 1);
        updateMastery(`word-${currentQuestion.word.toLowerCase()}`, true);

        setTimeout(() => {
          setQuestionIndex((i) => i + 1);
        }, 1500);
      }
    } else {
      // Wrong letter - visual feedback but allow retry
      setFeedback('wrong');
      updateMastery(`word-${currentQuestion.word.toLowerCase()}`, false);
      setTimeout(() => setFeedback(null), 500);
    }
  }, [feedback, currentQuestion, builtWord, difficulty, updateMastery]);

  const handleReset = () => {
    if (!currentQuestion || feedback === 'correct') return;
    setBuiltWord([]);
    setAvailableLetters(
      [...currentQuestion.letters, ...currentQuestion.extraLetters].sort(() => Math.random() - 0.5)
    );
  };

  const handleRestart = () => {
    setQuestionIndex(0);
    setScore(0);
    setCorrectAnswers(0);
    setFeedback(null);
    setBuiltWord([]);
  };

  return (
    <GameWrapper
      title="Word Builder"
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
          {/* Hint */}
          <motion.div
            key={questionIndex}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6"
          >
            <p className="text-white text-xl font-bold mb-2">
              Build the word!
            </p>
            <p className="text-white/70 text-lg">
              Hint: {currentQuestion.hint}
            </p>
          </motion.div>

          {/* Progress */}
          <div className="text-center mb-6">
            <span className="text-white/60">
              Question {questionIndex + 1} of {TOTAL_QUESTIONS}
            </span>
          </div>

          {/* Word slots */}
          <div className="flex justify-center gap-2 mb-8">
            {currentQuestion.letters.map((_, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0.8 }}
                animate={{
                  scale: builtWord[index] ? 1.1 : 1,
                  backgroundColor: builtWord[index] ? '#7BC74D' : 'rgba(255,255,255,0.2)',
                }}
                className="w-16 h-20 rounded-xl flex items-center justify-center border-2 border-white/30"
              >
                {builtWord[index] && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-4xl font-bold text-white"
                  >
                    {builtWord[index]}
                  </motion.span>
                )}
              </motion.div>
            ))}
          </div>

          {/* Reset button */}
          {builtWord.length > 0 && feedback !== 'correct' && (
            <div className="flex justify-center mb-4">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-xl text-white hover:bg-white/30"
              >
                <RotateCcw className="w-5 h-5" />
                Start Over
              </motion.button>
            </div>
          )}

          {/* Available letters */}
          <div className="flex flex-wrap justify-center gap-3">
            <AnimatePresence mode="popLayout">
              {availableLetters.map((letter, index) => (
                <motion.button
                  key={`${letter}-${index}`}
                  layout
                  initial={shouldReduceMotion ? {} : { scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, opacity: 0 }}
                  whileTap={shouldReduceMotion ? {} : { scale: 0.9 }}
                  onClick={() => handleSelectLetter(letter, index)}
                  disabled={feedback === 'correct'}
                  className={`
                    ${truckColors[index % truckColors.length]}
                    w-18 h-20 rounded-2xl
                    flex flex-col items-center justify-center
                    shadow-lg
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${feedback === 'wrong' ? 'animate-pulse' : ''}
                  `}
                >
                  <Truck className="w-6 h-6 text-white/80" />
                  <span className="text-3xl font-bold text-white">{letter}</span>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>

          {/* Feedback */}
          <AnimatePresence>
            {feedback === 'correct' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center mt-6 p-4 rounded-xl bg-green-500/30"
              >
                <span className="text-2xl font-bold text-white">
                  Great job! You spelled {currentQuestion.word}!
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </GameWrapper>
  );
}

export default WordBuilder;
