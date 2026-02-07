'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Scene3D } from './Scene3D';
import { MonsterTruck } from './MonsterTruck';
import { AITruck } from './AITruck';
import { Track3D } from './Track3D';
import { FollowCamera } from './FollowCamera';
import { RaceHUD3D } from './RaceHUD3D';
import { ItemBox, Collectible, BoostPad, PowerUpType } from './ItemBox';
import { JumpArena } from './JumpArena';
import { LearningCoinManager } from './LearningCoinManager';
import { usePlayerStore } from '@/lib/stores/player-store';
import { useLearningChallengeStore } from '@/lib/stores/learning-game-store';
import { getTruckById } from '@/content/trucks';

// Map truck IDs to 3D visual styles
const TRUCK_STYLE_MAP: Record<string, string> = {
  'truck-red-rocket': 'classic',
  'truck-blue-thunder': 'shark',
  'truck-golden-crusher': 'stars',
  'truck-green-machine': 'dragon',
  'truck-purple-power': 'flames',
  'truck-orange-blaze': 'bull',
  'truck-rainbow-racer': 'stars',
};

interface RaceGame3DProps {
  onExit?: () => void;
}

type GamePhase = 'countdown' | 'racing' | 'paused' | 'finished';
type GameMode = 'race' | 'jump';

// Generate item box positions around the track
function generateItemBoxPositions(trackLength: number, trackWidth: number): [number, number, number][] {
  const positions: [number, number, number][] = [];
  const count = 8;
  const startX = trackLength * 1.3; // start/finish line x
  const exclusionSq = 35 * 35;

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const x = Math.cos(angle) * trackLength;
    const z = Math.sin(angle) * trackWidth;
    const dx = x - startX;
    if (dx * dx + z * z < exclusionSq) continue;
    positions.push([x, 3, z]);
  }

  return positions;
}

// Generate coin positions
function generateCoinPositions(trackLength: number, trackWidth: number): [number, number, number][] {
  const positions: [number, number, number][] = [];
  const count = 24;
  const startX = trackLength * 1.3;
  const exclusionSq = 35 * 35;

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const offset = (i % 3 - 1) * 3; // -3, 0, or 3 offset from center
    const x = Math.cos(angle) * trackLength;
    const z = Math.sin(angle) * trackWidth + offset;
    const dx = x - startX;
    if (dx * dx + z * z < exclusionSq) continue;
    positions.push([x, 1.5, z]);
  }

  return positions;
}

// Generate boost pad positions
function generateBoostPadPositions(trackLength: number, trackWidth: number): { position: [number, number, number]; rotation: number }[] {
  return [
    { position: [trackLength, 0.1, 0], rotation: Math.PI / 2 },
    { position: [-trackLength, 0.1, 0], rotation: -Math.PI / 2 },
    { position: [0, 0.1, trackWidth], rotation: Math.PI },
    { position: [0, 0.1, -trackWidth], rotation: 0 },
  ];
}

// Mode toggle component
function ModeToggle({ mode, onModeChange }: { mode: GameMode; onModeChange: (mode: GameMode) => void }) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex bg-black/70 backdrop-blur-sm rounded-full p-1 border-2 border-white/30">
      <button
        onClick={() => onModeChange('race')}
        className={`px-6 py-2 rounded-full font-bold text-lg transition-all ${
          mode === 'race'
            ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
            : 'text-white/60 hover:text-white'
        }`}
      >
        🏁 RACE
      </button>
      <button
        onClick={() => onModeChange('jump')}
        className={`px-6 py-2 rounded-full font-bold text-lg transition-all ${
          mode === 'jump'
            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
            : 'text-white/60 hover:text-white'
        }`}
      >
        🚀 JUMP
      </button>
    </div>
  );
}

// === BANANA POWER-UP COMPONENTS ===

