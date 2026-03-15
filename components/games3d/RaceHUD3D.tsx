'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pause, Play, RotateCcw, Home, Gauge, Trophy, Flag, Timer } from 'lucide-react';
import type { LearningCategory } from '@/lib/stores/learning-game-store';

type PowerUpType = 'boost' | 'shield' | 'star' | 'mushroom' | 'lightning' | null;

interface RaceHUD3DProps {
  speed: number;
  maxSpeed: number;
  position: number;
  totalRacers: number;
  lap: number;
  totalLaps: number;
  time: number;
  bestLapTime?: number;
  lapTimes?: number[];
  lapNotification?: string | null;
  positionNotification?: { text: string; direction: 'up' | 'down' } | null;
  isPaused: boolean;
  isFinished: boolean;
  countdown?: number | null;
  coins?: number;
  currentItem?: PowerUpType;
  playerX?: number;
  playerZ?: number;
  playerRotation?: number;
  aiPositions?: Array<{ x: number; z: number; color: string }>;
  onPause: () => void;
  onResume: () => void;
  onRestart: () => void;
  onExit: () => void;
  onUseItem?: () => void;
  // Learning challenge props
  learningActive?: boolean;
  learningBannerText?: string;
  learningCategory?: LearningCategory;
  learningScore?: number;
  learningStreak?: number;
  learningTimer?: number;
  learningTimerTotal?: number;
  learningCorrectCount?: number;
  learningTargetCount?: number;
  learningScorePopups?: number[]; // timestamps of recent correct collections
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

function Speedometer({ speed, maxSpeed }: { speed: number; maxSpeed: number }) {
  const percentage = Math.min(100, (speed / maxSpeed) * 100);
  const rotation = (percentage / 100) * 240 - 120; // -120 to 120 degrees

  return (
    <div className="relative w-32 h-32">
      {/* Background arc */}
      <svg className="w-full h-full" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="speedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>

        {/* Background track */}
        <path
          d="M 15 75 A 40 40 0 1 1 85 75"
          fill="none"
          stroke="#333"
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* Speed arc */}
        <path
          d="M 15 75 A 40 40 0 1 1 85 75"
          fill="none"
          stroke="url(#speedGradient)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${percentage * 2.2} 220`}
        />

        {/* Needle */}
        <g transform={`rotate(${rotation} 50 50)`}>
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="20"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="50" cy="50" r="5" fill="#fff" />
        </g>
      </svg>

      {/* Speed value */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-center">
        <span className="text-2xl font-bold text-white">{Math.round(speed)}</span>
        <span className="text-xs text-white/60 ml-1">km/h</span>
      </div>
    </div>
  );
}

// Mario Kart style BIG position display
function PositionBadge({ position, total }: { position: number; total: number }) {
  const colors: Record<number, string> = {
    1: 'from-yellow-400 via-yellow-300 to-yellow-500',
    2: 'from-gray-300 via-gray-200 to-gray-400',
    3: 'from-orange-400 via-orange-300 to-orange-500',
  };

  const suffix = position === 1 ? 'st' : position === 2 ? 'nd' : position === 3 ? 'rd' : 'th';

  return (
    <div className="relative">
      <div className={`bg-gradient-to-br ${colors[position] || 'from-blue-500 to-blue-700'} rounded-2xl px-5 py-3 shadow-2xl border-4 border-white/30`}>
        <div className="flex items-baseline gap-1">
          <span className="text-6xl font-black text-white drop-shadow-lg" style={{ textShadow: '3px 3px 0 rgba(0,0,0,0.5)' }}>
            {position}
          </span>
          <span className="text-2xl font-black text-white/90 drop-shadow" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.4)' }}>
            {suffix}
          </span>
        </div>
      </div>
    </div>
  );
}

