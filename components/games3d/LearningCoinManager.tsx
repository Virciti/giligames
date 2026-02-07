'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { LearningCoin3D } from './LearningCoin3D';
import { type LearningCategory, getDistractors } from '@/lib/stores/learning-game-store';

// ============================================================
// Types
// ============================================================

interface CoinData {
  position: [number, number, number];
  displayText: string;
  isCorrect: boolean;
  isCollected: boolean;
  respawnAt: number; // timestamp for respawn, 0 = active
  phaseOffset: number;
}

interface LearningCoinManagerProps {
  gameMode: 'race' | 'jump';
  trackLength: number;
  trackWidth: number;
  truckPositionRef: React.MutableRefObject<THREE.Vector3>;
  isActive: boolean;
  category: LearningCategory;
  target: string;
  targetAnswer: number | null;
  tier: number;
  onCorrectCollect: (itemId: string) => void;
  onIncorrectCollect: (itemId: string) => void;
}

// ============================================================
// Constants
// ============================================================

const COLLECTION_RADIUS_SQ = 25; // 5 units radius, squared
const RACE_COIN_COUNT = 16;
const JUMP_COIN_COUNT = 12;
const CORRECT_RATIO = 0.3;
const RESPAWN_DELAY = 8; // seconds

// ============================================================
// Position Generation
// ============================================================

function generateRaceCoinPositions(
  trackLength: number,
  _trackWidth: number,
  count: number
): [number, number, number][] {
  const positions: [number, number, number][] = [];
  const startFinishX = trackLength * 1.3; // 156

  // Cluster all coins near the start/finish straight in a grid pattern.
  // Players complete their first lap on a clean track, then find coins here.
  const cols = 4;
  const rows = Math.ceil(count / cols);

  for (let row = 0; row < rows && positions.length < count; row++) {
    for (let col = 0; col < cols && positions.length < count; col++) {
      // Spread along the straight: 20 units before start line to 15 units after
      const x = startFinishX - 20 + (col / (cols - 1)) * 35;
      // Spread across road width (road is 28 units wide)
      const z = -10 + (row / (rows - 1)) * 20;
      // Deterministic jitter to avoid a rigid grid look (no Math.random)
      const jitterX = Math.sin(row * 7 + col * 13) * 2;
      const jitterZ = Math.cos(row * 11 + col * 5) * 1.5;

      positions.push([x + jitterX, 2.5, z + jitterZ]);
    }
  }

  return positions;
}

function generateJumpCoinPositions(count: number): [number, number, number][] {
  const positions: [number, number, number][] = [];
  const gridSize = Math.ceil(Math.sqrt(count));

  let placed = 0;
  for (let row = 0; row < gridSize && placed < count; row++) {
    for (let col = 0; col < gridSize && placed < count; col++) {
      const x = (col / (gridSize - 1)) * 260 - 130;
      const z = (row / (gridSize - 1)) * 260 - 130;

      // Skip center area where ramps are
      const dist = Math.sqrt(x * x + z * z);
      if (dist < 30) continue;

      // High up so visible from far away across the arena
      positions.push([x, 8, z]);
      placed++;
    }
  }

  return positions;
}

// ============================================================
// Content Assignment
// ============================================================

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function assignCoinContent(
  positions: [number, number, number][],
  target: string,
  category: LearningCategory,
  tier: number,
  answer: number | null
): CoinData[] {
  const count = positions.length;
  const correctCount = Math.max(3, Math.floor(count * CORRECT_RATIO));
  const distractorCount = count - correctCount;

  const distractorPool = getDistractors(target, category, tier, answer);
  // For math mode, the target on coins is the answer number
  const coinTarget = category === 'math' && answer !== null ? String(answer) : target;

  const coins: CoinData[] = [];

  // Correct coins
  for (let i = 0; i < correctCount; i++) {
    coins.push({
      position: [0, 0, 0], // placeholder, assigned after shuffle
      displayText: coinTarget,
      isCorrect: true,
      isCollected: false,
      respawnAt: 0,
      phaseOffset: Math.random() * Math.PI * 2,
    });
  }

  // Distractor coins
  for (let i = 0; i < distractorCount; i++) {
    const distractorText = distractorPool.length > 0
      ? distractorPool[i % distractorPool.length]
      : String(i + 1);
    coins.push({
      position: [0, 0, 0],
      displayText: distractorText,
      isCorrect: false,
      isCollected: false,
      respawnAt: 0,
      phaseOffset: Math.random() * Math.PI * 2,
    });
  }

  // Shuffle and assign positions
  const shuffled = shuffleArray(coins);
  return shuffled.slice(0, positions.length).map((coin, i) => ({
    ...coin,
    position: positions[i],
  }));
}

