'use client';

import { useState, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import type {
  FashionPhase,
  FashionScenarioId,
  FashionChallengeType,
  OutfitCategory,
  OutfitJudgingResult,
} from '@/content/types';
import { usePlayerStore } from '@/lib/stores/player-store';
import { useGameStore } from '@/lib/stores/game-store';
import { ScenarioSelect } from './ScenarioSelect';

// Lazy-load heavy phase components - only ScenarioSelect loads immediately
const ChallengeArena = lazy(() => import('./ChallengeArena').then((m) => ({ default: m.ChallengeArena })));
const OutfitShop = lazy(() => import('./OutfitShop').then((m) => ({ default: m.OutfitShop })));
const DressingRoom = lazy(() => import('./DressingRoom').then((m) => ({ default: m.DressingRoom })));
const FashionShow = lazy(() => import('./FashionShow').then((m) => ({ default: m.FashionShow })));

function PhaseLoading() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
    </div>
  );
}

export interface FashionSessionState {
  phase: FashionPhase;
  scenarioId: FashionScenarioId | null;
  fashionPoints: number;
  pointsEarned: number;
  equippedItems: Partial<Record<OutfitCategory, string>>;
  purchasedItems: string[];
  challengeType: FashionChallengeType | null;
  challengeTier: number;
  judgingResult: OutfitJudgingResult | null;
}

const initialSession: FashionSessionState = {
  phase: 'scenario-select',
  scenarioId: null,
  fashionPoints: 0,
  pointsEarned: 0,
  equippedItems: {},
  purchasedItems: [],
  challengeType: null,
  challengeTier: 1,
  judgingResult: null,
};

interface FashionDesignGameProps {
  onExit: () => void;
}

