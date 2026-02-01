'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Play, Lock, Trophy, ArrowLeft, X } from 'lucide-react';
import { RaceCanvas } from './RaceCanvas';
import { RaceControls } from './RaceControls';
import { RaceHUD } from './RaceHUD';
import { TrophyCeremony } from './TrophyCeremony';
import { BigButton } from '@/components/ui/BigButton';
import { Modal } from '@/components/ui/Modal';
import { StarRating } from '@/components/ui/StarRating';
import { usePlayerStore, useGameStore } from '@/lib/stores';
import { raceLevels, getLevelById, isLevelUnlocked } from '@/content/levels';
import type { RaceLevel } from '@/content/types';
import type { InputState } from '@/lib/game/types';

// ============================================================
// Types
// ============================================================

type GamePhase = 'track-select' | 'racing' | 'paused' | 'finished';

interface RaceGameProps {
  initialLevelId?: string;
}

interface RaceResult {
  position: 1 | 2 | 3;
  lapTimes: number[];
  levelId: string;
}

// ============================================================
// Track Selection Card
// ============================================================

function TrackCard({
  level,
  isUnlocked,
  stars,
  onSelect,
}: {
  level: RaceLevel;
  isUnlocked: boolean;
  stars: number;
  onSelect: () => void;
}) {
  const trackTypeIcons: Record<string, string> = {
    oval: 'O',
    figure8: '8',
    winding: 'S',
    stadium: 'M',
  };

  return (
    <motion.button
      whileHover={isUnlocked ? { scale: 1.02 } : undefined}
      whileTap={isUnlocked ? { scale: 0.98 } : undefined}
      onClick={isUnlocked ? onSelect : undefined}
      disabled={!isUnlocked}
      className={`
        relative w-full p-4 rounded-2xl shadow-lg text-left transition-colors
        ${isUnlocked
          ? 'bg-white hover:bg-brand-blue/5 cursor-pointer'
          : 'bg-gray-100 cursor-not-allowed'}
      `}
    >
      {/* Track preview */}
      <div
        className={`
          w-full aspect-video rounded-xl mb-3 flex items-center justify-center text-6xl font-bold
          ${isUnlocked
            ? 'bg-gradient-to-br from-brand-green/20 to-brand-blue/20 text-brand-green'
            : 'bg-gray-200 text-gray-400'}
        `}
      >
        {isUnlocked ? trackTypeIcons[level.config.trackType] : <Lock className="w-12 h-12" />}
      </div>

      {/* Track info */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className={`text-lg font-bold ${isUnlocked ? 'text-gray-800' : 'text-gray-400'}`}>
            {level.name}
          </h3>
          <p className={`text-sm ${isUnlocked ? 'text-gray-600' : 'text-gray-400'}`}>
            {level.config.laps} {level.config.laps === 1 ? 'lap' : 'laps'} • {level.config.aiCount + 1} racers
          </p>
        </div>

        {/* Stars or unlock requirement */}
        {isUnlocked ? (
          <StarRating stars={stars} size="sm" animated={false} />
        ) : (
          <div className="flex items-center gap-1 text-sm text-gray-400">
            <Trophy className="w-4 h-4" />
            <span>{level.unlockStars}</span>
          </div>
        )}
      </div>

      {/* Tier indicator */}
      <div className="absolute top-2 right-2">
        <div
          className={`
            px-2 py-1 rounded-full text-xs font-bold
            ${isUnlocked ? 'bg-brand-yellow text-gray-800' : 'bg-gray-300 text-gray-500'}
          `}
        >
          Tier {level.tier}
        </div>
      </div>
    </motion.button>
  );
}

// ============================================================
// Track Selection View
// ============================================================

function TrackSelection({
  onSelectTrack,
  onBack,
}: {
  onSelectTrack: (levelId: string) => void;
  onBack: () => void;
}) {
  const totalStars = usePlayerStore((state) => state.totalStars);
  const completedLevels = usePlayerStore((state) => state.completedLevels);

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-blue to-brand-purple p-4 pb-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </motion.button>
        <div>
          <h1 className="text-3xl font-bold text-white">Choose Your Track</h1>
          <p className="text-white/80">
            You have {totalStars} stars
          </p>
        </div>
      </div>

      {/* Track grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
        {raceLevels.map((level) => {
          const levelUnlocked = isLevelUnlocked(level, totalStars);
          const completion = completedLevels[level.id];
          const stars = completion?.stars ?? 0;

          return (
            <TrackCard
              key={level.id}
              level={level}
              isUnlocked={levelUnlocked}
              stars={stars}
              onSelect={() => onSelectTrack(level.id)}
            />
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Pause Modal
// ============================================================

function PauseModal({
  isOpen,
  onResume,
  onRestart,
  onQuit,
  levelName,
}: {
  isOpen: boolean;
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
  levelName: string;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onResume} title="Paused">
      <div className="flex flex-col items-center gap-4">
        <p className="text-gray-600 text-center mb-2">
          Racing on {levelName}
        </p>

        <BigButton color="green" size="lg" onClick={onResume} className="w-full">
          <Play className="w-6 h-6 mr-2" />
          Resume
        </BigButton>

        <BigButton color="orange" size="lg" onClick={onRestart} className="w-full">
          Restart Race
        </BigButton>

        <BigButton color="red" size="lg" onClick={onQuit} className="w-full">
          <X className="w-6 h-6 mr-2" />
          Quit to Track Select
        </BigButton>
      </div>
    </Modal>
  );
}

// ============================================================
// Main Component
// ============================================================

export function RaceGame({ initialLevelId }: RaceGameProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<GamePhase>(
    initialLevelId ? 'racing' : 'track-select'
  );
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(
    initialLevelId ?? null
  );
  const [raceResult, setRaceResult] = useState<RaceResult | null>(null);
  const [inputState, setInputState] = useState<InputState>({
    left: false,
    right: false,
    up: false,
    down: false,
    jump: false,
    pause: false,
    touches: [],
  });

  // HUD state - updated from canvas callbacks
  const [hudState] = useState({
    position: 1,
    lap: 1,
    speed: 0,
    playerPosition: { x: 0, y: 0 },
    aiPositions: [] as Array<{ x: number; y: number }>,
  });

  const { pauseGame, resumeGame, startGame, endGame } = useGameStore();
  const { completeLevel } = usePlayerStore();

  // Get current level
  const currentLevel = useMemo(
    () => (selectedLevelId ? (getLevelById(selectedLevelId) as RaceLevel) : null),
    [selectedLevelId]
  );

  // Handle track selection
  const handleSelectTrack = useCallback((levelId: string) => {
    setSelectedLevelId(levelId);
    setPhase('racing');
    startGame('race', levelId);
  }, [startGame]);

  // Handle back to main
  const handleBack = useCallback(() => {
    router.push('/');
  }, [router]);

  // Handle pause
  const handlePause = useCallback(() => {
    setPhase('paused');
    pauseGame();
  }, [pauseGame]);

  // Handle resume
  const handleResume = useCallback(() => {
    setPhase('racing');
    resumeGame();
  }, [resumeGame]);

  // Handle restart
  const handleRestart = useCallback(() => {
    setPhase('racing');
    resumeGame();
    // The RaceCanvas will reinitialize when the key changes
    setSelectedLevelId((prev) => prev);
  }, [resumeGame]);

  // Handle quit
  const handleQuit = useCallback(() => {
    endGame();
    setPhase('track-select');
    setSelectedLevelId(null);
    setRaceResult(null);
  }, [endGame]);

  // Handle race complete
  const handleRaceComplete = useCallback(
    (position: number, lapTimes: number[]) => {
      if (!selectedLevelId) return;

      // Calculate stars based on position
      const stars = position === 1 ? 3 : position === 2 ? 2 : position === 3 ? 1 : 0;

      // Save result
      if (stars > 0) {
        completeLevel(selectedLevelId, stars, Math.round(lapTimes.reduce((a, b) => a + b, 0) * 1000));
      }

      // Set result for trophy ceremony
      setRaceResult({
        position: position as 1 | 2 | 3,
        lapTimes,
        levelId: selectedLevelId,
      });

      setPhase('finished');
      endGame();
    },
    [selectedLevelId, completeLevel, endGame]
  );

  // Handle input changes from controls
  const handleInputChange = useCallback((input: Partial<InputState>) => {
    setInputState((prev) => ({ ...prev, ...input }));
  }, []);

  // Handle race again
  const handleRaceAgain = useCallback(() => {
    if (!selectedLevelId) return;
    setRaceResult(null);
    setPhase('racing');
    startGame('race', selectedLevelId);
  }, [selectedLevelId, startGame]);

  // Handle continue from trophy
  const handleContinue = useCallback(() => {
    setPhase('track-select');
    setRaceResult(null);
  }, []);

  // Handle back to garage from trophy
  const handleBackToGarage = useCallback(() => {
    router.push('/');
  }, [router]);

  // Keyboard pause handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && phase === 'racing') {
        handlePause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, handlePause]);

  return (
    <div className="fixed inset-0 bg-gray-900">
      <AnimatePresence mode="wait">
        {/* Track Selection */}
        {phase === 'track-select' && (
          <motion.div
            key="track-select"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <TrackSelection onSelectTrack={handleSelectTrack} onBack={handleBack} />
          </motion.div>
        )}

        {/* Racing */}
        {(phase === 'racing' || phase === 'paused') && currentLevel && (
          <motion.div
            key="racing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative w-full h-full"
          >
            {/* Canvas */}
            <RaceCanvas
              key={selectedLevelId}
              levelId={selectedLevelId!}
              onComplete={handleRaceComplete}
              inputState={inputState}
            />

            {/* HUD */}
            <RaceHUD
              position={hudState.position}
              totalRacers={currentLevel.config.aiCount + 1}
              currentLap={hudState.lap}
              totalLaps={currentLevel.config.laps}
              speed={hudState.speed}
              showMinimap={true}
              level={currentLevel}
              playerPosition={hudState.playerPosition}
              aiPositions={hudState.aiPositions}
            />

            {/* Controls */}
            <RaceControls
              onInputChange={handleInputChange}
              onPause={handlePause}
            />

            {/* Pause Modal */}
            <PauseModal
              isOpen={phase === 'paused'}
              onResume={handleResume}
              onRestart={handleRestart}
              onQuit={handleQuit}
              levelName={currentLevel.name}
            />
          </motion.div>
        )}

        {/* Trophy Ceremony */}
        {phase === 'finished' && raceResult && currentLevel && (
          <motion.div
            key="finished"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <TrophyCeremony
              position={raceResult.position}
              onContinue={handleContinue}
              onRaceAgain={handleRaceAgain}
              onBackToGarage={handleBackToGarage}
              levelName={currentLevel.name}
              lapTimes={raceResult.lapTimes}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default RaceGame;