// ============================================================
// Component
// ============================================================

export function LearningCoinManager({
  gameMode,
  trackLength,
  trackWidth,
  truckPositionRef,
  isActive,
  category,
  target,
  targetAnswer,
  tier,
  onCorrectCollect,
  onIncorrectCollect,
}: LearningCoinManagerProps) {
  // Generate positions based on game mode
  const positions = useMemo(() => {
    if (gameMode === 'race') {
      return generateRaceCoinPositions(trackLength, trackWidth, RACE_COIN_COUNT);
    }
    return generateJumpCoinPositions(JUMP_COIN_COUNT);
  }, [gameMode, trackLength, trackWidth]);

  // Track coins state
  const [coins, setCoins] = useState<CoinData[]>([]);
  const gameTimeRef = useRef(0);

  // Generate/regenerate coins when target or positions change
  useEffect(() => {
    const newCoins = assignCoinContent(positions, target, category, tier, targetAnswer);
    setCoins(newCoins);
    gameTimeRef.current = 0;
  }, [positions, target, category, tier, targetAnswer]);

  // Build an item ID for a distractor coin based on what it shows
  const getItemIdForCoin = useCallback((coin: CoinData): string => {
    if (coin.isCorrect) {
      // Use the store's currentItemId via the parent callback
      return '';
    }
    // For distractors, construct an approximate item ID
    switch (category) {
      case 'numbers': return `number-${coin.displayText}`;
      case 'letters': return `letter-${coin.displayText.toLowerCase()}`;
      case 'words': return `word-${coin.displayText}`;
      case 'math': return `math-distractor-${coin.displayText}`;
      default: return coin.displayText;
    }
  }, [category]);

  // Proximity detection + respawn logic in useFrame
  useFrame((_, delta) => {
    if (!isActive || coins.length === 0) return;

    gameTimeRef.current += delta;
    const now = gameTimeRef.current;
    const playerPos = truckPositionRef.current;

    let changed = false;
    const updatedCoins = coins.map((coin, index) => {
      // Handle respawn
      if (coin.isCollected && coin.respawnAt > 0 && now >= coin.respawnAt) {
        changed = true;
        // Respawn with potentially new content
        const distractorPool = getDistractors(target, category, tier, targetAnswer);
        const coinTarget = category === 'math' && targetAnswer !== null ? String(targetAnswer) : target;

        // Maintain the same correct/distractor assignment
        const newText = coin.isCorrect
          ? coinTarget
          : distractorPool.length > 0
            ? distractorPool[Math.floor(Math.random() * distractorPool.length)]
            : coin.displayText;

        return {
          ...coin,
          displayText: newText,
          isCollected: false,
          respawnAt: 0,
        };
      }

      // Skip if already collected
      if (coin.isCollected) return coin;

      // Proximity check
      const dx = playerPos.x - coin.position[0];
      const dz = playerPos.z - coin.position[2];
      const distSq = dx * dx + dz * dz;

      if (distSq < COLLECTION_RADIUS_SQ) {
        changed = true;

        if (coin.isCorrect) {
          onCorrectCollect(coin.displayText);
        } else {
          const itemId = getItemIdForCoin(coin);
          onIncorrectCollect(itemId);
        }

        return {
          ...coin,
          isCollected: true,
          respawnAt: now + RESPAWN_DELAY,
        };
      }

      return coin;
    });

    if (changed) {
      setCoins(updatedCoins);
    }
  });

  return (
    <group>
      {coins.map((coin, i) => (
        <LearningCoin3D
          key={`learn-coin-${i}`}
          position={coin.position}
          displayText={coin.displayText}
          isCorrect={coin.isCorrect}
          isCollected={coin.isCollected}
          phaseOffset={coin.phaseOffset}
        />
      ))}
    </group>
  );
}
