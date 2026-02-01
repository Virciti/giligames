'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pause, Play, RotateCcw, Home, Gauge, Trophy, Flag, Timer } from 'lucide-react';

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
  isPaused: boolean;
  isFinished: boolean;
  countdown?: number | null;
  coins?: number;
  currentItem?: PowerUpType;
  playerX?: number;
  playerZ?: number;
  onPause: () => void;
  onResume: () => void;
  onRestart: () => void;
  onExit: () => void;
  onUseItem?: () => void;
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

function Minimap({ playerPosition, trackBounds }: {
  playerPosition: { x: number; z: number };
  trackBounds: { minX: number; maxX: number; minZ: number; maxZ: number };
}) {
  const mapSize = 120;
  const padding = 10;

  const normalizeX = (x: number) =>
    ((x - trackBounds.minX) / (trackBounds.maxX - trackBounds.minX)) * (mapSize - padding * 2) + padding;
  const normalizeZ = (z: number) =>
    ((z - trackBounds.minZ) / (trackBounds.maxZ - trackBounds.minZ)) * (mapSize - padding * 2) + padding;

  return (
    <div
      className="bg-black/60 backdrop-blur-sm rounded-xl overflow-hidden"
      style={{ width: mapSize, height: mapSize }}
    >
      {/* Track outline (simplified oval) */}
      <svg width={mapSize} height={mapSize} className="absolute inset-0">
        <ellipse
          cx={mapSize / 2}
          cy={mapSize / 2}
          rx={mapSize / 2 - padding}
          ry={mapSize / 2 - padding - 10}
          fill="none"
          stroke="#444"
          strokeWidth="8"
        />
        <ellipse
          cx={mapSize / 2}
          cy={mapSize / 2}
          rx={mapSize / 2 - padding}
          ry={mapSize / 2 - padding - 10}
          fill="none"
          stroke="#666"
          strokeWidth="4"
        />
      </svg>

      {/* Player dot */}
      <div
        className="absolute w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-lg"
        style={{
          left: normalizeX(playerPosition.x),
          top: normalizeZ(playerPosition.z),
          transform: 'translate(-50%, -50%)',
        }}
      />
    </div>
  );
}

function CountdownOverlay({ count }: { count: number }) {
  return (
    <motion.div
      initial={{ scale: 2, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.5, opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
    >
      <motion.div
        key={count}
        initial={{ scale: 1.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        className={`text-9xl font-black drop-shadow-2xl ${
          count === 0 ? 'text-green-400' : 'text-white'
        }`}
      >
        {count === 0 ? 'GO!' : count}
      </motion.div>
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
  onRestart,
  onExit,
}: {
  position: number;
  time: number;
  onRestart: () => void;
  onExit: () => void;
}) {
  const suffix = position === 1 ? 'st' : position === 2 ? 'nd' : position === 3 ? 'rd' : 'th';

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
        className="text-center"
      >
        <Trophy className={`w-24 h-24 mx-auto mb-4 ${
          position === 1 ? 'text-yellow-400' : position === 2 ? 'text-gray-300' : position === 3 ? 'text-orange-400' : 'text-gray-500'
        }`} />

        <h2 className="text-5xl font-black text-white mb-2">
          {position}{suffix} Place!
        </h2>

        <p className="text-2xl text-white/60 mb-8">
          Time: {formatTime(time)}
        </p>

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

export function RaceHUD3D({
  speed,
  maxSpeed,
  position,
  totalRacers,
  lap,
  totalLaps,
  time,
  bestLapTime,
  isPaused,
  isFinished,
  countdown,
  coins = 0,
  currentItem = null,
  playerX = 0,
  playerZ = 0,
  onPause,
  onResume,
  onRestart,
  onExit,
  onUseItem,
}: RaceHUD3DProps) {
  return (
    <>
      {/* Top left - TIME */}
      <div className="fixed top-4 left-4 z-40 pointer-events-none">
        <div className="bg-blue-600/90 backdrop-blur-sm rounded-lg px-4 py-2 border-2 border-white/30">
          <div className="text-white/80 text-xs font-bold">TIME</div>
          <div className="text-2xl font-mono font-black text-white" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.5)' }}>
            {formatTime(time)}
          </div>
        </div>
      </div>

      {/* Top center - LAP counter */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
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
          trackBounds={{ minX: -120, maxX: 120, minZ: -80, maxZ: 80 }}
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
            onRestart={onRestart}
            onExit={onExit}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default RaceHUD3D;
