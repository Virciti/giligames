'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Truck, Volume2 } from 'lucide-react';
import { sightWords, getWordsByTier } from '@/content/sightWords';
import { usePlayerStore } from '@/lib/stores/player-store';
import { GameWrapper } from '../GameWrapper';

interface SightWordsProps {
  onBack: () => void;
  difficulty?: number;
}

interface Question {
  targetWord: typeof sightWords[0];
  options: typeof sightWords[0][];
}

function generateQuestion(tier: number): Question {
  const wordsInTier = getWordsByTier(tier);
  const targetWord = wordsInTier[Math.floor(Math.random() * wordsInTier.length)];

  const options = new Set([targetWord]);

  // Add words from same and nearby tiers
  const allWords = [...getWordsByTier(tier), ...getWordsByTier(Math.max(1, tier - 1))];
  while (options.size < 4) {
    const randomWord = allWords[Math.floor(Math.random() * allWords.length)];
    options.add(randomWord);
  }

  return {
    targetWord,
    options: Array.from(options).sort(() => Math.random() - 0.5),
  };
}

const TOTAL_QUESTIONS = 5;
const truckColors = ['bg-brand-purple', 'bg-brand-blue', 'bg-brand-green', 'bg-brand-orange'];

export function SightWords({ onBack, difficulty = 1 }: SightWordsProps) {
  const shouldReduceMotion = useReducedMotion();
  const updateMastery = usePlayerStore((s) => s.updateMastery);

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [tier, setTier] = useState(difficulty);

  const isComplete = questionIndex >= TOTAL_QUESTIONS;

  useEffect(() => {
    if (!isComplete) {
      setCurrentQuestion(generateQuestion(tier));
      setFeedback(null);
      setSelectedWord(null);
    }
  }, [questionIndex, tier, isComplete]);

  const playSound = useCallback(() => {
    if (!currentQuestion) return;
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(currentQuestion.targetWord.word);
      utterance.rate = 0.7;
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

  const handleAnswer = useCallback((wordId: string) => {
    if (feedback !== null || !currentQuestion) return;

    setSelectedWord(wordId);
    const isCorrect = wordId === currentQuestion.targetWord.id;

    setFeedback(isCorrect ? 'correct' : 'wrong');
    updateMastery(currentQuestion.targetWord.id, isCorrect);

    if (isCorrect) {
      setScore((s) => s + 10 * tier);
      setCorrectAnswers((c) => c + 1);
    }

    setTimeout(() => {
      setQuestionIndex((i) => i + 1);
    }, 1200);
  }, [feedback, currentQuestion, tier, updateMastery]);

  const handleRestart = () => {
    setQuestionIndex(0);
    setScore(0);
    setCorrectAnswers(0);
    setFeedback(null);
    setSelectedWord(null);
    setTier(difficulty);
  };

  return (
    <GameWrapper
      title="Sight Words"
      category="words"
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
              Find the word
            </p>

            {/* Word Display with Sound */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={playSound}
              className="bg-white/20 rounded-3xl p-8 inline-flex flex-col items-center gap-4 hover:bg-white/30 transition-colors"
            >
              <span className="text-6xl font-bold text-white uppercase">
                {currentQuestion.targetWord.word}
              </span>
              <div className="flex items-center gap-2 text-white/60">
                <Volume2 className="w-5 h-5" />
                <span>Tap to hear</span>
              </div>
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
              {currentQuestion.options.map((word, index) => {
                const isSelected = selectedWord === word.id;
                const isCorrect = word.id === currentQuestion.targetWord.id;
                const showResult = feedback !== null;

                let bgColor = truckColors[index];
                if (showResult) {
                  if (isCorrect) bgColor = 'bg-green-500';
                  else if (isSelected) bgColor = 'bg-red-400';
                }

                return (
                  <motion.button
                    key={`${questionIndex}-${word.id}`}
                    initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ delay: index * 0.1 }}
                    whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
                    onClick={() => handleAnswer(word.id)}
                    disabled={feedback !== null}
                    className={`
                      ${bgColor}
                      rounded-2xl p-6 min-h-28
                      flex flex-col items-center justify-center
                      shadow-lg transition-colors
                      disabled:cursor-not-allowed
                    `}
                  >
                    <Truck className="w-8 h-8 text-white/80 mb-2" />
                    <span className="text-3xl font-bold text-white uppercase">
                      {word.word}
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
                    ? `Yes! That says "${currentQuestion.targetWord.word}"!`
                    : `The word is "${currentQuestion.targetWord.word}"`}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </GameWrapper>
  );
}

export default SightWords;
