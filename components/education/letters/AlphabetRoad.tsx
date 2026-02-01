'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Truck } from 'lucide-react';
import { letters } from '@/content/letters';
import { usePlayerStore } from '@/lib/stores/player-store';
import { GameWrapper } from '../GameWrapper';

interface AlphabetRoadProps {
  onBack: () => void;
  difficulty?: number;
}

interface MovingTruck {
  id: string;
  letter: typeof letters[0];
  x: number;
  speed: number;
  color: string;
}

const truckColors = ['bg-brand-red', 'bg-brand-blue', 'bg-brand-green', 'bg-brand-purple', 'bg-brand-orange'];
const TOTAL_LETTERS = 10; // Go through first 10 letters

export function AlphabetRoad({ onBack, difficulty = 1 }: AlphabetRoadProps) {
  const shouldReduceMotion = useReducedMotion();
  const updateMastery = usePlayerStore((s) => s.updateMastery);
  const animationRef = useRef<number | null>(null);

  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
  const [movingTrucks, setMovingTrucks] = useState<MovingTruck[]>([]);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong'; letter: string } | null>(null);

  const isComplete = currentLetterIndex >= TOTAL_LETTERS;

  // Generate trucks with letters
  const generateTrucks = useCallback(() => {
    const targetLetter = letters[currentLetterIndex];
    const trucks: MovingTruck[] = [];

    // Add target letter
    trucks.push({
      id: `truck-${Date.now()}-target`,
      letter: targetLetter,
      x: -100,
      speed: 2 + difficulty * 0.5,
      color: truckColors[0],
    });

    // Add some wrong letters
    const wrongLetters = letters
      .filter((l) => l.id !== targetLetter.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    wrongLetters.forEach((letter, i) => {
      trucks.push({
        id: `truck-${Date.now()}-${i}`,
        letter,
        x: -100 - (i + 1) * 150,
        speed: 2 + difficulty * 0.5 + (Math.random() - 0.5),
        color: truckColors[(i + 1) % truckColors.length],
      });
    });

    setMovingTrucks(trucks.sort(() => Math.random() - 0.5));
  }, [currentLetterIndex, difficulty]);

  // Start game
  const handleStart = () => {
    setGameStarted(true);
    generateTrucks();
  };

  // Animation loop
  useEffect(() => {
    if (!gameStarted || isComplete) return;

    const animate = () => {
      setMovingTrucks((prev) =>
        prev.map((truck) => ({
          ...truck,
          x: truck.x + truck.speed,
        })).filter((truck) => truck.x < window.innerWidth + 100)
      );
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameStarted, isComplete]);

  // Check if trucks are all gone
  useEffect(() => {
    if (gameStarted && movingTrucks.length === 0 && !isComplete) {
      // Regenerate trucks for current letter
      const timer = setTimeout(generateTrucks, 500);
      return () => clearTimeout(timer);
    }
  }, [movingTrucks.length, gameStarted, isComplete, generateTrucks]);

  const handleTapTruck = useCallback((truck: MovingTruck) => {
    const targetLetter = letters[currentLetterIndex];
    const isCorrect = truck.letter.id === targetLetter.id;

    setFeedback({ type: isCorrect ? 'correct' : 'wrong', letter: truck.letter.uppercase });
    updateMastery(truck.letter.id, isCorrect);

    if (isCorrect) {
      setScore((s) => s + 10 * difficulty);
      setCorrectAnswers((c) => c + 1);
      setCurrentLetterIndex((i) => i + 1);

      // Remove this truck
      setMovingTrucks((prev) => prev.filter((t) => t.id !== truck.id));
    }

    setTimeout(() => setFeedback(null), 800);
  }, [currentLetterIndex, difficulty, updateMastery]);

  const handleRestart = () => {
    setCurrentLetterIndex(0);
    setScore(0);
    setCorrectAnswers(0);
    setMovingTrucks([]);
    setGameStarted(false);
    setFeedback(null);
  };

  const targetLetter = letters[currentLetterIndex];

  return (
    <GameWrapper
      title="Alphabet Road"
      category="letters"
      onBack={onBack}
      score={score}
      totalQuestions={TOTAL_LETTERS}
      correctAnswers={correctAnswers}
      isComplete={isComplete}
      onRestart={handleRestart}
    >
      <div className="max-w-4xl mx-auto">
        {!gameStarted ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-white text-2xl mb-4">
              Tap the letters in ABC order!
            </p>
            <p className="text-white/70 mb-8">
              Start with A, then B, then C...
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleStart}
              className="bg-brand-green text-white text-2xl font-bold px-12 py-6 rounded-2xl shadow-lg"
            >
              Start!
            </motion.button>
          </motion.div>
        ) : (
          <>
            {/* Target Letter */}
            <motion.div
              key={currentLetterIndex}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center mb-6"
            >
              <p className="text-white/80 text-lg mb-2">Find the letter</p>
              <div className="bg-white/20 rounded-2xl p-4 inline-block">
                <span className="text-5xl font-bold text-white">
                  {targetLetter?.uppercase}
                </span>
              </div>
            </motion.div>

            {/* Road */}
            <div className="relative bg-gray-700/50 rounded-2xl h-40 overflow-hidden mb-6">
              {/* Road markings */}
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-4 border-dashed border-yellow-400/50" />
              </div>

              {/* Moving trucks */}
              <AnimatePresence>
                {movingTrucks.map((truck) => (
                  <motion.button
                    key={truck.id}
                    initial={{ x: truck.x }}
                    animate={{ x: truck.x }}
                    exit={{ scale: 0, opacity: 0 }}
                    onClick={() => handleTapTruck(truck)}
                    className={`
                      absolute top-1/2 -translate-y-1/2
                      ${truck.color}
                      w-24 h-20 rounded-xl
                      flex flex-col items-center justify-center
                      shadow-lg cursor-pointer
                      hover:scale-105 transition-transform
                    `}
                    style={{ left: truck.x }}
                  >
                    <Truck className="w-8 h-8 text-white/80" />
                    <span className="text-2xl font-bold text-white">
                      {truck.letter.uppercase}
                    </span>
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>

            {/* Progress */}
            <div className="flex justify-center gap-2 mb-4">
              {Array.from({ length: TOTAL_LETTERS }).map((_, i) => (
                <div
                  key={i}
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                    ${i < currentLetterIndex
                      ? 'bg-green-500 text-white'
                      : i === currentLetterIndex
                        ? 'bg-white text-gray-900'
                        : 'bg-white/20 text-white/50'}
                  `}
                >
                  {letters[i].uppercase}
                </div>
              ))}
            </div>

            {/* Feedback */}
            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`
                    text-center p-3 rounded-xl
                    ${feedback.type === 'correct' ? 'bg-green-500/30' : 'bg-red-400/30'}
                  `}
                >
                  <span className="text-xl font-bold text-white">
                    {feedback.type === 'correct'
                      ? `Yes! ${feedback.letter}!`
                      : `That's ${feedback.letter}, not ${targetLetter?.uppercase}`}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </GameWrapper>
  );
}

export default AlphabetRoad;
