'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Flag, Gauge } from 'lucide-react';
import type { RaceLevel } from '@/content/types';

// ============================================================
// Types
// ============================================================

interface RaceHUDProps {
  position: number;
  totalRacers: number;
  currentLap: number;
  totalLaps: number;
  speed?: number;
  showMinimap?: boolean;
  level?: RaceLevel;
  playerPosition?: { x: number; y: number };
  aiPositions?: Array<{ x: number; y: number }>;
}

// ============================================================
// Position Badge Component
// ============================================================

function PositionBadge({ position }: { position: number }) {
  const colors = {
    1: 'bg-brand-yellow text-gray-800',
    2: 'bg-gray-300 text-gray-800',
    3: 'bg-amber-600 text-white',
    4: 'bg-gray-500 text-white',
  };

  const suffixes = {
    1: 'st',
    2: 'nd',
    3: 'rd',
    4: 'th',
  };

  const color = colors[position as keyof typeof colors] || colors[4];
  const suffix = suffixes[position as keyof typeof suffixes] || 'th';

  return (
    <motion.div
      key={position}
      initial={{ scale: 1.5, rotate: -10 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', damping: 10 }}
      className={`${color} rounded-2xl px-4 py-2 shadow-lg`}
    >
      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-black">{position}</span>
        <span className="text-xl font-bold">{suffix}</span>
      </div>
    </motion.div>
  );
}

// ============================================================
// Lap Counter Component
// ============================================================

function LapCounter({ current, total }: { current: number; total: number }) {
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-lg flex items-center gap-2">
      <Flag className="w-5 h-5 text-brand-green" />
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-gray-800">{current}</span>
        <span className="text-lg text-gray-500">/</span>
        <span className="text-xl font-semibold text-gray-600">{total}</span>
      </div>
      <span className="text-sm font-medium text-gray-500">LAP</span>
    </div>
  );
}

// ============================================================
// Speed Indicator Component
// ============================================================

function SpeedIndicator({ speed }: { speed: number }) {
  // Normalize speed (0-200) to display value
  const displaySpeed = Math.round(speed);
  const normalizedSpeed = Math.min(100, (speed / 200) * 100);

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-lg">
      <div className="flex items-center gap-2">
        <Gauge className="w-5 h-5 text-brand-blue" />
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-gray-800">{displaySpeed}</span>
          <span className="text-sm text-gray-500">mph</span>
        </div>
      </div>
      {/* Speed bar */}
      <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden w-24">
        <motion.div
          className="h-full bg-brand-blue rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${normalizedSpeed}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>
    </div>
  );
}

// ============================================================
// Minimap Component
// ============================================================

function Minimap({
  level,
  playerPosition,
  aiPositions,
}: {
  level: RaceLevel;
  playerPosition: { x: number; y: number };
  aiPositions: Array<{ x: number; y: number }>;
}) {
  const config = level.config;
  const mapSize = 120;
  const padding = 10;

  // Calculate bounds
  const minX = Math.min(...config.waypoints.map((w) => w.x)) - 50;
  const maxX = Math.max(...config.waypoints.map((w) => w.x)) + 50;
  const minY = Math.min(...config.waypoints.map((w) => w.y)) - 50;
  const maxY = Math.max(...config.waypoints.map((w) => w.y)) + 50;

  const scaleX = (mapSize - padding * 2) / (maxX - minX);
  const scaleY = (mapSize - padding * 2) / (maxY - minY);
  const scale = Math.min(scaleX, scaleY);

  const toMapCoords = (x: number, y: number) => ({
    x: padding + (x - minX) * scale,
    y: padding + (y - minY) * scale,
  });

  // Create track path
  const trackPath = config.waypoints
    .map((wp, i) => {
      const coords = toMapCoords(wp.x, wp.y);
      return `${i === 0 ? 'M' : 'L'} ${coords.x} ${coords.y}`;
    })
    .join(' ') + ' Z';

  return (
    <div
      className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden"
      style={{ width: mapSize, height: mapSize }}
    >
      <svg width={mapSize} height={mapSize} viewBox={`0 0 ${mapSize} ${mapSize}`}>
        {/* Track background */}
        <path
          d={trackPath}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Track */}
        <path
          d={trackPath}
          fill="none"
          stroke="#6B7280"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Start/Finish */}
        {(() => {
          const start = toMapCoords(config.waypoints[0].x, config.waypoints[0].y);
          return (
            <rect
              x={start.x - 3}
              y={start.y - 3}
              width={6}
              height={6}
              fill="#000"
            />
          );
        })()}

        {/* AI racers */}
        {aiPositions.map((pos, i) => {
          const coords = toMapCoords(pos.x, pos.y);
          return (
            <circle
              key={i}
              cx={coords.x}
              cy={coords.y}
              r={4}
              fill={['#4ECDC4', '#7BC74D', '#9B5DE5', '#FF9F43'][i % 4]}
            />
          );
        })}

        {/* Player */}
        {(() => {
          const coords = toMapCoords(playerPosition.x, playerPosition.y);
          return (
            <circle
              cx={coords.x}
              cy={coords.y}
              r={5}
              fill="#FF6B6B"
              stroke="#FFFFFF"
              strokeWidth={2}
            />
          );
        })()}
      </svg>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function RaceHUD({
  position,
  // totalRacers is available for future use (e.g., showing "1st of 4")
  totalRacers: _totalRacers,
  currentLap,
  totalLaps,
  speed = 0,
  showMinimap = true,
  level,
  playerPosition,
  aiPositions = [],
}: RaceHUDProps) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top HUD */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
        {/* Position */}
        <AnimatePresence mode="wait">
          <PositionBadge key={position} position={position} />
        </AnimatePresence>

        {/* Lap Counter */}
        <LapCounter current={currentLap} total={totalLaps} />
      </div>

      {/* Left Side - Speed */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2">
        <SpeedIndicator speed={speed} />
      </div>

      {/* Bottom Right - Minimap */}
      {showMinimap && level && playerPosition && (
        <div className="absolute bottom-24 right-4">
          <Minimap
            level={level}
            playerPosition={playerPosition}
            aiPositions={aiPositions}
          />
        </div>
      )}

      {/* Position change indicator */}
      <AnimatePresence>
        {position === 1 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-24 left-1/2 -translate-x-1/2"
          >
            <div className="bg-brand-yellow text-gray-800 px-6 py-2 rounded-full font-bold text-lg shadow-lg">
              You are in the lead!
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default RaceHUD;