// Item slot display (Mario Kart style)
function ItemSlot({ item, onUse }: { item: PowerUpType; onUse?: () => void }) {
  const itemIcons: Record<string, { emoji: string; color: string; name: string }> = {
    boost: { emoji: '🚀', color: 'from-red-500 to-orange-500', name: 'Boost' },
    shield: { emoji: '🛡️', color: 'from-blue-500 to-cyan-500', name: 'Shield' },
    star: { emoji: '⭐', color: 'from-yellow-400 to-yellow-600', name: 'Star' },
    mushroom: { emoji: '🍄', color: 'from-red-400 to-pink-500', name: 'Mushroom' },
    lightning: { emoji: '⚡', color: 'from-yellow-300 to-yellow-500', name: 'Lightning' },
  };

  const itemData = item ? itemIcons[item] : null;

  return (
    <button
      onClick={onUse}
      disabled={!item}
      className={`relative w-20 h-20 rounded-2xl border-4 border-white/50 shadow-2xl overflow-hidden transition-transform hover:scale-105 active:scale-95 ${
        item ? 'cursor-pointer' : 'cursor-default'
      }`}
    >
      {/* Background */}
      <div className={`absolute inset-0 ${itemData ? `bg-gradient-to-br ${itemData.color}` : 'bg-gray-800/80'}`} />

      {/* Item icon or empty state */}
      {itemData ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl drop-shadow-lg">{itemData.emoji}</span>
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl text-white/30">?</span>
        </div>
      )}

      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none" />

      {/* Press hint */}
      {item && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs text-center py-0.5">
          SPACE
        </div>
      )}
    </button>
  );
}

// Coin counter
function CoinCounter({ coins }: { coins: number }) {
  return (
    <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-4 py-2">
      <span className="text-2xl">🪙</span>
      <span className="text-xl font-bold text-yellow-400" style={{ textShadow: '1px 1px 0 rgba(0,0,0,0.5)' }}>
        {coins.toString().padStart(2, '0')}
      </span>
    </div>
  );
}

function LapCounter({ current, total }: { current: number; total: number }) {
  return (
    <div className="bg-black/50 backdrop-blur-sm rounded-xl px-4 py-2">
      <div className="flex items-center gap-2">
        <Flag className="w-5 h-5 text-white/60" />
        <span className="text-xl font-bold text-white">
          Lap {current}/{total}
        </span>
      </div>
    </div>
  );
}

function RaceTimer({ time, bestLap }: { time: number; bestLap?: number }) {
  return (
    <div className="bg-black/50 backdrop-blur-sm rounded-xl px-4 py-2">
      <div className="flex items-center gap-2">
        <Timer className="w-5 h-5 text-white/60" />
        <span className="text-xl font-mono font-bold text-white">{formatTime(time)}</span>
      </div>
      {bestLap && (
        <div className="text-xs text-green-400 mt-1">
          Best: {formatTime(bestLap)}
        </div>
      )}
    </div>
  );
}

