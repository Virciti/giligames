'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FashionScenarioId, FashionChallengeType } from '@/content/types';
import { getChallengesForScenarioTier, calculateFashionPoints } from '@/content/fashionChallenges';
import { getScenarioById } from '@/content/fashionScenarios';
import { usePlayerStore } from '@/lib/stores/player-store';
import { MathSparkle } from './challenges/MathSparkle';
import { WordRunway } from './challenges/WordRunway';
import { PatternDesigner } from './challenges/PatternDesigner';
import { ColorMixStudio } from './challenges/ColorMixStudio';
import { CountingCloset } from './challenges/CountingCloset';
import { LetterStitch } from './challenges/LetterStitch';

interface ChallengeArenaProps {
  scenarioId: FashionScenarioId;
  currentTier: number;
  onEarnPoints: (points: number) => void;
  onGoShopping: () => void;
  onSetTier: (tier: number) => void;
}

export function ChallengeArena({
  scenarioId,
  currentTier,
  onEarnPoints,
  onGoShopping,
  onSetTier,
}: ChallengeArenaProps) {
  const scenario = getScenarioById(scenarioId);
  const [selectedChallenge, setSelectedChallenge] = useState<FashionChallengeType | null>(null);
  const [roundPoints, setRoundPoints] = useState(0);
  const [roundComplete, setRoundComplete] = useState(false);
  const updateMastery = usePlayerStore((s) => s.updateMastery);

  const scenarioTier = scenario?.tier ?? 1;
  const availableChallenges = useMemo(
    () => getChallengesForScenarioTier(scenarioTier),
    [scenarioTier]
  );

  const handleAnswer = useCallback(
    (correct: boolean, itemId: string, challengeType: FashionChallengeType) => {
      updateMastery(itemId, correct);
      if (correct) {
        const challenge = availableChallenges.find((c) => c.type === challengeType);
        if (challenge) {
          const points = calculateFashionPoints(challenge, currentTier, 0);
          setRoundPoints((prev) => prev + points);
          onEarnPoints(points);
        }
      }
    },
    [availableChallenges, currentTier, onEarnPoints, updateMastery]
  );

  // Stable onAnswer that captures selectedChallenge via ref-like pattern
  const handleChallengeAnswer = useCallback(
    (correct: boolean, itemId: string) => {
      if (selectedChallenge) {
        handleAnswer(correct, itemId, selectedChallenge);
      }
    },
    [handleAnswer, selectedChallenge]
  );

  const handleRoundComplete = useCallback(() => {
    setRoundComplete(true);
  }, []);

  const handleBackToSelect = useCallback(() => {
    setSelectedChallenge(null);
    setRoundPoints(0);
    setRoundComplete(false);
  }, []);

  // Challenge type picker
  if (!selectedChallenge) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Earn Fashion Points!</h2>
          <p className="text-white/70">Pick a challenge to earn points for your outfit</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {availableChallenges.map((challenge, index) => (
            <motion.button
              key={challenge.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedChallenge(challenge.type)}
              className="rounded-2xl p-5 text-left hover:scale-105 transition-transform shadow-lg min-h-[120px] flex flex-col justify-between"
              style={{
                background: `linear-gradient(135deg, ${challenge.gradient[0]}, ${challenge.gradient[1]})`,
              }}
            >
              <span className="text-3xl mb-2 block">{challenge.icon}</span>
              <div>
                <h3 className="font-bold text-white">{challenge.displayName}</h3>
                <p className="text-white/80 text-xs mt-1">{challenge.description}</p>
              </div>
            </motion.button>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={onGoShopping}
            className="bg-white/20 text-white font-bold py-3 px-8 rounded-xl hover:bg-white/30 transition-colors"
          >
            Go Shopping Instead
          </button>
        </div>
      </div>
    );
  }

  // Round complete summary
  if (roundComplete) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <h2 className="text-3xl font-bold text-white mb-4">Round Complete!</h2>
          <div className="bg-white/20 rounded-2xl p-6 mb-8">
            <p className="text-white text-lg">
              You earned <span className="font-bold text-yellow-300">{roundPoints}</span> fashion points!
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={onGoShopping}
              className="bg-white text-purple-600 font-bold py-3 px-6 rounded-xl hover:bg-white/90 transition-colors"
            >
              Go Shopping!
            </button>
            <button
              onClick={handleBackToSelect}
              className="bg-white/20 text-white font-bold py-3 px-6 rounded-xl hover:bg-white/30 transition-colors"
            >
              Do Another Round!
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Active challenge - using stable callback references
  const challengeProps = {
    tier: currentTier,
    onAnswer: handleChallengeAnswer,
    onComplete: handleRoundComplete,
    onBack: handleBackToSelect,
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={selectedChallenge}
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -30 }}
        className="h-full"
      >
        {selectedChallenge === 'math-sparkle' && <MathSparkle {...challengeProps} />}
        {selectedChallenge === 'word-runway' && <WordRunway {...challengeProps} />}
        {selectedChallenge === 'pattern-match' && <PatternDesigner {...challengeProps} />}
        {selectedChallenge === 'color-mix' && <ColorMixStudio {...challengeProps} />}
        {selectedChallenge === 'counting-closet' && <CountingCloset {...challengeProps} />}
        {selectedChallenge === 'letter-stitch' && <LetterStitch {...challengeProps} />}
      </motion.div>
    </AnimatePresence>
  );
}
