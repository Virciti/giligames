'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FashionScenarioId, OutfitCategory, OutfitJudgingResult } from '@/content/types';
import { getScenarioById } from '@/content/fashionScenarios';
import { judgeOutfit } from '@/content/fashionJudging';
import { CharacterSVG } from './character/CharacterSVG';

interface FashionShowProps {
  scenarioId: FashionScenarioId;
  equippedItems: Partial<Record<OutfitCategory, string>>;
  onComplete: (result: OutfitJudgingResult) => void;
}

type ShowPhase = 'curtains' | 'runway' | 'judging' | 'done';

export function FashionShow({ scenarioId, equippedItems, onComplete }: FashionShowProps) {
  const [phase, setPhase] = useState<ShowPhase>('curtains');
  const [result, setResult] = useState<OutfitJudgingResult | null>(null);
  const scenario = getScenarioById(scenarioId);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Use refs to avoid restarting timers when parent re-renders
  const equippedRef = useRef(equippedItems);
  equippedRef.current = equippedItems;
  const scenarioRef = useRef(scenario);
  scenarioRef.current = scenario;

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('runway'), 1500);
    const t2 = setTimeout(() => {
      const equippedAsRecord: Record<string, string | null> = {};
      for (const [cat, id] of Object.entries(equippedRef.current)) {
        equippedAsRecord[cat] = id ?? null;
      }
      const judgingResult = judgeOutfit(scenarioRef.current!, equippedAsRecord);
      setResult(judgingResult);
      setPhase('judging');
    }, 4000);
    const t3 = setTimeout(() => setPhase('done'), 7000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase === 'done' && result && !completedRef.current) {
      completedRef.current = true;
      onCompleteRef.current(result);
    }
  }, [phase, result]);

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-purple-900 via-purple-800 to-pink-900 flex flex-col items-center justify-center overflow-hidden">
      {/* Spotlights */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-48 h-96 bg-yellow-300/10 blur-3xl" />
        <div className="absolute top-0 right-1/4 w-48 h-96 bg-pink-300/10 blur-3xl" />
      </div>

      <AnimatePresence mode="wait">
        {/* Curtain phase */}
        {phase === 'curtains' && (
          <motion.div
            key="curtains"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <motion.h1
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-4xl font-bold text-white mb-4"
            >
              Fashion Show!
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-white/70 text-lg"
            >
              {scenario?.name}
            </motion.p>
          </motion.div>
        )}

        {/* Runway walk */}
        {phase === 'runway' && (
          <motion.div
            key="runway"
            className="flex flex-col items-center"
          >
            {/* Runway strip */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-full bg-gradient-to-t from-pink-500/20 to-transparent" />

            <motion.div
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
            >
              <CharacterSVG equippedItems={equippedItems} size="lg" />
            </motion.div>

            {/* Camera flash effect */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0, 1, 0, 1, 0] }}
              transition={{ duration: 2, delay: 0.5, times: [0, 0.1, 0.2, 0.4, 0.5, 0.7, 0.8] }}
              className="absolute inset-0 bg-white pointer-events-none"
              style={{ mixBlendMode: 'overlay' }}
            />
          </motion.div>
        )}

        {/* Judging phase */}
        {phase === 'judging' && result && (
          <motion.div
            key="judging"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center px-8"
          >
            <h2 className="text-2xl font-bold text-white mb-6">The Judges Say...</h2>

            <div className="space-y-3 max-w-sm mx-auto">
              {/* Completeness bar */}
              <div>
                <div className="flex justify-between text-white text-sm mb-1">
                  <span>Outfit Completeness</span>
                  <span>{result.completenessScore}/40</span>
                </div>
                <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(result.completenessScore / 40) * 100}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                    className="h-full bg-gradient-to-r from-pink-400 to-purple-400 rounded-full"
                  />
                </div>
              </div>

              {/* Style match bar */}
              <div>
                <div className="flex justify-between text-white text-sm mb-1">
                  <span>Style Match</span>
                  <span>{result.appropriatenessScore}/40</span>
                </div>
                <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(result.appropriatenessScore / 40) * 100}%` }}
                    transition={{ duration: 1, delay: 0.6 }}
                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full"
                  />
                </div>
              </div>

              {/* Bonus bar */}
              <div>
                <div className="flex justify-between text-white text-sm mb-1">
                  <span>Bonus</span>
                  <span>{result.bonusScore}/20</span>
                </div>
                <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(result.bonusScore / 20) * 100}%` }}
                    transition={{ duration: 1, delay: 0.9 }}
                    className="h-full bg-gradient-to-r from-green-400 to-teal-400 rounded-full"
                  />
                </div>
              </div>
            </div>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.5, type: 'spring' }}
              className="mt-6"
            >
              <p className="text-5xl font-bold text-white">{result.totalScore}</p>
              <p className="text-white/60">out of 100</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