export function FashionDesignGame({ onExit }: FashionDesignGameProps) {
  const [session, setSession] = useState<FashionSessionState>(initialSession);
  const addStars = usePlayerStore((s) => s.addStars);
  const completeLevel = usePlayerStore((s) => s.completeLevel);
  const startGame = useGameStore((s) => s.startGame);
  const endGame = useGameStore((s) => s.endGame);

  const setPhase = useCallback((phase: FashionPhase) => {
    setSession((prev) => ({ ...prev, phase }));
  }, []);

  const handleSelectScenario = useCallback((scenarioId: FashionScenarioId) => {
    startGame('fashion', `fashion-${scenarioId}`);
    setSession((prev) => ({
      ...prev,
      scenarioId,
      phase: 'challenge',
      fashionPoints: 0,
      pointsEarned: 0,
      equippedItems: {},
      purchasedItems: [],
      judgingResult: null,
    }));
  }, [startGame]);

  const handleEarnPoints = useCallback((points: number) => {
    setSession((prev) => ({
      ...prev,
      fashionPoints: prev.fashionPoints + points,
      pointsEarned: prev.pointsEarned + points,
    }));
  }, []);

  const handlePurchaseItem = useCallback((itemId: string, cost: number) => {
    setSession((prev) => ({
      ...prev,
      fashionPoints: prev.fashionPoints - cost,
      purchasedItems: [...prev.purchasedItems, itemId],
    }));
  }, []);

  const handleEquipItem = useCallback((category: OutfitCategory, itemId: string | null) => {
    setSession((prev) => {
      const newEquipped = { ...prev.equippedItems };
      if (itemId === null) {
        delete newEquipped[category];
      } else {
        newEquipped[category] = itemId;
        // Dress replaces top+bottom
        if (category === 'dress') {
          delete newEquipped.top;
          delete newEquipped.bottom;
        }
        // Top or bottom replaces dress
        if (category === 'top' || category === 'bottom') {
          delete newEquipped.dress;
        }
      }
      return { ...prev, equippedItems: newEquipped };
    });
  }, []);

  const handleFashionShowComplete = useCallback((result: OutfitJudgingResult) => {
    setSession((prev) => {
      if (prev.scenarioId && result.stars > 0) {
        addStars(result.stars);
        completeLevel(`fashion-${prev.scenarioId}`, result.stars, result.totalScore);
      }
      return { ...prev, judgingResult: result, phase: 'results' as const };
    });
    endGame();
  }, [addStars, completeLevel, endGame]);

  const handlePlayAgain = useCallback(() => {
    if (session.scenarioId) {
      handleSelectScenario(session.scenarioId);
    }
  }, [session.scenarioId, handleSelectScenario]);

  const handleNewScenario = useCallback(() => {
    setSession(initialSession);
  }, []);

  const handleBack = useCallback(() => {
    switch (session.phase) {
      case 'challenge':
        setPhase('scenario-select');
        endGame();
        break;
      case 'shop':
        setPhase('challenge');
        break;
      case 'dressing-room':
        setPhase('shop');
        break;
      case 'fashion-show':
        setPhase('dressing-room');
        break;
      case 'results':
        handleNewScenario();
        break;
      default:
        onExit();
    }
  }, [session.phase, setPhase, endGame, handleNewScenario, onExit]);

  // Stable callbacks for child components (avoid inline arrows in render)
  const handleGoShopping = useCallback(() => setPhase('shop'), [setPhase]);
  const handleSetTier = useCallback(
    (tier: number) => setSession((prev) => ({ ...prev, challengeTier: tier })),
    []
  );
  const handleGoToDressing = useCallback(() => setPhase('dressing-room'), [setPhase]);
  const handleEarnMore = useCallback(() => setPhase('challenge'), [setPhase]);
  const handleStartShow = useCallback(() => setPhase('fashion-show'), [setPhase]);
  const handleBackToShop = useCallback(() => setPhase('shop'), [setPhase]);

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-pink-400 via-purple-400 to-brand-purple overflow-hidden flex flex-col">
      {/* Header */}
      {session.phase !== 'fashion-show' && (
        <header className="flex items-center justify-between p-4 z-10">
          <button
            onClick={session.phase === 'scenario-select' ? onExit : handleBack}
            className="flex items-center gap-2 text-white/90 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
            <span className="font-medium">
              {session.phase === 'scenario-select' ? 'Home' : 'Back'}
            </span>
          </button>

          <h1 className="text-xl font-bold text-white">Fashion Studio</h1>

          {session.scenarioId && session.phase !== 'scenario-select' ? (
            <div className="bg-white/20 rounded-full px-4 py-1 flex items-center gap-1">
              <span className="text-white font-bold">{session.fashionPoints}</span>
              <span className="text-white/70 text-sm">FP</span>
            </div>
          ) : (
            <div className="w-20" />
          )}
        </header>
      )}

      {/* Content */}
      <main className="flex-1 overflow-auto">
        <Suspense fallback={<PhaseLoading />}>
          <AnimatePresence mode="wait">
            {session.phase === 'scenario-select' && (
              <motion.div
                key="scenario-select"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="h-full"
              >
                <ScenarioSelect onSelect={handleSelectScenario} />
              </motion.div>
            )}

            {session.phase === 'challenge' && session.scenarioId && (
              <motion.div
                key="challenge"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="h-full"
              >
                <ChallengeArena
                  scenarioId={session.scenarioId}
                  currentTier={session.challengeTier}
                  onEarnPoints={handleEarnPoints}
                  onGoShopping={handleGoShopping}
                  onSetTier={handleSetTier}
                />
              </motion.div>
            )}

            {session.phase === 'shop' && session.scenarioId && (
              <motion.div
                key="shop"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="h-full"
              >
                <OutfitShop
                  scenarioId={session.scenarioId}
                  fashionPoints={session.fashionPoints}
                  purchasedItems={session.purchasedItems}
                  equippedItems={session.equippedItems}
                  onPurchase={handlePurchaseItem}
                  onEquip={handleEquipItem}
                  onGoToDressing={handleGoToDressing}
                  onEarnMore={handleEarnMore}
                />
              </motion.div>
            )}

            {session.phase === 'dressing-room' && session.scenarioId && (
              <motion.div
                key="dressing-room"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="h-full"
              >
                <DressingRoom
                  scenarioId={session.scenarioId}
                  purchasedItems={session.purchasedItems}
                  equippedItems={session.equippedItems}
                  onEquip={handleEquipItem}
                  onStartShow={handleStartShow}
                  onBackToShop={handleBackToShop}
                />
              </motion.div>
            )}

            {session.phase === 'fashion-show' && session.scenarioId && (
              <motion.div
                key="fashion-show"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full"
              >
                <FashionShow
                  scenarioId={session.scenarioId}
                  equippedItems={session.equippedItems}
                  onComplete={handleFashionShowComplete}
                />
              </motion.div>
            )}

          {session.phase === 'results' && session.judgingResult && (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex items-center justify-center"
            >
              <div className="max-w-md mx-auto text-center px-4 py-8">
                <h2 className="text-3xl font-bold text-white mb-4">
                  {session.judgingResult.stars >= 3
                    ? 'Amazing!'
                    : session.judgingResult.stars >= 2
                      ? 'Great Job!'
                      : session.judgingResult.stars >= 1
                        ? 'Good Try!'
                        : 'Keep Styling!'}
                </h2>

                <div className="flex justify-center gap-2 mb-6">
                  {[1, 2, 3].map((i) => (
                    <motion.span
                      key={i}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: i * 0.3, type: 'spring' }}
                      className={`text-4xl ${i <= (session.judgingResult?.stars ?? 0) ? '' : 'opacity-30'}`}
                    >
                      ⭐
                    </motion.span>
                  ))}
                </div>

                <div className="bg-white/20 rounded-2xl p-6 mb-8 text-left space-y-2">
                  <p className="text-white">
                    Outfit Score: <span className="font-bold">{session.judgingResult.totalScore}/100</span>
                  </p>
                  <p className="text-white/80 text-sm">
                    Completeness: {session.judgingResult.completenessScore}
                  </p>
                  <p className="text-white/80 text-sm">
                    Style Match: {session.judgingResult.appropriatenessScore}
                  </p>
                  <p className="text-white/80 text-sm">
                    Bonus: {session.judgingResult.bonusScore}
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={handlePlayAgain}
                    className="bg-white text-purple-600 font-bold py-3 px-6 rounded-xl hover:bg-white/90 transition-colors"
                  >
                    Play Again
                  </button>
                  <button
                    onClick={handleNewScenario}
                    className="bg-white/20 text-white font-bold py-3 px-6 rounded-xl hover:bg-white/30 transition-colors"
                  >
                    New Scenario
                  </button>
                  <button
                    onClick={onExit}
                    className="text-white/70 hover:text-white transition-colors py-2"
                  >
                    Back to Home
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </Suspense>
      </main>
    </div>
  );
}
