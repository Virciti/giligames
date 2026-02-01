'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Truck, Check } from 'lucide-react';
import { mathPrompts, formatPrompt, type MathPrompt } from '@/content/mathPrompts';
import { usePlayerStore } from '@/lib/stores/player-store';
import { GameWrapper } from '../GameWrapper';

interface MathMatchProps {
  onBack: () => void;
  difficulty?: number;
}

interface MatchItem {
  prompt: MathPrompt;
  matched: boolean;
}

function generateItems(count: number, tier: number): MatchItem[] {
  const filtered = mathPrompts.filter((p) => p.tier <= tier);
  const shuffled = [...filtered].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((prompt) => ({
    prompt,
    matched: false,
  }));
}

const TOTAL_ROUNDS = 3;
const ITEMS_PER_ROUND = 3;

const equationColors = ['bg-brand-green', 'bg-brand-blue', 'bg-brand-purple'];
const answerColors = ['bg-brand-orange', 'bg-brand-red', 'bg-brand-yellow'];

export function MathMatch({ onBack, difficulty = 1 }: MathMatchProps) {
  const shouldReduceMotion = useReducedMotion();
  const updateMastery = usePlayerStore((s) => s.updateMastery);

  const [items, setItems] = useState<MatchItem[]>([]);
  const [selectedEquation, setSelectedEquation] = useState<string | null>(null);
  const [roundIndex, setRoundIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong'; answer: number } | null>(null);

  const isComplete = roundIndex >= TOTAL_ROUNDS;
  const totalQuestions = TOTAL_ROUNDS * ITEMS_PER_ROUND;

  useEffect(() => {
    if (!isComplete) {
      setItems(generateItems(ITEMS_PER_ROUND, difficulty));
      setSelectedEquation(null);
    }
  }, [roundIndex, difficulty, isComplete]);

  // Check if round is complete
  useEffect(() => {
    if (items.length > 0 && items.every((item) => item.matched)) {
      const timer = setTimeout(() => {
        setRoundIndex((r) => r + 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [items]);

  const handleSelectEquation = (promptId: string) => {
    if (items.find((i) => i.prompt.id === promptId)?.matched) return;
    setSelectedEquation(promptId);
  };

  const handleSelectAnswer = useCallback((answer: number) => {
    if (!selectedEquation) return;

    const selectedItem = items.find((i) => i.prompt.id === selectedEquation);
    if (!selectedItem || selectedItem.matched) return;

    const isMatch = selectedItem.prompt.answer === answer;

    setFeedback({ type: isMatch ? 'correct' : 'wrong', answer });
    updateMastery(selectedItem.prompt.id, isMatch);

    if (isMatch) {
      setScore((s) => s + 10 * difficulty);
      setCorrectAnswers((c) => c + 1);
      setItems((prev) =>
        prev.map((item) =>
          item.prompt.id === selectedEquation ? { ...item, matched: true } : item
        )
      );
    }

    setSelectedEquation(null);
    setTimeout(() => setFeedback(null), 600);
  }, [selectedEquation, items, difficulty, updateMastery]);

  const handleRestart = () => {
    setRoundIndex(0);
    setScore(0);
    setCorrectAnswers(0);
    setSelectedEquation(null);
    setFeedback(null);
  };

  // Shuffle answers
  const shuffledAnswers = [...items].sort((a, b) => a.prompt.answer - b.prompt.answer);

  return (
    <GameWrapper
      title="Math Match"
      category="math"
      onBack={onBack}
      score={score}
      totalQuestions={totalQuestions}
      correctAnswers={correctAnswers}
      isComplete={isComplete}
      onRestart={handleRestart}
    >
      <div className="max-w-2xl mx-auto">
        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mb-6"
        >
          <p className="text-white text-xl font-bold mb-2">
            Match the equation to its answer!
          </p>
          <p className="text-white/70">
            Tap an equation, then tap the answer
          </p>
        </motion.div>

        {/* Progress */}
        <div className="text-center mb-6">
          <span className="text-white/60">
            Round {roundIndex + 1} of {TOTAL_ROUNDS}
          </span>
        </div>

        {/* Equations */}
        <div className="mb-4">
          <p className="text-white/60 text-sm mb-2 text-center">Equations</p>
          <div className="flex justify-center gap-3">
            {items.map((item, index) => (
              <motion.button
                key={`eq-${item.prompt.id}`}
                initial={shouldReduceMotion ? {} : { scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
                onClick={() => handleSelectEquation(item.prompt.id)}
                disabled={item.matched}
                className={`
                  px-4 py-3 rounded-2xl min-w-24
                  flex flex-col items-center justify-center
                  shadow-lg transition-all
                  ${item.matched
                    ? 'bg-green-500/30 border-2 border-green-500'
                    : selectedEquation === item.prompt.id
                      ? 'bg-white/40 border-2 border-white'
                      : `${equationColors[index]} hover:scale-105`}
                  disabled:cursor-not-allowed
                `}
              >
                {item.matched ? (
                  <Check className="w-8 h-8 text-green-500" />
                ) : (
                  <>
                    <Truck className="w-6 h-6 text-white/80 mb-1" />
                    <span className="text-lg font-bold text-white whitespace-nowrap">
                      {item.prompt.operand1} {item.prompt.operation === 'addition' ? '+' : '-'} {item.prompt.operand2}
                    </span>
                  </>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Connector */}
        <div className="flex justify-center my-4">
          <div className="text-white/50 text-2xl">=</div>
        </div>

        {/* Answers */}
        <div className="mb-6">
          <p className="text-white/60 text-sm mb-2 text-center">Answers</p>
          <div className="flex justify-center gap-3">
            {shuffledAnswers.map((item, index) => (
              <motion.button
                key={`ans-${item.prompt.id}`}
                initial={shouldReduceMotion ? {} : { scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 + 0.2 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
                onClick={() => handleSelectAnswer(item.prompt.answer)}
                disabled={item.matched || !selectedEquation}
                className={`
                  w-20 h-20 rounded-2xl
                  flex flex-col items-center justify-center
                  shadow-lg transition-all
                  ${item.matched
                    ? 'bg-green-500/30 border-2 border-green-500'
                    : !selectedEquation
                      ? 'bg-white/10 cursor-not-allowed'
                      : `${answerColors[index]} hover:scale-105`}
                  disabled:cursor-not-allowed
                `}
              >
                {item.matched ? (
                  <Check className="w-8 h-8 text-green-500" />
                ) : (
                  <>
                    <Truck className="w-6 h-6 text-white/80" />
                    <span className="text-2xl font-bold text-white">
                      {item.prompt.answer}
                    </span>
                  </>
                )}
              </motion.button>
            ))}
          </div>
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
                {feedback.type === 'correct' ? 'Match!' : 'Try again!'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </GameWrapper>
  );
}

export default MathMatch;