const Minimap = memo(function Minimap({ playerPosition, playerRotation, aiPositions, trackLength, trackWidth }: {
  playerPosition: { x: number; z: number };
  playerRotation: number;
  aiPositions: Array<{ x: number; z: number; color: string }>;
  trackLength: number;
  trackWidth: number;
}) {
  const mapSize = 140;
  const padding = 12;

  // Track extents (matching kid-friendly track with S-curves)
  // x range roughly: -180 to 180, z range: -100 to 100
  const minX = -185;
  const maxX = 185;
  const minZ = -105;
  const maxZ = 105;

  const normalizeX = (x: number) =>
    ((x - minX) / (maxX - minX)) * (mapSize - padding * 2) + padding;
  const normalizeZ = (z: number) =>
    ((z - minZ) / (maxZ - minZ)) * (mapSize - padding * 2) + padding;

  // Generate the actual track path to match generateKidFriendlyTrack
  const trackPath = useMemo(() => {
    const pts: string[] = [];
    const segments = 96;
    for (let i = 0; i <= segments; i++) {
      const t = (i % segments) / segments;
      const angle = t * Math.PI * 2;
      let x = Math.cos(angle) * trackLength * 1.3;
      let z = Math.sin(angle) * trackWidth;
      x += Math.sin(angle * 2) * 25;
      z += Math.sin(angle * 3) * 15;
      pts.push(`${normalizeX(x).toFixed(1)},${normalizeZ(z).toFixed(1)}`);
    }
    return pts.join(' ');
  }, [trackLength, trackWidth]);

  const px = normalizeX(playerPosition.x);
  const pz = normalizeZ(playerPosition.z);

  return (
    <div
      className="bg-black/70 backdrop-blur-sm rounded-xl overflow-hidden border border-white/20"
      style={{ width: mapSize, height: mapSize }}
    >
      <svg width={mapSize} height={mapSize} className="absolute inset-0">
        {/* Track road outline */}
        <polyline
          points={trackPath}
          fill="none"
          stroke="#444"
          strokeWidth="10"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Track road surface */}
        <polyline
          points={trackPath}
          fill="none"
          stroke="#666"
          strokeWidth="6"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* AI truck dots */}
        {aiPositions.map((ai, i) => (
          <circle
            key={i}
            cx={normalizeX(ai.x)}
            cy={normalizeZ(ai.z)}
            r="4"
            fill={ai.color}
            stroke="#000"
            strokeWidth="1"
          />
        ))}

        {/* Player direction arrow */}
        <g transform={`translate(${px}, ${pz}) rotate(${(-playerRotation * 180) / Math.PI + 90})`}>
          <polygon
            points="0,-6 4,4 -4,4"
            fill="#FF3333"
            stroke="#FFF"
            strokeWidth="1.5"
          />
        </g>
      </svg>

      {/* Label */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] text-white/40 font-bold tracking-wider">
        MAP
      </div>
    </div>
  );
});

function TrafficLight({ count }: { count: number }) {
  // 3 = all red, 2 = top two red, 1 = top red, 0 = green
  const lights = [
    { active: count >= 1 && count <= 3, color: '#ef4444', glow: '#ff0000' },
    { active: count >= 1 && count <= 2, color: '#ef4444', glow: '#ff0000' },
    { active: count === 0, color: '#22c55e', glow: '#00ff44' },
  ];

  return (
    <div className="bg-gray-900 rounded-2xl p-3 border-4 border-gray-700 shadow-2xl flex flex-col gap-3">
      {lights.map((light, i) => (
        <div
          key={i}
          className="w-12 h-12 rounded-full border-2 transition-all duration-300"
          style={{
            backgroundColor: light.active ? light.color : '#333',
            borderColor: light.active ? light.glow : '#555',
            boxShadow: light.active ? `0 0 20px ${light.glow}, 0 0 40px ${light.glow}40` : 'none',
          }}
        />
      ))}
    </div>
  );
}

