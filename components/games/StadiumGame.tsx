'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, Home, Star, Lock, Trophy } from 'lucide-react';
import { StadiumCanvas } from './StadiumCanvas';
import { StadiumControls } from './StadiumControls';
import { StadiumHUD, type ChallengeObjective } from './StadiumHUD';
import { BigButton, Modal, CelebrationOverlay } from '@/components/ui';
import { useGameStore, usePlayerStore } from '@/lib/stores';
import { stadiumLevels, getLevelById, isLevelUnlocked } from '@/content/levels';
import type { StadiumLevel } from '@/content/types';

// ============================================================
// Types
// ============================================================

export interface StadiumGameProps {
  initialLevelId?: string;
  onExit?: () => void;
}

type GameState = 'level-select' | 'playing' | 'paused' | 'game-over' | 'victory';

// ============================================================
// Level Card Component
// ============================================================

interface LevelCardProps {
  level: StadiumLevel;
  isUnlocked: boolean;
  bestStars: number;
  onSelect: (levelId: string) => void;
}

function LevelCard({ level, isUnlocked, bestStars, onSelect }: LevelCardProps) {
  return (
    <motion.button
      className={`
        relative w-full p-6 rounded-2xl
        text-left transition-colors
        ${
          isUnlocked
            ? 'bg-brand-green hover:bg-brand-green/90 cursor-pointer'
            : 'bg-white/20 cursor-not-allowed'
        }
      `}
      onClick={() => isUnlocked && onSelect(level.id)}
      whileHover={isUnlocked ? { scale: 1.02 } : {}}
      whileTap={isUnlocked ? { scale: 0.98 } : {}}
      disabled={!isUnlocked}
    >
      {!isUnlocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-2xl">
          <Lock className="w-8 h-8 text-white/70" />
        </div>
      )}

      <h3 className="text-xl font-bold text-white mb-2">{level.name}</h3>

      {/* Star rating */}
      <div className="flex gap-1 mb-2">
        {[1, 2, 3].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= bestStars
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-white/30'
            }`}
          />
        ))}
      </div>

      {!isUnlocked && (
        <p className="text-white/70 text-sm">
          {level.unlockStars} stars to unlock
        </p>
      )}

      {isUnlocked && (
        <p className="text-white/80 text-sm">
          {level.config.starPositions.length} stars to collect
        </p>
      )}
    </motion.button>
  );
}

// ============================================================
// Level Select Screen
// ============================================================

interface LevelSelectProps {
  onSelectLevel: (levelId: string) => void;
  onExit: () => void;
  totalStars: number;
  completedLevels: Record<string, { stars: number; bestScore: number }>;
}

function LevelSelect({
  onSelectLevel,
  onExit,
  totalStars,
  completedLevels,
}: LevelSelectProps) {
  return (
    <motion.div
      className="w-full max-w-4xl mx-auto p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white drop-shadow-lg mb-2">
          Stadium Freestyle
        </h1>
        <p className="text-xl text-white/90 drop-shadow">
          Choose your arena!
        </p>
        <div className="flex items-center justify-center gap-2 mt-4">
          <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
          <span className="text-2xl font-bold text-white">{totalStars}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {stadiumLevels.map((level) => (
          <LevelCard
            key={level.id}
            level={level}
            isUnlocked={isLevelUnlocked(level, totalStars)}
            bestStars={completedLevels[level.id]?.stars ?? 0}
            onSelect={onSelectLevel}
          />
        ))}
      </div>

      <div className="text-center">
        <BigButton color="orange" onClick={onExit}>
          <div className="flex items-center gap-2">
            <Home className="w-6 h-6" />
            Back to Garage
          </div>
        </BigButton>
      </div>
    </motion.div>
  );
}

// ============================================================
// Pause Modal
// ============================================================

interface PauseModalProps {
  isOpen: boolean;
  onResume: () => void;
  onRestart: () => void;
  onExit: () => void;
  levelName: string;
}

function PauseModal({
  isOpen,
  onResume,
  onRestart,
  onExit,
  levelName,
}: PauseModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onResume} title="Game Paused">
      <div className="text-center">
        <p className="text-gray-600 mb-6">{levelName}</p>

        <div className="flex flex-col gap-3">
          <BigButton color="green" size="lg" onClick={onResume}>
            <div className="flex items-center justify-center gap-2">
              <Play className="w-6 h-6" />
              Resume
            </div>
          </BigButton>

          <BigButton color="blue" size="lg" onClick={onRestart}>
            <div className="flex items-center justify-center gap-2">
              <RotateCcw className="w-6 h-6" />
              Restart
            </div>
          </BigButton>

          <BigButton color="orange" size="lg" onClick={onExit}>
            <div className="flex items-center justify-center gap-2">
              <Home className="w-6 h-6" />
              Exit
            </div>
          </BigButton>
        </div>
      </div>
    </Modal>
  );
}

// ============================================================
// Victory Modal
// ============================================================

interface VictoryModalProps {
  isOpen: boolean;
  starsEarned: number;
  score: number;
  levelName: string;
  onContinue: () => void;
  onRestart: () => void;
  onExit: () => void;
}

function VictoryModal({
  isOpen,
  starsEarned,
  score,
  levelName,
  onContinue,
  onRestart,
  onExit,
}: VictoryModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onContinue} title="Level Complete!">
      <div className="text-center">
        <motion.div
          className="mb-4"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
        >
          <Trophy className="w-16 h-16 text-yellow-500 mx-auto" />
        </motion.div>

        <h3 className="text-xl font-bold text-gray-800 mb-2">{levelName}</h3>

        {/* Stars earned */}
        <div className="flex justify-center gap-2 my-6">
          {[1, 2, 3].map((star, index) => (
            <motion.div
              key={star}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: 'spring',
                delay: 0.3 + index * 0.15,
                stiffness: 300,
              }}
            >
              <Star
                className={`w-12 h-12 ${
                  star <= starsEarned
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            </motion.div>
          ))}
        </div>

        <p className="text-2xl font-bold text-brand-purple mb-6">
          Score: {score.toLocaleString()}
        </p>

        <div className="flex flex-col gap-3">
          <BigButton color="green" size="lg" onClick={onContinue}>
            Continue
          </BigButton>

          <BigButton color="blue" size="lg" onClick={onRestart}>
            <div className="flex items-center justify-center gap-2">
              <RotateCcw className="w-6 h-6" />
              Play Again
            </div>
          </BigButton>

          <BigButton color="orange" size="lg" onClick={onExit}>
            <div className="flex items-center justify-center gap-2">
              <Home className="w-6 h-6" />
              Exit
            </div>
          </BigButton>
        </div>
      </div>
    </Modal>
  );
}

