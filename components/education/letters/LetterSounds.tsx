'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Truck, Volume2 } from 'lucide-react';
import { letters } from '@/content/letters';
import { usePlayerStore } from '@/lib/stores/player-store';
import { GameWrapper } from '../GameWrapper';

interface LetterSoundsProps {
  onBack: () => void;
  difficulty?: number;
}

interface Question {
  targetLetter: typeof letters[0];
  options: typeof letters[0][];
}

function generateQuestion(): Question {
  const targetLetter = letters[Math.floor(Math.random() * letters.length)];
  const options = new Set([targetLetter]);

  // Add wrong options
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

export function LetterSounds({ onBack, difficulty = 1 }: LetterSoundsProps) {
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
      setCurrentQuestion(generateQuestion());
      setFeedback(null);
      setSelectedLetter(null);
    }
  }, [questionIndex, isComplete]);

  const playSound = useCallback(() => {
    if (!currentQuestion) return;
    // In a real app, this would play the audio file
    // For now, we'll use speech synthesis as a fallback
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(currentQuestion.targetLetter.phoneme);
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  }, [currentQuestion]);

  // Auto-play sound on new question
  useEffect(() => {
    if (currentQuestion && !feedback) {
      const timer = setTimeout(playSound, 500);
      return () => clearTimeout(timer);
    }
  }, [currentQuestion, feedback, playSound]);

  const handleAnswer = useCallback((letterId: string) => {
    if (feedback !== null || !currentQuestion) return;

    setSelectedLetter(letterId);
    const isCorrect = letterId === currentQuestion.targetLetter.id;

    setFeedback(isCorrect ? 'correct' : 'wrong');
    updateMastery(`${currentQuestion.targetLetter.id}-sound`, isCorrect);

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
    setSelectedLetter(null);
  };

  return (
    <GameWrapper
      title="Letter Sounds"
      category="letters"
      onBack={onBack}
      score={score}
      totalQuestions={TOTAL_QUESTIONS}
      correctAnswers={correctAnswers}
      isComplete={isComplete}
      onRestart={handleRestart}
      onPlaySound={playSound}
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
            <p className="text-white/80 text-lg mb-4">
              Which letter makes this sound?
            </p>

            {/* Sound Display */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={playSound}
              className="bg-white/20 rounded-3xl p-8 inline-flex flex-col items-center gap-4 hover:bg-white/30 transition-colors"
            >
              <Volume2 className="w-16 h-16 text-white" />
              <span className="text-4xl font-bold text-white">
                &quot;{currentQuestion.targetLetter.phoneme}&quot;
              </span>
              <span className="text-white/60">Tap to hear again</span>
            </motion.button>
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
                    <span className="text-4xl font-bold text-white">
                      {letter.uppercase}
                    </span>
                    <span className="text-lg text-white/60">
                      {letter.lowercase}
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
                    ? `Yes! ${currentQuestion.targetLetter.uppercase} says "${currentQuestion.targetLetter.phoneme}"!`
                    : `The answer is ${currentQuestion.targetLetter.uppercase}!`}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </GameWrapper>
  );
}

export default LetterSounds;
