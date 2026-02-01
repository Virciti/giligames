'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Truck } from 'lucide-react';
import { letters, getLetterById, getConfusionPairs } from '@/content/letters';
import { usePlayerStore } from '@/lib/stores/player-store';
import { GameWrapper } from '../GameWrapper';

interface LetterFindProps {
  onBack: () => void;
  difficulty?: number;
}

interface Question {
  targetLetter: typeof letters[0];
  options: typeof letters[0][];
}

function generateQuestion(difficulty: number): Question {
  const targetLetter = letters[Math.floor(Math.random() * letters.length)];
  const options = new Set([targetLetter]);

  // Add confusion pairs first (harder)
  const confusionPairs = getConfusionPairs(targetLetter.id);
  confusionPairs.forEach((letter) => {
    if (options.size < 4) options.add(letter);
  });

  // Fill remaining with random letters
  while (options.size < 4) {
    const randomLetter = letters[Math.floor(Math.random() * letters.length)];
    options.add(randomLetter);
  }

  return {
    targetLetter,
    options: Array.from(options).sort(() => Math.random() - 0.5),
  };
}

const TOTAL_QUESTIONS = 5;
const truckColors = ['bg-brand-red', 'bg-brand-blue', 'bg-brand-green', 'bg-brand-purple'];

export function LetterFind({ onBack, difficulty = 1 }: LetterFindProps) {
  const shouldReduceMotion = useReducedMotion();
  const updateMastery = usePlayerStore((s) => s.updateMastery);

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);

  const isComplete = questionIndex >= TOTAL_QUESTIONS;

  useEffect(() => {
    if (!isComplete) {
      setCurrentQuestion(generateQuestion(difficulty));
      setFeedback(null);
      setSelectedLetter(null);
    }
  }, [questionIndex, difficulty, isComplete]);

  const handleAnswer = useCallback((letterId: string) => {
    if (feedback !== null || !currentQuestion) return;

    setSelectedLetter(letterId);
    const isCorrect = letterId === currentQuestion.targetLetter.id;

    setFeedback(isCorrect ? 'correct' : 'wrong');
    updateMastery(currentQuestion.targetLetter.id, isCorrect);

    if (isCorrect) {
      setScore((s) => s + 10 * difficulty);
      setCorrectAnswers((c) => c + 1);
    }

    setTimeout(() => {
      setQuestionIndex((i) => i + 1);
    }, 1000);
  }, [feedback, currentQuestion, difficulty, updateMastery]);

  const handleRestart = () => {
    setQuestionIndex(0);
    setScore(0);
    setCorrectAnswers(0);
    setFeedback(null);
    setSelectedLetter(null);
  };

  return (
    <GameWrapper
      title="Letter Find"
      category="letters"
      onBack={onBack}
      score={score}
      totalQuestions={TOTAL_QUESTIONS}
      correctAnswers={correctAnswers}
      isComplete={isComplete}
      onRestart={handleRestart}
    >
      {currentQuestion && (
        <div className="max-w-2xl mx-auto">
          {/* Question */}
          <motion.div
            key={questionIndex}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <p className="text-white/80 text-lg mb-2">Find the letter</p>
            <div className="bg-white/20 rounded-3xl p-8 inline-block">
              <span className="text-7xl font-bold text-white">
                {currentQuestion.targetLetter.uppercase}
              </span>
            </div>
            <p className="text-white/70 text-xl mt-4">
              &quot;{currentQuestion.targetLetter.phoneme}&quot; like in {currentQuestion.targetLetter.exampleWord}
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
              {currentQuestion.options.map((letter, index) => {
                const isSelected = selectedLetter === letter.id;
                const isCorrect = letter.id === currentQuestion.targetLetter.id;
                const showResult = feedback !== null;

                let bgColor = truckColors[index];
                if (showResult) {
                  if (isCorrect) bgColor = 'bg-green-500';
                  else if (isSelected) bgColor = 'bg-red-400';
                }

                return (
                  <motion.button
                    key={`${questionIndex}-${letter.id}`}
                    initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ delay: index * 0.1 }}
                    whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
                    onClick={() => handleAnswer(letter.id)}
                    disabled={feedback !== null}
                    className={`
                      ${bgColor}
                      rounded-2xl p-6 min-h-32
                      flex flex-col items-center justify-center
                      shadow-lg transition-colors
                      disabled:cursor-not-allowed
                    `}
                  >
                    <Truck className="w-10 h-10 text-white/80 mb-2" />
                    <div className="flex items-center gap-2">
                      <span className="text-4xl font-bold text-white">
                        {letter.uppercase}
                      </span>
                      <span className="text-3xl text-white/70">
                        {letter.lowercase}
                      </span>
                    </div>
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
                    ? `Yes! That's ${currentQuestion.targetLetter.uppercase}!`
                    : `Oops! ${currentQuestion.targetLetter.uppercase} is for ${currentQuestion.targetLetter.exampleWord}`}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </GameWrapper>
  );
}

export default LetterFind;