function CountdownOverlay({ count }: { count: number }) {
  const label = count === 0 ? 'GO!' : count === 1 ? 'SET' : count === 2 ? 'READY' : '';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
    >
      {/* Dim overlay that lifts on GO */}
      <motion.div
        className="absolute inset-0"
        initial={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        animate={{
          backgroundColor: count === 0 ? 'rgba(0,0,0,0)' : 'rgba(0,0,0,0.4)',
        }}
        transition={{ duration: 0.4 }}
      />

      <div className="relative flex flex-col items-center gap-6">
        {/* Traffic light */}
        <TrafficLight count={count} />

        {/* Big number or GO */}
        <AnimatePresence mode="wait">
          <motion.div
            key={count}
            initial={{ scale: 2.5, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.3, opacity: 0, y: -30 }}
            transition={{ type: 'spring', damping: 12, stiffness: 200 }}
            className="flex flex-col items-center"
          >
            <span
              className={`font-black drop-shadow-2xl ${
                count === 0
                  ? 'text-green-400 text-[10rem] leading-none'
                  : 'text-white text-9xl'
              }`}
              style={{ textShadow: count === 0
                ? '0 0 30px rgba(34,197,94,0.8), 4px 4px 0 rgba(0,0,0,0.6)'
                : '4px 4px 0 rgba(0,0,0,0.6)'
              }}
            >
              {count === 0 ? 'GO!' : count}
            </span>

            {/* Sub-label */}
            {label && count > 0 && (
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-3xl font-bold text-white/70 mt-2 tracking-widest"
                style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.5)' }}
              >
                {label}
              </motion.span>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Rev hint during countdown */}
        {count > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="text-white/60 text-sm font-bold tracking-wider mt-2"
          >
            Hold W or GAS to rev!
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function PauseMenu({
  onResume,
  onRestart,
  onExit,
}: {
  onResume: () => void;
  onRestart: () => void;
  onExit: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 shadow-2xl max-w-sm w-full mx-4"
      >
        <h2 className="text-3xl font-bold text-white text-center mb-6">Paused</h2>

        <div className="space-y-3">
          <button
            onClick={onResume}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl py-4 font-bold text-lg flex items-center justify-center gap-2 hover:from-green-600 hover:to-green-700 transition-all"
          >
            <Play className="w-6 h-6" />
            Resume
          </button>

          <button
            onClick={onRestart}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl py-4 font-bold text-lg flex items-center justify-center gap-2 hover:from-yellow-600 hover:to-orange-600 transition-all"
          >
            <RotateCcw className="w-6 h-6" />
            Restart
          </button>

          <button
            onClick={onExit}
            className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl py-4 font-bold text-lg flex items-center justify-center gap-2 hover:from-gray-700 hover:to-gray-800 transition-all"
          >
            <Home className="w-6 h-6" />
            Exit
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function FinishScreen({
  position,
  time,
  lapTimes,
  bestLapTime,
  totalLaps,
  onRestart,
  onExit,
}: {
  position: number;
  time: number;
  lapTimes: number[];
  bestLapTime?: number;
  totalLaps: number;
  onRestart: () => void;
  onExit: () => void;
}) {
  const suffix = position === 1 ? 'st' : position === 2 ? 'nd' : position === 3 ? 'rd' : 'th';
  const trophyColor = position === 1 ? 'text-yellow-400' : position === 2 ? 'text-gray-300' : position === 3 ? 'text-orange-400' : 'text-gray-500';
  const podiumMessage = position === 1 ? 'WINNER!' : position <= 3 ? 'Great Race!' : 'Keep Practicing!';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 15 }}
        className="text-center max-w-md w-full mx-4"
      >
        <Trophy className={`w-20 h-20 mx-auto mb-3 ${trophyColor}`} />

        <h2 className="text-5xl font-black text-white mb-1">
          {position}{suffix} Place!
        </h2>
        <p className="text-lg text-white/50 mb-5">{podiumMessage}</p>

        {/* Stats card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 mb-6 text-left border border-white/10">
          {/* Total time */}
          <div className="flex justify-between items-center mb-3 pb-3 border-b border-white/10">
            <span className="text-white/60 font-semibold flex items-center gap-2">
              <Timer className="w-4 h-4" /> Total Time
            </span>
            <span className="text-2xl font-mono font-black text-white">{formatTime(time)}</span>
          </div>

          {/* Lap breakdown */}
          {lapTimes.length > 0 && (
            <div className="space-y-2 mb-3 pb-3 border-b border-white/10">
              {lapTimes.map((lt, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.15 }}
                  className="flex justify-between items-center"
                >
                  <span className="text-white/50 text-sm">
                    <Flag className="w-3 h-3 inline mr-1" />
                    Lap {i + 1}
                  </span>
                  <span className={`font-mono text-sm font-bold ${
                    bestLapTime && lt === bestLapTime ? 'text-green-400' : 'text-white/70'
                  }`}>
                    {formatTime(lt)}
                    {bestLapTime && lt === bestLapTime && (
                      <span className="text-xs ml-1 text-green-400">BEST</span>
                    )}
                  </span>
                </motion.div>
              ))}
              {/* If fewer laps recorded than total (edge case), show placeholders */}
              {lapTimes.length < totalLaps && Array.from({ length: totalLaps - lapTimes.length }).map((_, i) => (
                <div key={`empty-${i}`} className="flex justify-between items-center">
                  <span className="text-white/30 text-sm">
                    <Flag className="w-3 h-3 inline mr-1" />
                    Lap {lapTimes.length + i + 1}
                  </span>
                  <span className="font-mono text-sm text-white/30">--:--.--</span>
                </div>
              ))}
            </div>
          )}

          {/* Best lap highlight */}
          {bestLapTime && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex justify-between items-center"
            >
              <span className="text-green-400/80 font-semibold text-sm flex items-center gap-1">
                <Gauge className="w-4 h-4" /> Best Lap
              </span>
              <span className="font-mono font-bold text-green-400">{formatTime(bestLapTime)}</span>
            </motion.div>
          )}
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={onRestart}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl px-8 py-4 font-bold text-lg flex items-center gap-2 hover:from-green-600 hover:to-green-700 transition-all"
          >
            <RotateCcw className="w-5 h-5" />
            Race Again
          </button>

          <button
            onClick={onExit}
            className="bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl px-8 py-4 font-bold text-lg flex items-center gap-2 hover:from-gray-700 hover:to-gray-800 transition-all"
          >
            <Home className="w-5 h-5" />
            Exit
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// Learning Challenge HUD Components
// ============================================================

function LearningBanner({
  text,
  category,
  timer,
  timerTotal,
}: {
  text: string;
  category: LearningCategory;
  timer: number;
  timerTotal: number;
}) {
  const categoryLabels: Record<LearningCategory, string> = {
    numbers: '#',
    letters: 'ABC',
    words: 'Aa',
    math: '+',
  };

  const timerPercent = timerTotal > 0 ? (timer / timerTotal) * 100 : 100;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 20 }}
        className="bg-gradient-to-r from-purple-600/90 via-blue-600/90 to-purple-600/90 backdrop-blur-sm rounded-2xl px-8 py-3 border-2 border-white/40 shadow-2xl"
      >
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-black text-sm">
            {categoryLabels[category]}
          </span>
          <span
            className="text-2xl font-black text-white"
            style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.5)' }}
          >
            {text}
          </span>
        </div>
        {/* Timer bar */}
        <div className="mt-2 h-1.5 bg-white/20 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              width: `${timerPercent}%`,
              background: timerPercent > 50
                ? 'linear-gradient(to right, #4ade80, #a3e635)'
                : timerPercent > 25
                  ? 'linear-gradient(to right, #facc15, #fb923c)'
                  : 'linear-gradient(to right, #f87171, #ef4444)',
            }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </motion.div>
    </div>
  );
}