// Hovering banana pickup - bright yellow curved banana shape
function BananaPickup({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    // Gentle hover bob and spin
    meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2.5 + position[0]) * 0.4;
    meshRef.current.rotation.y += 0.03;
  });

  return (
    <group ref={meshRef} position={position}>
      {/* Banana body - curved using torus segment */}
      <mesh rotation={[0, 0, Math.PI / 4]} castShadow>
        <torusGeometry args={[0.6, 0.22, 8, 16, Math.PI * 0.7]} />
        <meshStandardMaterial
          color="#FFE135"
          emissive="#FFD700"
          emissiveIntensity={0.4}
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>
      {/* Banana tip */}
      <mesh position={[0.35, 0.35, 0]} rotation={[0, 0, 0.8]}>
        <coneGeometry args={[0.1, 0.25, 6]} />
        <meshStandardMaterial color="#8B6914" roughness={0.6} />
      </mesh>
      {/* Banana stem */}
      <mesh position={[-0.35, 0.35, 0]} rotation={[0, 0, -0.8]}>
        <coneGeometry args={[0.08, 0.2, 6]} />
        <meshStandardMaterial color="#6B4226" roughness={0.7} />
      </mesh>
      {/* Glow */}
      <pointLight color="#FFD700" intensity={1.5} distance={6} />
    </group>
  );
}

// Thrown banana projectile that arcs toward an AI truck
function ThrownBananaProjectile({ from, to }: {
  from: THREE.Vector3;
  to: THREE.Vector3;
  startTime: number;
  gameClock: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const elapsedRef = useRef(0);
  const flightDuration = 0.8; // seconds to reach target

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    elapsedRef.current += delta;

    // Arc from player to AI truck
    const progress = Math.min(elapsedRef.current / flightDuration, 1);
    const x = from.x + (to.x - from.x) * progress;
    const z = from.z + (to.z - from.z) * progress;
    // Parabolic arc upward
    const arcHeight = 8 * progress * (1 - progress);
    const y = from.y + arcHeight;

    meshRef.current.position.set(x, y, z);
    meshRef.current.rotation.x += 0.2;
    meshRef.current.rotation.z += 0.15;
  });

  return (
    <mesh ref={meshRef} position={[from.x, from.y, from.z]}>
      <torusGeometry args={[0.5, 0.18, 8, 12, Math.PI * 0.7]} />
      <meshStandardMaterial
        color="#FFE135"
        emissive="#FFAA00"
        emissiveIntensity={0.8}
      />
    </mesh>
  );
}

