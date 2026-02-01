'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Truck } from 'lucide-react';
import { usePlayerStore } from '@/lib/stores/player-store';
import { GameWrapper } from '../GameWrapper';

interface RhymeRaceProps {
  onBack: () => void;
  difficulty?: number;
}

const RHYME_GROUPS = [
  { base: 'CAT', rhymes: ['BAT', 'HAT', 'RAT', 'SAT', 'MAT'], nonRhymes: ['DOG', 'SUN', 'BIG'] },
  { base: 'DOG', rhymes: ['LOG', 'FOG', 'HOG', 'JOG'], nonRhymes: ['CAT', 'BIG', 'RED'] },
  { base: 'SUN', rhymes: ['FUN', 'RUN', 'BUN', 'GUN'], nonRhymes: ['CAT', 'DOG', 'HAT'] },
  { base: 'RED', rhymes: ['BED', 'FED', 'LED', 'TED'], nonRhymes: ['SUN', 'FUN', 'CAT'] },
  { base: 'CAR', rhymes: ['STAR', 'FAR', 'JAR', 'BAR'], nonRhymes: ['BIG', 'DOG', 'RUN'] },
  { base: 'BALL', rhymes: ['TALL', 'FALL', 'CALL', 'WALL'], nonRhymes: ['CAT', 'SUN', 'RED'] },
  { base: 'KING', rhymes: ['RING', 'SING', 'WING', 'THING'], nonRhymes: ['DOG', 'CAT', 'SUN'] },
  { base: 'BOAT', rhymes: ['COAT', 'GOAT', 'FLOAT'], nonRhymes: ['BALL', 'KING', 'CAR'] },
];

interface Question {
  baseWord: string;
  options: { word: string; isRhyme: boolean }[];
  correctCount: number;
}

function generateQuestion(difficulty: number): Question {
  const group = RHYME_GROUPS[Math.floor(Math.random() * RHYME_GROUPS.length)];
  const rhymeCount = Math.min(1 + Math.floor(difficulty / 2), 3);
  const nonRhymeCount = 4 - rhymeCount;

  const shuffledRhymes = [...group.rhymes].sort(() => Math.random() - 0.5).slice(0, rhymeCount);
  const shuffledNonRhymes = [...group.nonRhymes].sort(() => Math.random() - 0.5).slice(0, nonRhymeCount);

  const options = [
    ...shuffledRhymes.map((word) => ({ word, isRhyme: true })),
    ...shuffledNonRhymes.map((word) => ({ word, isRhyme: false })),
  ].sort(() => Math.random() - 0.5);

  return {
    baseWord: group.base,
    options,
    correctCount: rhymeCount,
  };
}

const TOTAL_QUESTIONS = 5;
const truckColors = ['bg-brand-red', 'bg-brand-blue', 'bg-brand-green', 'bg-brand-purple'];

export function RhymeRace({ onBack, difficulty = 1 }: RhymeRaceProps) {
  const shouldReduceMotion = useReducedMotion();
  const updateMastery = usePlayerStore((s) => s.updateMastery);

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | 'checking' | null>(null);

  const isComplete = questionIndex >= TOTAL_QUESTIONS;

  useEffect(() => {
    if (!isComplete) {
      setCurrentQuestion(generateQuestion(difficulty));
      setSelectedWords([]);
      setFeedback(null);
    }
  }, [questionIndex, difficulty, isComplete]);

  const handleSelectWord = useCallback((word: string) => {
    if (feedback !== null || !currentQuestion) return;

    const option = currentQuestion.options.find((o) => o.word === word);
    if (!option) return;

    if (option.isRhyme) {
      // Correct rhyme selection
      const newSelected = [...selectedWords, word];
      setSelectedWords(newSelected);

      // Check if all rhymes found
      if (newSelected.length === currentQuestion.correctCount) {
        setFeedback('correct');
        setScore((s) => s + 15 * difficulty);
        setCorrectAnswers((c) => c + 1);
        updateMastery(`rhyme-${currentQuestion.baseWord.toLowerCase()}`, true);

        setTimeout(() => {
          setQuestionIndex((i) => i + 1);
        }, 1500);
      }
    } else {
      // Wrong selection
      setFeedback('wrong');
      updateMastery(`rhyme-${currentQuestion.baseWord.toLowerCase()}`, false);
      setTimeout(() => setFeedback(null), 500);
    }
  }, [feedback, currentQuestion, selectedWords, difficulty, updateMastery]);

  const handleRestart = () => {
    setQuestionIndex(0);
    setScore(0);
    setCorrectAnswers(0);
    setSelectedWords([]);
    setFeedback(null);
  };

  return (
    <GameWrapper
      title="Rhyme Race"
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
          {/* Base Word */}
          <motion.div
            key={questionIndex}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <p className="text-white/80 text-lg mb-2">
              Find words that rhyme with
            </p>
            <div className="bg-white/20 rounded-3xl p-6 inline-block">
              <span className="text-5xl font-bold text-white">
                {currentQuestion.baseWord}
              </span>
            </div>
            <p className="text-white/60 mt-4">
              Find {currentQuestion.correctCount} rhyming word{currentQuestion.correctCount > 1 ? 's' : ''}!
              ({selectedWords.length}/{currentQuestion.correctCount} found)
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
              const isSelected = selectedWords.includes(option.word);
              const showResult = feedback === 'correct';

              let bgColor = truckColors[index];
              if (isSelected) bgColor = 'bg-green-500';
              else if (showResult && option.isRhyme) bgColor = 'bg-green-500/50';

              return (
                <motion.button
                  key={option.word}
                  initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.8 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    x: feedback === 'wrong' && !isSelected ? [0, -5, 5, -5, 5, 0] : 0,
                  }}
                  transition={{ delay: index * 0.1 }}
                  whileTap={shouldReduceMotion || isSelected ? {} : { scale: 0.95 }}
                  onClick={() => handleSelectWord(option.word)}
                  disabled={isSelected || feedback === 'correct'}
                  className={`
                    ${bgColor}
                    rounded-2xl p-6 min-h-24
                    flex flex-col items-center justify-center
                    shadow-lg transition-colors
                    disabled:cursor-not-allowed
                  `}
                >
                  <Truck className="w-8 h-8 text-white/80 mb-1" />
                  <span className="text-2xl font-bold text-white">
                    {option.word}
                  </span>
                </motion.button>
              );
            })}
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
                  Great! {selectedWords.join(', ')} rhyme{selectedWords.length > 1 ? '' : 's'} with {currentQuestion.baseWord}!
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </GameWrapper>
  );
}

export default RhymeRace;