function LearningScoreDisplay({
  score,
  streak,
  correctCount,
  targetCount,
}: {
  score: number;
  streak: number;
  correctCount: number;
  targetCount: number;
}) {
  return (
    <div className="fixed top-20 left-4 z-40 pointer-events-none space-y-2">
      {/* Score */}
      <div className="bg-purple-600/80 backdrop-blur-sm rounded-lg px-4 py-2 border-2 border-purple-300/30">
        <div className="text-white/80 text-xs font-bold">LEARN</div>
        <div
          className="text-2xl font-black text-white"
          style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.5)' }}
        >
          {score.toLocaleString()}
        </div>
      </div>

      {/* Progress */}
      <div className="bg-green-600/70 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-green-300/30">
        <div className="text-white text-sm font-bold">
          {correctCount} / {targetCount} found
        </div>
      </div>

      {/* Streak */}
      <AnimatePresence>
        {streak >= 2 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="bg-orange-500/80 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-orange-300/30"
          >
            <div
              className="text-white text-sm font-bold"
              style={{ textShadow: '1px 1px 0 rgba(0,0,0,0.4)' }}
            >
              {streak}x STREAK
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FloatingScorePopup({ value, id }: { value: number; id: number }) {
  return (
    <motion.div
      key={id}
      initial={{ y: 0, opacity: 1, scale: 0.5 }}
      animate={{ y: -80, opacity: 0, scale: 1.5 }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
      className="fixed top-1/3 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
    >
      <span
        className="text-5xl font-black text-green-400"
        style={{ textShadow: '3px 3px 0 rgba(0,0,0,0.5)' }}
      >
        +{value}
      </span>
    </motion.div>
  );
}

export const RaceHUD3D = memo(function RaceHUD3D({
  speed,
  maxSpeed,
  position,
  totalRacers,
  lap,
  totalLaps,
  time,
  bestLapTime,
  lapTimes = [],
  lapNotification = null,
  positionNotification = null,
  isPaused,
  isFinished,
  countdown,
  coins = 0,
  currentItem = null,
  playerX = 0,
  playerZ = 0,
  playerRotation = 0,
  aiPositions = [],
  onPause,
  onResume,
  onRestart,
  onExit,
  onUseItem,
  learningActive = false,
  learningBannerText,
  learningCategory,
  learningScore = 0,
  learningStreak = 0,
  learningTimer = 0,
  learningTimerTotal = 150,
  learningCorrectCount = 0,
  learningTargetCount = 5,
  learningScorePopups = [],
}: RaceHUD3DProps) {
  return (
    <>
      {/* Learning Banner - top center below mode toggle */}
      {learningActive && learningBannerText && learningCategory && (
        <LearningBanner
          text={learningBannerText}
          category={learningCategory}
          timer={learningTimer}
          timerTotal={learningTimerTotal}
        />
      )}

      {/* Learning Score Display - left side below TIME */}
      {learningActive && (
        <LearningScoreDisplay
          score={learningScore}
          streak={learningStreak}
          correctCount={learningCorrectCount}
          targetCount={learningTargetCount}
        />
      )}

      {/* Floating score popups */}
      <AnimatePresence>
        {learningScorePopups.map((timestamp) => (
          <FloatingScorePopup
            key={timestamp}
            id={timestamp}
            value={100 * Math.max(1, learningStreak)}
          />
        ))}
      </AnimatePresence>

      {/* Top left - TIME */}
      <div className="fixed top-4 left-4 z-40 pointer-events-none">
        <div className="bg-blue-600/90 backdrop-blur-sm rounded-lg px-4 py-2 border-2 border-white/30">
          <div className="text-white/80 text-xs font-bold">TIME</div>
          <div className="text-2xl font-mono font-black text-white" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.5)' }}>
            {formatTime(time)}
          </div>
        </div>
      </div>

      {/* Top center - LAP counter (below mode toggle) */}
      <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
        <div className="bg-black/70 backdrop-blur-sm rounded-lg px-6 py-2 border-2 border-white/30">
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-white" />
            <span className="text-2xl font-black text-white" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.5)' }}>
              {lap} / {totalLaps}
            </span>
          </div>
        </div>
      </div>

      {/* Top right - Position (BIG Mario Kart style) */}
      <div className="fixed top-4 right-4 z-40 pointer-events-none">
        <PositionBadge position={position} total={totalRacers} />
      </div>

      {/* Left side - Item slot */}
      <div className="fixed top-1/3 left-4 z-40 pointer-events-auto">
        <ItemSlot item={currentItem} onUse={onUseItem} />
      </div>

      {/* Bottom left - Speedometer and coins */}
      <div className="fixed bottom-4 left-4 z-40 pointer-events-none">
        <div className="flex flex-col items-start gap-2">
          <CoinCounter coins={coins} />
          <Speedometer speed={speed} maxSpeed={maxSpeed} />
        </div>
      </div>

      {/* Bottom right - Minimap */}
      <div className="fixed bottom-4 right-4 z-40 pointer-events-none">
        <Minimap
          playerPosition={{ x: playerX, z: playerZ }}
          playerRotation={playerRotation}
          aiPositions={aiPositions}
          trackLength={120}
          trackWidth={70}
        />
      </div>

      {/* Pause button - top right corner below position */}
      <button
        onClick={onPause}
        className="fixed top-28 right-4 z-40 pointer-events-auto bg-black/50 backdrop-blur-sm rounded-xl p-3 hover:bg-black/70 transition-colors"
      >
        <Pause className="w-6 h-6 text-white" />
      </button>

      {/* Countdown overlay */}
      <AnimatePresence>
        {countdown !== null && countdown !== undefined && (
          <CountdownOverlay count={countdown} />
        )}
      </AnimatePresence>

      {/* Lap change notification */}
      <AnimatePresence>
        {lapNotification && (
          <motion.div
            key={lapNotification}
            initial={{ opacity: 0, scale: 0.5, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.3, y: -20 }}
            transition={{ type: 'spring', damping: 12, stiffness: 200 }}
            className="fixed top-1/3 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          >
            <div
              className="px-10 py-4 rounded-2xl border-2"
              style={{
                background: lapNotification === 'FINAL LAP!'
                  ? 'linear-gradient(135deg, rgba(239,68,68,0.9), rgba(220,38,38,0.9))'
                  : 'linear-gradient(135deg, rgba(59,130,246,0.9), rgba(37,99,235,0.9))',
                borderColor: lapNotification === 'FINAL LAP!'
                  ? 'rgba(252,165,165,0.6)'
                  : 'rgba(147,197,253,0.6)',
                boxShadow: lapNotification === 'FINAL LAP!'
                  ? '0 0 40px rgba(239,68,68,0.5)'
                  : '0 0 40px rgba(59,130,246,0.5)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <span
                className="text-4xl font-black text-white tracking-wider"
                style={{ textShadow: '3px 3px 0 rgba(0,0,0,0.4)' }}
              >
                {lapNotification}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Position change notification */}
      <AnimatePresence>
        {positionNotification && (
          <motion.div
            key={positionNotification.text + positionNotification.direction}
            initial={{ opacity: 0, x: positionNotification.direction === 'up' ? -60 : 60, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ type: 'spring', damping: 14, stiffness: 250 }}
            className="fixed top-[45%] left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          >
            <div
              className="flex items-center gap-3 px-6 py-3 rounded-xl border-2"
              style={{
                background: positionNotification.direction === 'up'
                  ? 'linear-gradient(135deg, rgba(34,197,94,0.9), rgba(22,163,74,0.9))'
                  : 'linear-gradient(135deg, rgba(239,68,68,0.85), rgba(220,38,38,0.85))',
                borderColor: positionNotification.direction === 'up'
                  ? 'rgba(134,239,172,0.5)'
                  : 'rgba(252,165,165,0.5)',
                boxShadow: positionNotification.direction === 'up'
                  ? '0 0 30px rgba(34,197,94,0.4)'
                  : '0 0 30px rgba(239,68,68,0.4)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <span className="text-2xl">
                {positionNotification.direction === 'up' ? '\u25B2' : '\u25BC'}
              </span>
              <span
                className="text-3xl font-black text-white tracking-wide"
                style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.3)' }}
              >
                {positionNotification.text}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pause menu */}
      <AnimatePresence>
        {isPaused && (
          <PauseMenu onResume={onResume} onRestart={onRestart} onExit={onExit} />
        )}
      </AnimatePresence>

      {/* Finish screen */}
      <AnimatePresence>
        {isFinished && (
          <FinishScreen
            position={position}
            time={time}
            lapTimes={lapTimes}
            bestLapTime={bestLapTime}
            totalLaps={totalLaps}
            onRestart={onRestart}
            onExit={onExit}
          />
        )}
      </AnimatePresence>
    </>
  );
});

export default RaceHUD3D;