export function RaceGame3D({ onExit }: RaceGame3DProps) {
  // Read player's selected truck from store
  const selectedTruckId = usePlayerStore((s) => s.selectedTruck);
  const truckData = getTruckById(selectedTruckId);
  const playerTruckColor = truckData?.color ?? '#FF6B6B';
  const playerTruckStyle = TRUCK_STYLE_MAP[selectedTruckId] ?? 'classic';

  const [gameMode, setGameMode] = useState<GameMode>('race');
  const [phase, setPhase] = useState<GamePhase>('countdown');
  const [countdown, setCountdown] = useState<number | null>(3);
  const [raceTime, setRaceTime] = useState(0);
  const [lap, setLap] = useState(1);
  const [position, setPosition] = useState(1);
  const [speed, setSpeed] = useState(0);
  const [coins, setCoins] = useState(0);
  const [currentItem, setCurrentItem] = useState<PowerUpType | null>(null);
  const [trickScore, setTrickScore] = useState(0);

  // Speed level slider (1-10) - Level 5 = 1.0x (default), Level 10 = 2.0x (lightning fast)
  const [speedLevel, setSpeedLevel] = useState(5);
  const speedMultiplier = 0.2 + (speedLevel - 1) * 0.2; // 1=0.2x, 5=1.0x, 10=2.0x

  // Track parameters - longer winding track for more fun
  const trackLength = 120;
  const trackWidth = 70;

  // NASCAR grid starting positions (at the track's easternmost point ~x=156)
  // 2-wide formation like real NASCAR: rows of 2 trucks, staggered
  const RACE_START_ROTATION = 0.4; // Face along track direction at start/finish
  const GRID_POSITIONS: [number, number, number][] = [
    [150, 2, -3],   // P1 - Pole position (player) - front row inside
    [160, 2, -3],   // P2 - Front row outside
    [150, 2, -17],  // P3 - Second row inside
    [160, 2, -17],  // P4 - Second row outside
  ];

  // === BANANA POWER-UP SYSTEM STATE ===
  // Bananas hovering in a line past the start/finish line
  const BANANA_POSITIONS: [number, number, number][] = [
    [-148, 2.5, -8], [-151, 2.5, -5], [-154, 2.5, -2],
    [-157, 2.5, 1],  [-160, 2.5, 4],  [-163, 2.5, 7],
  ];
  const [collectedBananas, setCollectedBananas] = useState<Set<number>>(new Set());
  const [bananaScoreCount, setBananaScoreCount] = useState(0);
  const [aiSpinUntil, setAiSpinUntil] = useState<number[]>([0, 0, 0]);
  const [thrownBanana, setThrownBanana] = useState<{
    from: THREE.Vector3;
    to: THREE.Vector3;
    targetAI: number;
    startTime: number;
  } | null>(null);
  const bananaRespawnTimers = useRef<number[]>(new Array(BANANA_POSITIONS.length).fill(0));
  const aiPositionsRef = useRef<THREE.Vector3[]>([
    new THREE.Vector3(GRID_POSITIONS[1][0], GRID_POSITIONS[1][1], GRID_POSITIONS[1][2]),
    new THREE.Vector3(GRID_POSITIONS[2][0], GRID_POSITIONS[2][1], GRID_POSITIONS[2][2]),
    new THREE.Vector3(GRID_POSITIONS[3][0], GRID_POSITIONS[3][1], GRID_POSITIONS[3][2]),
  ]);
  const gameClockRef = useRef(0);

  // Vehicle state
  const [truckPosition, setTruckPosition] = useState(new THREE.Vector3(GRID_POSITIONS[0][0], GRID_POSITIONS[0][1], GRID_POSITIONS[0][2]));
  const [truckRotation, setTruckRotation] = useState(new THREE.Euler(0, RACE_START_ROTATION, 0));
  const truckPositionRef = useRef(new THREE.Vector3(GRID_POSITIONS[0][0], GRID_POSITIONS[0][1], GRID_POSITIONS[0][2]));

  // Learning challenge state
  const learningStore = useLearningChallengeStore();
  const [scorePopups, setScorePopups] = useState<number[]>([]);

  // AI truck progress tracking for position calculation
  const aiProgressRef = useRef<number[]>([0, 0, 0]);
  const playerProgressRef = useRef(0);

  // Input state
  const [inputState, setInputState] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
    brake: false,
    boost: false,
  });

  // Pre-generate positions
  const itemBoxPositions = generateItemBoxPositions(trackLength, trackWidth);
  const coinPositions = generateCoinPositions(trackLength, trackWidth);
  const boostPadPositions = generateBoostPadPositions(trackLength, trackWidth);

  // Race parameters
  const totalLaps = 3;
  const totalRacers = 4;
  const maxSpeed = 60;

  // Calculate player progress around the track
  const calculateProgress = useCallback((pos: THREE.Vector3) => {
    const angle = Math.atan2(pos.z, pos.x);
    const normalizedAngle = (angle + Math.PI) / (Math.PI * 2);
    return normalizedAngle;
  }, []);

  // Update position ranking based on progress
  useEffect(() => {
    if (phase !== 'racing') return;

    const interval = setInterval(() => {
      const playerProgress = playerProgressRef.current + (lap - 1);
      const allProgress = [
        playerProgress,
        ...aiProgressRef.current.map((p, i) => p + Math.floor(raceTime / 30)) // Simple lap simulation
      ];

      const sortedProgress = [...allProgress].sort((a, b) => b - a);
      const playerPosition = sortedProgress.indexOf(playerProgress) + 1;
      setPosition(playerPosition);
    }, 100);

    return () => clearInterval(interval);
  }, [phase, lap, raceTime]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phase === 'paused' || phase === 'finished') return;

      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          setInputState((prev) => ({ ...prev, forward: true }));
          e.preventDefault();
          break;
        case 's':
        case 'arrowdown':
          setInputState((prev) => ({ ...prev, backward: true }));
          e.preventDefault();
          break;
        case 'a':
        case 'arrowleft':
          setInputState((prev) => ({ ...prev, left: true }));
          e.preventDefault();
          break;
        case 'd':
        case 'arrowright':
          setInputState((prev) => ({ ...prev, right: true }));
          e.preventDefault();
          break;
        case ' ':
          // Space bar: use item if we have one, otherwise accelerate
          if (currentItem) {
            handleUseItem();
          } else {
            setInputState((prev) => ({ ...prev, forward: true }));
          }
          e.preventDefault();
          break;
        case 'b':
          setInputState((prev) => ({ ...prev, brake: true }));
          break;
        case 'shift':
          setInputState((prev) => ({ ...prev, boost: true }));
          break;
        case 'escape':
        case 'p':
          if (phase === 'racing') setPhase('paused');
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
        case ' ':
          setInputState((prev) => ({ ...prev, forward: false }));
          break;
        case 's':
        case 'arrowdown':
          setInputState((prev) => ({ ...prev, backward: false }));
          break;
        case 'a':
        case 'arrowleft':
          setInputState((prev) => ({ ...prev, left: false }));
          break;
        case 'd':
        case 'arrowright':
          setInputState((prev) => ({ ...prev, right: false }));
          break;
        case 'b':
          setInputState((prev) => ({ ...prev, brake: false }));
          break;
        case 'shift':
          setInputState((prev) => ({ ...prev, boost: false }));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [phase, currentItem]);

  // Countdown timer
  useEffect(() => {
    if (phase !== 'countdown') return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 0) {
          clearInterval(timer);
          setPhase('racing');
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  // Race timer
  useEffect(() => {
    if (phase !== 'racing') return;

    const timer = setInterval(() => {
      setRaceTime((prev) => prev + 0.1);
      useLearningChallengeStore.getState().tickTimer(0.1);
    }, 100);

    return () => clearInterval(timer);
  }, [phase]);

  // Handle position update from truck
  const handlePositionUpdate = useCallback((pos: THREE.Vector3, rot: THREE.Euler, spd: number) => {
    setTruckPosition(pos);
    truckPositionRef.current.copy(pos);
    setTruckRotation(rot);
    setSpeed(spd * 1.5);

    // Update player progress
    playerProgressRef.current = calculateProgress(pos);
  }, [calculateProgress]);

  // Handle AI position updates - also track positions for banana targeting
  const handleAIPositionUpdate = useCallback((index: number) => (pos: THREE.Vector3, progress: number) => {
    aiProgressRef.current[index] = progress;
    aiPositionsRef.current[index].copy(pos);
  }, []);

  // Handle item collection
  const handleItemCollect = useCallback((powerUp: PowerUpType) => {
    if (!currentItem) {
      setCurrentItem(powerUp);
    }
  }, [currentItem]);

  // Handle coin collection
  const handleCoinCollect = useCallback(() => {
    setCoins((prev) => prev + 1);
  }, []);

  // Handle using item
  const handleUseItem = useCallback(() => {
    if (!currentItem) return;

    switch (currentItem) {
      case 'boost':
      case 'mushroom':
        setInputState((prev) => ({ ...prev, boost: true }));
        setTimeout(() => setInputState((prev) => ({ ...prev, boost: false })), 1500);
        break;
      case 'star':
        // Temporary invincibility + speed boost
        setInputState((prev) => ({ ...prev, boost: true }));
        setTimeout(() => setInputState((prev) => ({ ...prev, boost: false })), 3000);
        break;
      default:
        break;
    }

    setCurrentItem(null);
  }, [currentItem]);

  // === LEARNING COIN COLLECTION HANDLERS ===
  const handleLearningCorrectCollect = useCallback(() => {
    const store = useLearningChallengeStore.getState();
    store.collectCorrect(store.currentItemId);
    // Show floating score popup
    setScorePopups((prev) => [...prev.slice(-4), Date.now()]);
    // Clean up old popups after animation
    setTimeout(() => {
      setScorePopups((prev) => prev.slice(1));
    }, 1500);
  }, []);

  const handleLearningIncorrectCollect = useCallback((itemId: string) => {
    useLearningChallengeStore.getState().collectIncorrect(itemId);
  }, []);

  // Start learning challenge on mount and when restarting
  useEffect(() => {
    useLearningChallengeStore.getState().startLearningChallenge();
  }, []);

  // === BANANA COLLECTION & THROW LOGIC ===
  // Check banana proximity and handle collection each frame
  useEffect(() => {
    if (phase !== 'racing' || gameMode !== 'race') return;

    const interval = setInterval(() => {
      const playerPos = truckPosition;
      gameClockRef.current += 0.05;
      const now = gameClockRef.current;

      // Respawn bananas after 8 seconds
      bananaRespawnTimers.current.forEach((timer, i) => {
        if (timer > 0 && now - timer > 8) {
          bananaRespawnTimers.current[i] = 0;
          setCollectedBananas(prev => {
            const next = new Set(prev);
            next.delete(i);
            return next;
          });
        }
      });

      // Check if player drives through any banana
      BANANA_POSITIONS.forEach((bananaPos, i) => {
        if (collectedBananas.has(i)) return;

        const dx = playerPos.x - bananaPos[0];
        const dz = playerPos.z - bananaPos[2];
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < 4) {
          // Collect this banana!
          setCollectedBananas(prev => new Set(prev).add(i));
          setBananaScoreCount(prev => prev + 50);
          bananaRespawnTimers.current[i] = now;

          // Find nearest AI truck ahead to throw banana at
          let closestAI = -1;
          let closestDist = Infinity;
          aiPositionsRef.current.forEach((aiPos, aiIdx) => {
            const d = playerPos.distanceTo(aiPos);
            // Must be ahead (higher progress) or just closest
            if (d < closestDist && d > 5) {
              closestDist = d;
              closestAI = aiIdx;
            }
          });

          if (closestAI >= 0) {
            // Throw banana at that AI truck
            setThrownBanana({
              from: playerPos.clone(),
              to: aiPositionsRef.current[closestAI].clone(),
              targetAI: closestAI,
              startTime: now,
            });

            // The banana hits after ~0.8 seconds - make the AI spin
            const targetAI = closestAI;
            setTimeout(() => {
              // Use performance.now() for cross-context timing with AITruck
              const spinEnd = performance.now() / 1000 + 2.5;
              setAiSpinUntil(prev => {
                const next = [...prev];
                next[targetAI] = spinEnd;
                return next;
              });
              setThrownBanana(null);
            }, 800);
          }
        }
      });
    }, 50);

    return () => clearInterval(interval);
  }, [phase, gameMode, truckPosition, collectedBananas]);

  // Game control handlers
  const handlePause = useCallback(() => {
    if (phase === 'racing') setPhase('paused');
  }, [phase]);

  const handleResume = useCallback(() => {
    setPhase('racing');
  }, []);

  const handleRestart = useCallback(() => {
    setPhase('countdown');
    setCountdown(3);
    setRaceTime(0);
    setLap(1);
    setPosition(1);
    setSpeed(0);
    setCoins(0);
    setCurrentItem(null);
    setTruckPosition(new THREE.Vector3(GRID_POSITIONS[0][0], GRID_POSITIONS[0][1], GRID_POSITIONS[0][2]));
    setTruckRotation(new THREE.Euler(0, RACE_START_ROTATION, 0));
    setInputState({
      forward: false,
      backward: false,
      left: false,
      right: false,
      brake: false,
      boost: false,
    });
    aiProgressRef.current = [0, 0, 0];
    playerProgressRef.current = 0;
    setBananaScoreCount(0);
    setAiSpinUntil([0, 0, 0]);
    setThrownBanana(null);
    setScorePopups([]);
    useLearningChallengeStore.getState().startLearningChallenge();
  }, []);

  const handleExit = useCallback(() => {
    if (onExit) onExit();
  }, [onExit]);

  // Handle mode change
  const handleModeChange = useCallback((mode: GameMode) => {
    setGameMode(mode);
    // Reset position based on mode
    if (mode === 'jump') {
      setTruckPosition(new THREE.Vector3(0, 2, -40)); // Start at bottom of jump arena
      truckPositionRef.current.set(0, 2, -40);
      setTruckRotation(new THREE.Euler(0, 0, 0));
      setPhase('racing'); // Start immediately in jump mode
      setCountdown(null);
    } else {
      setTruckPosition(new THREE.Vector3(GRID_POSITIONS[0][0], GRID_POSITIONS[0][1], GRID_POSITIONS[0][2]));
      truckPositionRef.current.set(GRID_POSITIONS[0][0], GRID_POSITIONS[0][1], GRID_POSITIONS[0][2]);
      setTruckRotation(new THREE.Euler(0, RACE_START_ROTATION, 0));
      setPhase('countdown');
      setCountdown(3);
    }
    setSpeed(0);
    setCoins(0);
    setTrickScore(0);
    setScorePopups([]);
    useLearningChallengeStore.getState().startLearningChallenge();
  }, []);

  const activeInput = phase === 'racing' ? inputState : {
    forward: false,
    backward: false,
    left: false,
    right: false,
    brake: false,
    boost: false,
  };

  const isRacing = phase === 'racing';

  const startPosition: [number, number, number] = gameMode === 'race' ? GRID_POSITIONS[0] : [0, 2, -40];
  const startRotation: [number, number, number] = gameMode === 'race' ? [0, RACE_START_ROTATION, 0] : [0, 0, 0];

  return (
    <div className="w-full h-screen relative">
      {/* Slider thumb styling */}
      <style dangerouslySetInnerHTML={{ __html: `
        .speed-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          border: 3px solid #3b82f6;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
        .speed-slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          border: 3px solid #3b82f6;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
        .speed-slider::-webkit-slider-runnable-track {
          background: transparent;
        }
        .speed-slider::-moz-range-track {
          background: transparent;
        }
      ` }} />

      {/* Mode Toggle - always visible at top */}
      <ModeToggle mode={gameMode} onModeChange={handleModeChange} />

      <Scene3D showSky debug={false} quality="medium">
        {/* RACE MODE: Track and racing elements */}
        {gameMode === 'race' && (
          <>
            <Track3D trackType="kidFriendly" length={trackLength} width={trackWidth} />

            {/* Item Boxes floating on track */}
            {itemBoxPositions.map((pos, i) => (
              <ItemBox
                key={`item-${i}`}
                position={pos}
                onCollect={handleItemCollect}
              />
            ))}

            {/* Boost Pads on track */}
            {boostPadPositions.map((pad, i) => (
              <BoostPad
                key={`boost-${i}`}
                position={pad.position}
                rotation={pad.rotation}
              />
            ))}

            {/* Collectible coins */}
            {coinPositions.map((pos, i) => (
              <Collectible
                key={`coin-${i}`}
                position={pos}
                type="coin"
                onCollect={handleCoinCollect}
              />
            ))}

            {/* === BANANA POWER-UPS === */}
            {/* Line of hovering bananas past the start/finish line */}
            {BANANA_POSITIONS.map((pos, i) => (
              !collectedBananas.has(i) && (
                <BananaPickup key={`banana-${i}`} position={pos} />
              )
            ))}

            {/* Thrown banana projectile flying toward AI truck */}
            {thrownBanana && (
              <ThrownBananaProjectile
                from={thrownBanana.from}
                to={thrownBanana.to}
                startTime={thrownBanana.startTime}
                gameClock={gameClockRef.current}
              />
            )}
          </>
        )}

        {/* JUMP MODE: Arena with ramps and cars */}
        {gameMode === 'jump' && (
          <>
            <JumpArena isActive={true} truckPosition={truckPosition} />

            {/* Extended ground plane for expanded open world - desert sand */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.8, 0]} receiveShadow>
              <planeGeometry args={[800, 800]} />
              <meshStandardMaterial color="#C4956A" roughness={0.98} />
            </mesh>
          </>
        )}

        {/* Player truck - uses selected truck from store */}
        <MonsterTruck
          position={startPosition}
          rotation={startRotation}
          color={playerTruckColor}
          truckStyle={playerTruckStyle as 'flames' | 'shark' | 'classic' | 'dragon' | 'stars'}
          inputState={activeInput}
          onPositionUpdate={handlePositionUpdate}
          isPlayer
          gameMode={gameMode}
          speedMultiplier={speedMultiplier}
        />

        {/* AI Trucks that actually race - only in race mode */}
        {gameMode === 'race' && (
          <>
            <AITruck
              startPosition={GRID_POSITIONS[1]}
              color="#228B22"
              truckStyle="dragon"
              difficulty="easy"
              trackLength={trackLength}
              trackWidth={trackWidth}
              isRacing={isRacing}
              onPositionUpdate={handleAIPositionUpdate(0)}
              spinUntil={aiSpinUntil[0]}
              speedMultiplier={speedMultiplier}
            />
            <AITruck
              startPosition={GRID_POSITIONS[2]}
              color="#FF4500"
              truckStyle="bull"
              difficulty="easy"
              trackLength={trackLength}
              trackWidth={trackWidth}
              isRacing={isRacing}
              onPositionUpdate={handleAIPositionUpdate(1)}
              spinUntil={aiSpinUntil[1]}
              speedMultiplier={speedMultiplier}
            />
            <AITruck
              startPosition={GRID_POSITIONS[3]}
              color="#32CD32"
              truckStyle="flames"
              difficulty="easy"
              trackLength={trackLength}
              trackWidth={trackWidth}
              isRacing={isRacing}
              onPositionUpdate={handleAIPositionUpdate(2)}
              spinUntil={aiSpinUntil[2]}
              speedMultiplier={speedMultiplier}
            />
          </>
        )}

        {/* Learning Coins - renders in both race and jump modes */}
        {learningStore.isLearningActive && raceTime >= 15 && (
          <LearningCoinManager
            gameMode={gameMode}
            trackLength={trackLength}
            trackWidth={trackWidth}
            truckPositionRef={truckPositionRef}
            isActive={phase === 'racing'}
            category={learningStore.category}
            target={learningStore.currentTarget}
            targetAnswer={learningStore.currentAnswer}
            tier={learningStore.tier}
            onCorrectCollect={handleLearningCorrectCollect}
            onIncorrectCollect={handleLearningIncorrectCollect}
          />
        )}

        {/* Camera */}
        <FollowCamera
          target={truckPosition}
          targetRotation={truckRotation}
          offset={new THREE.Vector3(0, 5, -10)}
          lookAhead={12}
        />
      </Scene3D>

      {/* Mario Kart style HUD */}
      <RaceHUD3D
        speed={speed}
        maxSpeed={maxSpeed}
        position={position}
        totalRacers={totalRacers}
        lap={lap}
        totalLaps={totalLaps}
        time={raceTime}
        isPaused={phase === 'paused'}
        isFinished={phase === 'finished'}
        countdown={countdown}
        coins={coins}
        currentItem={currentItem}
        playerX={truckPosition.x}
        playerZ={truckPosition.z}
        onPause={handlePause}
        onResume={handleResume}
        onRestart={handleRestart}
        onExit={handleExit}
        onUseItem={handleUseItem}
        learningActive={learningStore.isLearningActive}
        learningBannerText={learningStore.currentTargetDisplay}
        learningCategory={learningStore.category}
        learningScore={learningStore.learningScore}
        learningStreak={learningStore.streak}
        learningTimer={learningStore.targetChangeTimer}
        learningTimerTotal={learningStore.targetChangeDuration}
        learningCorrectCount={learningStore.correctCount}
        learningTargetCount={5}
        learningScorePopups={scorePopups}
      />

      {/* Banana Score Display */}
      {gameMode === 'race' && bananaScoreCount > 0 && (
        <div className="fixed top-20 right-4 z-40 bg-yellow-500/80 backdrop-blur-sm rounded-xl px-4 py-2 border-2 border-yellow-300">
          <p className="text-white font-bold text-lg flex items-center gap-2">
            <span className="text-2xl">🍌</span> {bananaScoreCount} pts
          </p>
        </div>
      )}

      {/* Speed Level Slider */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-2 bg-black/60 backdrop-blur-sm rounded-2xl px-3 py-4 border border-white/20">
        <span className="text-white font-bold text-xs tracking-wider">SPEED</span>
        <div className="relative h-48 w-8 flex items-center justify-center">
          <input
            type="range"
            min="1"
            max="10"
            value={speedLevel}
            onChange={(e) => setSpeedLevel(Number(e.target.value))}
            className="speed-slider absolute w-48 h-8 appearance-none bg-transparent cursor-pointer"
            style={{
              transform: 'rotate(-90deg)',
              WebkitAppearance: 'none',
              background: 'transparent',
            }}
          />
          {/* Track background */}
          <div className="absolute w-2 h-48 rounded-full overflow-hidden pointer-events-none">
            <div
              className="absolute bottom-0 w-full rounded-full transition-all duration-150"
              style={{
                height: `${((speedLevel - 1) / 9) * 100}%`,
                background: speedLevel <= 3 ? '#22c55e' : speedLevel <= 6 ? '#eab308' : speedLevel <= 8 ? '#f97316' : '#ef4444',
              }}
            />
            <div className="absolute inset-0 bg-white/10" />
          </div>
        </div>
        <span
          className="text-2xl font-black tabular-nums"
          style={{
            color: speedLevel <= 3 ? '#22c55e' : speedLevel <= 6 ? '#eab308' : speedLevel <= 8 ? '#f97316' : '#ef4444',
          }}
        >
          {speedLevel}
        </span>
        <span className="text-white/50 text-[10px]">
          {speedLevel <= 2 ? 'CRUISE' : speedLevel <= 4 ? 'FAST' : speedLevel <= 6 ? 'RACE' : speedLevel <= 8 ? 'TURBO' : 'MAX'}
        </span>
      </div>

      {/* Touch controls for mobile */}
      <div className="fixed bottom-4 left-4 right-4 flex justify-between pointer-events-none z-30 md:hidden">
        <div className="flex gap-2 pointer-events-auto">
          <button
            onTouchStart={() => setInputState((prev) => ({ ...prev, left: true }))}
            onTouchEnd={() => setInputState((prev) => ({ ...prev, left: false }))}
            className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center active:bg-white/40"
          >
            <span className="text-3xl text-white">←</span>
          </button>
          <button
            onTouchStart={() => setInputState((prev) => ({ ...prev, right: true }))}
            onTouchEnd={() => setInputState((prev) => ({ ...prev, right: false }))}
            className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center active:bg-white/40"
          >
            <span className="text-3xl text-white">→</span>
          </button>
        </div>

        <div className="flex gap-2 pointer-events-auto">
          <button
            onTouchStart={() => setInputState((prev) => ({ ...prev, brake: true }))}
            onTouchEnd={() => setInputState((prev) => ({ ...prev, brake: false }))}
            className="w-16 h-16 bg-red-500/50 backdrop-blur-sm rounded-xl flex items-center justify-center active:bg-red-500/70"
          >
            <span className="text-2xl text-white font-bold">B</span>
          </button>
          <button
            onTouchStart={() => setInputState((prev) => ({ ...prev, forward: true }))}
            onTouchEnd={() => setInputState((prev) => ({ ...prev, forward: false }))}
            className="w-20 h-16 bg-green-500/50 backdrop-blur-sm rounded-xl flex items-center justify-center active:bg-green-500/70"
          >
            <span className="text-2xl text-white font-bold">GAS</span>
          </button>
        </div>
      </div>

      {/* Control hints */}
      {phase === 'countdown' && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm rounded-xl px-6 py-3 z-40">
          <p className="text-white/80 text-sm text-center">
            <span className="font-bold text-white">Controls:</span> W/↑ = Gas, A/D or ←/→ = Steer, S/↓ = Reverse, B = Brake, Shift = Boost
          </p>
          <p className="text-yellow-400/80 text-sm text-center mt-1">
            <span className="font-bold">Space = Use Item</span> | Collect item boxes for power-ups!
          </p>
        </div>
      )}
    </div>
  );
}

export default RaceGame3D;