// ============================================================
// Game Over Modal
// ============================================================

interface GameOverModalProps {
  isOpen: boolean;
  score: number;
  levelName: string;
  onRestart: () => void;
  onExit: () => void;
}

function GameOverModal({
  isOpen,
  score,
  levelName,
  onRestart,
  onExit,
}: GameOverModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onRestart} title="Time's Up!">
      <div className="text-center">
        <p className="text-gray-600 mb-4">{levelName}</p>
        <p className="text-xl font-bold text-brand-purple mb-6">
          Score: {score.toLocaleString()}
        </p>

        <div className="flex flex-col gap-3">
          <BigButton color="green" size="lg" onClick={onRestart}>
            <div className="flex items-center justify-center gap-2">
              <RotateCcw className="w-6 h-6" />
              Try Again
            </div>
          </BigButton>

          <BigButton color="orange" size="lg" onClick={onExit}>
            <div className="flex items-center justify-center gap-2">
              <Home className="w-6 h-6" />
              Exit
            </div>
          </BigButton>
        </div>
      </div>
    </Modal>
  );
}

// ============================================================
// StadiumGame Component
// ============================================================

export function StadiumGame({ initialLevelId, onExit }: StadiumGameProps) {
  // Game state
  const [gameState, setGameState] = useState<GameState>(
    initialLevelId ? 'playing' : 'level-select'
  );
  const [currentLevelId, setCurrentLevelId] = useState<string | null>(
    initialLevelId ?? null
  );
  const [score, setScore] = useState(0);
  const [starsCollected, setStarsCollected] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [earnedStars, setEarnedStars] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);

  // Input state for controls
  const [inputState, setInputState] = useState({
    left: false,
    right: false,
    jump: false,
  });

  // Stores
  const {
    isPaused,
    pauseGame,
    resumeGame,
    startGame,
    endGame,
    setScore: setGameStoreScore,
  } = useGameStore();

  const {
    totalStars,
    completedLevels,
    completeLevel,
    addStars,
    updatePlayTime,
  } = usePlayerStore();

  // Get current level
  const currentLevel = currentLevelId
    ? (getLevelById(currentLevelId) as StadiumLevel | undefined)
    : null;

  // Challenge objective tracking
  const challenge: ChallengeObjective | undefined = currentLevel?.config.challenges[0]
    ? {
        type: currentLevel.config.challenges[0].type,
        target: currentLevel.config.challenges[0].target,
        current: currentLevel.config.challenges[0].type === 'collect' ? starsCollected : 0,
        timeLimit: currentLevel.config.challenges[0].timeLimit,
      }
    : undefined;

  // Handle level selection
  const handleSelectLevel = useCallback((levelId: string) => {
    setCurrentLevelId(levelId);
    setGameState('playing');
    setScore(0);
    setStarsCollected(0);
    setElapsedTime(0);
    setEarnedStars(0);
    startGame('stadium', levelId);
  }, [startGame]);

  // Handle game completion
  const handleComplete = useCallback(
    (stars: number, finalScore: number) => {
      setEarnedStars(stars);
      setScore(finalScore);
      setGameState('victory');
      setShowCelebration(true);

      // Save progress
      if (currentLevelId) {
        completeLevel(currentLevelId, stars, finalScore);
      }

      // Update play time
      const { duration } = endGame();
      updatePlayTime(duration);
    },
    [currentLevelId, completeLevel, endGame, updatePlayTime]
  );

  // Handle game exit
  const handleExit = useCallback(() => {
    setCurrentLevelId(null);
    setGameState('level-select');
    setScore(0);
    setStarsCollected(0);
    setElapsedTime(0);
    endGame();
  }, [endGame]);

  // Handle restart
  const handleRestart = useCallback(() => {
    setGameState('playing');
    setScore(0);
    setStarsCollected(0);
    setElapsedTime(0);
    setEarnedStars(0);
    resumeGame();
  }, [resumeGame]);

  // Handle pause
  const handlePause = useCallback(() => {
    setGameState('paused');
    pauseGame();
  }, [pauseGame]);

  // Handle resume
  const handleResume = useCallback(() => {
    setGameState('playing');
    resumeGame();
  }, [resumeGame]);

  // Handle navigation exit
  const handleNavigationExit = useCallback(() => {
    handleExit();
    onExit?.();
  }, [handleExit, onExit]);

  // Handle star collection
  const handleStarCollected = useCallback((count: number) => {
    setStarsCollected(count);
  }, []);

  // Handle score update
  const handleScoreUpdate = useCallback(
    (newScore: number) => {
      setScore(newScore);
      setGameStoreScore(newScore);
    },
    [setGameStoreScore]
  );

  // Handle time update
  const handleTimeUpdate = useCallback((time: number) => {
    setElapsedTime(time);

    // Check for time-based game over
    if (challenge?.timeLimit && time >= challenge.timeLimit) {
      setGameState('game-over');
      endGame();
    }
  }, [challenge, endGame]);

  // Handle celebration complete
  const handleCelebrationComplete = useCallback(() => {
    setShowCelebration(false);
  }, []);

  // Control handlers
  const handleMoveLeft = useCallback((active: boolean) => {
    setInputState((prev) => ({ ...prev, left: active }));
  }, []);

  const handleMoveRight = useCallback((active: boolean) => {
    setInputState((prev) => ({ ...prev, right: active }));
  }, []);

  const handleJump = useCallback((active: boolean) => {
    setInputState((prev) => ({ ...prev, jump: active }));
  }, []);

  // Level select screen
  if (gameState === 'level-select' || !currentLevelId) {
    return (
      <AnimatePresence mode="wait">
        <LevelSelect
          onSelectLevel={handleSelectLevel}
          onExit={handleNavigationExit}
          totalStars={totalStars}
          completedLevels={completedLevels}
        />
      </AnimatePresence>
    );
  }

  // Game screen
  return (
    <div className="relative w-full h-full">
      {/* Game Canvas */}
      <div className="absolute inset-0 bg-gray-800 rounded-3xl overflow-hidden">
        <StadiumCanvas
          levelId={currentLevelId}
          onComplete={handleComplete}
          onExit={handleExit}
          onStarCollected={handleStarCollected}
          onScoreUpdate={handleScoreUpdate}
          onTimeUpdate={handleTimeUpdate}
        />
      </div>

      {/* HUD Overlay */}
      {gameState === 'playing' && currentLevel && (
        <StadiumHUD
          score={score}
          starsCollected={starsCollected}
          totalStars={currentLevel.config.starPositions.length}
          elapsedTime={elapsedTime}
          challenge={challenge}
          showTimer={!!challenge?.timeLimit}
        />
      )}

      {/* Touch Controls */}
      {gameState === 'playing' && (
        <StadiumControls
          onMoveLeft={handleMoveLeft}
          onMoveRight={handleMoveRight}
          onJump={handleJump}
          onPause={handlePause}
          disabled={isPaused}
        />
      )}

      {/* Pause Modal */}
      <PauseModal
        isOpen={gameState === 'paused'}
        onResume={handleResume}
        onRestart={handleRestart}
        onExit={handleExit}
        levelName={currentLevel?.name ?? 'Stadium'}
      />

      {/* Victory Modal */}
      <VictoryModal
        isOpen={gameState === 'victory'}
        starsEarned={earnedStars}
        score={score}
        levelName={currentLevel?.name ?? 'Stadium'}
        onContinue={handleExit}
        onRestart={handleRestart}
        onExit={handleNavigationExit}
      />

      {/* Game Over Modal */}
      <GameOverModal
        isOpen={gameState === 'game-over'}
        score={score}
        levelName={currentLevel?.name ?? 'Stadium'}
        onRestart={handleRestart}
        onExit={handleExit}
      />

      {/* Celebration Overlay */}
      <AnimatePresence>
        {showCelebration && (
          <CelebrationOverlay
            type={earnedStars === 3 ? 'fireworks' : 'stars'}
            duration={3000}
            onComplete={handleCelebrationComplete}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default StadiumGame;
