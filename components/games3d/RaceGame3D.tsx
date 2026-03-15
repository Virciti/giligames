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
import { RaceSFX } from './RaceSFX';
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

// Banana peel lying flat on the track - hazard for the player
function DroppedBananaPeel({ position }: { position: THREE.Vector3 }) {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.5;
  });

  return (
    <group ref={meshRef} position={[position.x, position.y + 0.15, position.z]}>
      {/* Flat banana peel on the ground */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.5, 0.15, 6, 12, Math.PI * 0.7]} />
        <meshStandardMaterial
          color="#FFE135"
          emissive="#FFD700"
          emissiveIntensity={0.3}
          roughness={0.5}
        />
      </mesh>
      {/* Warning glow */}
      <pointLight color="#FFD700" intensity={0.8} distance={4} />
    </group>
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
  const raceTimeRef = useRef(0);
  const [lap, setLap] = useState(1);
  const [position, setPosition] = useState(1);
  const [coins, setCoins] = useState(0);
  const [currentItem, setCurrentItem] = useState<PowerUpType | null>(null);
  const [trickScore, setTrickScore] = useState(0);

  // Speed level slider (1-10) - Level 5 = 1.0x (default), Level 10 = 2.0x (lightning fast)
  const [speedLevel, setSpeedLevel] = useState(5);
  const [speedPulse, setSpeedPulse] = useState(false);
  const prevSpeedLevelRef = useRef(5);
  const speedMultiplier = 0.2 + (speedLevel - 1) * 0.2; // 1=0.2x, 5=1.0x, 10=2.0x

  // Tactile feedback when speed level changes
  const handleSpeedLevelChange = useCallback((newLevel: number) => {
    if (newLevel === prevSpeedLevelRef.current) return;
    prevSpeedLevelRef.current = newLevel;
    setSpeedLevel(newLevel);

    // Visual pulse
    setSpeedPulse(true);
    setTimeout(() => setSpeedPulse(false), 200);

    // Haptic feedback on supported devices
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(newLevel >= 9 ? [30, 20, 30] : 15);
    }
  }, []);

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

  // Dropped banana hazards on the track (from AI trucks)
  const [droppedBananas, setDroppedBananas] = useState<THREE.Vector3[]>([]);
  const [playerSpinUntil, setPlayerSpinUntil] = useState(0);
  const [slipNotification, setSlipNotification] = useState<string | null>(null);
  const lastBananaDropRef = useRef(0);

  // Truck-truck collision state
  const [collisionSlowdown, setCollisionSlowdown] = useState(false);
  const [bumpNotification, setBumpNotification] = useState<string | null>(null);
  const collisionCooldownRef = useRef(0);

  // Vehicle state — refs are the source of truth (updated every frame, no re-renders)
  // Throttled state copies are used only for HUD display (updated every 100ms)
  const truckPositionRef = useRef(new THREE.Vector3(GRID_POSITIONS[0][0], GRID_POSITIONS[0][1], GRID_POSITIONS[0][2]));
  const truckRotationRef = useRef(new THREE.Euler(0, RACE_START_ROTATION, 0));
  const speedRef = useRef(0);
  // Throttled HUD state — updated every 100ms, NOT every frame
  const [hudPosition, setHudPosition] = useState({ x: GRID_POSITIONS[0][0], z: GRID_POSITIONS[0][2] });
  const [hudRotationY, setHudRotationY] = useState(RACE_START_ROTATION);
  const [hudSpeed, setHudSpeed] = useState(0);
  const AI_COLORS = useRef(['#228B22', '#FF4500', '#32CD32']).current;
  const [hudAiPositions, setHudAiPositions] = useState<Array<{ x: number; z: number; color: string }>>([]);

  // Learning challenge state
  const learningStore = useLearningChallengeStore();
  const [scorePopups, setScorePopups] = useState<number[]>([]);

  // AI truck progress tracking for position calculation
  const aiProgressRef = useRef<number[]>([0, 0, 0]);
  const playerProgressRef = useRef(0);
  const prevPlayerProgressRef = useRef(0);

  // Difficulty progression — AI gets harder each lap
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');

  // Lap time tracking for post-race stats
  const [lapTimes, setLapTimes] = useState<number[]>([]);
  const lapStartTimeRef = useRef(0);

  // Lap change notification overlay
  const [lapNotification, setLapNotification] = useState<string | null>(null);

  // Position change notification
  const [positionNotification, setPositionNotification] = useState<{ text: string; direction: 'up' | 'down' } | null>(null);
  const prevPositionRef = useRef(1);

  // SFX one-shot triggers (increment to fire)
  const [sfxCollision, setSfxCollision] = useState(0);
  const [sfxSlip, setSfxSlip] = useState(0);
  const [sfxLap, setSfxLap] = useState(0);
  const [sfxFinish, setSfxFinish] = useState(0);

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
        ...aiProgressRef.current.map((p, i) => p + Math.floor(raceTimeRef.current / 30)) // Simple lap simulation
      ];

      const sortedProgress = [...allProgress].sort((a, b) => b - a);
      const playerPosition = sortedProgress.indexOf(playerProgress) + 1;

      // Detect position change and show notification
      if (playerPosition !== prevPositionRef.current && raceTimeRef.current > 1) {
        const movedUp = playerPosition < prevPositionRef.current;
        const suffix = playerPosition === 1 ? 'st' : playerPosition === 2 ? 'nd' : playerPosition === 3 ? 'rd' : 'th';
        setPositionNotification({
          text: movedUp ? `${playerPosition}${suffix}` : `${playerPosition}${suffix}`,
          direction: movedUp ? 'up' : 'down',
        });
        setTimeout(() => setPositionNotification(null), 1800);
      }
      prevPositionRef.current = playerPosition;

      setPosition(playerPosition);
    }, 100);

    return () => clearInterval(interval);
  }, [phase, lap]);

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

  // Countdown timer — 3, 2, 1, GO! then race starts
  useEffect(() => {
    if (phase !== 'countdown') return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null) {
          clearInterval(timer);
          return null;
        }
        if (prev <= 0) {
          // "GO!" was shown — now start racing and clear overlay after a beat
          clearInterval(timer);
          setPhase('racing');
          setTimeout(() => setCountdown(null), 800);
          return 0; // keep 0 visible briefly
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
      setRaceTime((prev) => {
        const next = prev + 0.1;
        raceTimeRef.current = next;
        return next;
      });
      useLearningChallengeStore.getState().tickTimer(0.1);
    }, 100);

    return () => clearInterval(timer);
  }, [phase]);

  // Throttled HUD state sync — reads refs every 100ms instead of setState per frame
  useEffect(() => {
    if (phase !== 'racing' && phase !== 'countdown') return;

    const hudSync = setInterval(() => {
      const p = truckPositionRef.current;
      setHudPosition({ x: p.x, z: p.z });
      setHudRotationY(truckRotationRef.current.y);
      setHudSpeed(speedRef.current);
      setHudAiPositions(aiPositionsRef.current.map((ap, i) => ({
        x: ap.x, z: ap.z, color: AI_COLORS[i],
      })));
    }, 100);

    return () => clearInterval(hudSync);
  }, [phase]);

  // Handle position update from truck — writes to REFS only (no re-renders)
  // Lap detection fires state updates only on actual lap crossings (rare events)
  const handlePositionUpdate = useCallback((pos: THREE.Vector3, rot: THREE.Euler, spd: number) => {
    truckPositionRef.current.copy(pos);
    truckRotationRef.current.copy(rot);
    speedRef.current = spd * 1.5;

    // Update player progress and detect lap crossing
    const newProgress = calculateProgress(pos);
    const prevProgress = prevPlayerProgressRef.current;

    // Detect finish-line crossing: progress wraps from high (~0.9+) to low (~0.1-)
    if (prevProgress > 0.85 && newProgress < 0.15 && phase === 'racing') {
      // Record completed lap time
      const now = raceTimeRef.current;
      const lapTime = now - lapStartTimeRef.current;
      if (lapTime > 1) { // guard against spurious double-detections
        setLapTimes((prev) => [...prev, lapTime]);
        lapStartTimeRef.current = now;
      }

      setLap((prevLap) => {
        const nextLap = prevLap + 1;
        if (nextLap > totalLaps) {
          // Race complete!
          setPhase('finished');
          setSfxFinish((c) => c + 1);
          return prevLap;
        }
        // Increase AI difficulty each lap
        if (nextLap === 2) setAiDifficulty('medium');
        if (nextLap === 3) setAiDifficulty('hard');
        setSfxLap((c) => c + 1);
        // Show lap notification overlay
        const label = nextLap === totalLaps ? 'FINAL LAP!' : `LAP ${nextLap}`;
        setLapNotification(label);
        setTimeout(() => setLapNotification(null), 2000);
        return nextLap;
      });
    }

    prevPlayerProgressRef.current = newProgress;
    playerProgressRef.current = newProgress;
  }, [calculateProgress, phase, totalLaps]);

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
      const playerPos = truckPositionRef.current;
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

      // === AI BANANA DROP — every ~6 seconds a random AI drops a peel ===
      if (now - lastBananaDropRef.current > 6) {
        lastBananaDropRef.current = now;
        const dropper = Math.floor(Math.random() * 3);
        const aiPos = aiPositionsRef.current[dropper];
        // Drop slightly behind the AI truck
        const dropPos = new THREE.Vector3(
          aiPos.x - (Math.random() - 0.5) * 3,
          aiPos.y,
          aiPos.z - (Math.random() - 0.5) * 3
        );
        setDroppedBananas(prev => {
          // Keep max 5 on track at a time
          const next = prev.length >= 5 ? prev.slice(1) : [...prev];
          next.push(dropPos);
          return next;
        });
      }

      // === PLAYER BANANA SLIP CHECK ===
      if (performance.now() / 1000 > playerSpinUntil) {
        const pPos = truckPositionRef.current;
        setDroppedBananas(prev => {
          const remaining: THREE.Vector3[] = [];
          let slipped = false;
          for (const bp of prev) {
            const dx = pPos.x - bp.x;
            const dz = pPos.z - bp.z;
            const distSq = dx * dx + dz * dz;
            if (!slipped && distSq < 16) { // ~4 unit radius
              slipped = true;
              // Trigger spin
              const spinEnd = performance.now() / 1000 + 2.0;
              setPlayerSpinUntil(spinEnd);
              setSlipNotification('SLIP!');
              setSfxSlip((c) => c + 1);
              setTimeout(() => setSlipNotification(null), 1500);
              // Don't add this banana back — it's consumed
            } else {
              remaining.push(bp);
            }
          }
          return slipped ? remaining : prev;
        });
      }

      // === TRUCK-TRUCK COLLISION CHECK ===
      collisionCooldownRef.current = Math.max(0, collisionCooldownRef.current - 0.05);
      if (collisionCooldownRef.current <= 0) {
        const pPos = truckPositionRef.current;
        for (const aiPos of aiPositionsRef.current) {
          const cdx = pPos.x - aiPos.x;
          const cdz = pPos.z - aiPos.z;
          const distSq = cdx * cdx + cdz * cdz;
          if (distSq < 20) { // ~4.5 unit collision radius
            collisionCooldownRef.current = 1.5; // 1.5s cooldown
            setCollisionSlowdown(true);
            setBumpNotification('BUMP!');
            setSfxCollision((c) => c + 1);
            setTimeout(() => {
              setCollisionSlowdown(false);
              setBumpNotification(null);
            }, 500);
            break;
          }
        }
      }
    }, 50);

    return () => clearInterval(interval);
  }, [phase, gameMode, collectedBananas]);

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
    raceTimeRef.current = 0;
    setLap(1);
    setPosition(1);
    setHudSpeed(0);
    speedRef.current = 0;
    setCoins(0);
    setCurrentItem(null);
    truckPositionRef.current.set(GRID_POSITIONS[0][0], GRID_POSITIONS[0][1], GRID_POSITIONS[0][2]);
    truckRotationRef.current.set(0, RACE_START_ROTATION, 0);
    setHudPosition({ x: GRID_POSITIONS[0][0], z: GRID_POSITIONS[0][2] });
    setHudRotationY(RACE_START_ROTATION);
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
    prevPlayerProgressRef.current = 0;
    setAiDifficulty('easy');
    setLapNotification(null);
    setPositionNotification(null);
    prevPositionRef.current = 1;
    setSfxCollision(0);
    setSfxSlip(0);
    setSfxLap(0);
    setSfxFinish(0);
    setLapTimes([]);
    lapStartTimeRef.current = 0;
    setBananaScoreCount(0);
    setAiSpinUntil([0, 0, 0]);
    setThrownBanana(null);
    setCollisionSlowdown(false);
    setBumpNotification(null);
    collisionCooldownRef.current = 0;
    setDroppedBananas([]);
    setPlayerSpinUntil(0);
    setSlipNotification(null);
    lastBananaDropRef.current = 0;
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
      truckPositionRef.current.set(0, 2, -40);
      truckRotationRef.current.set(0, 0, 0);
      setHudPosition({ x: 0, z: -40 });
      setHudRotationY(0);
      setPhase('racing'); // Start immediately in jump mode
      setCountdown(null);
    } else {
      truckPositionRef.current.set(GRID_POSITIONS[0][0], GRID_POSITIONS[0][1], GRID_POSITIONS[0][2]);
      truckRotationRef.current.set(0, RACE_START_ROTATION, 0);
      setHudPosition({ x: GRID_POSITIONS[0][0], z: GRID_POSITIONS[0][2] });
      setHudRotationY(RACE_START_ROTATION);
      setPhase('countdown');
      setCountdown(3);
    }
    setHudSpeed(0);
    speedRef.current = 0;
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

            {/* Dropped banana peels on the track — hazards for the player */}
            {droppedBananas.map((pos, i) => (
              <DroppedBananaPeel key={`drop-${i}-${pos.x.toFixed(1)}`} position={pos} />
            ))}
          </>
        )}

        {/* JUMP MODE: Arena with ramps and cars */}
        {gameMode === 'jump' && (
          <>
            <JumpArena isActive={true} truckPosition={truckPositionRef.current} />

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
          speedMultiplier={speedMultiplier * (collisionSlowdown ? 0.3 : 1)}
          spinUntil={playerSpinUntil}
        />

        {/* AI Trucks that actually race - only in race mode */}
        {gameMode === 'race' && (
          <>
            <AITruck
              startPosition={GRID_POSITIONS[1]}
              color="#228B22"
              truckStyle="dragon"
              difficulty={aiDifficulty}
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
              difficulty={aiDifficulty}
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
              difficulty={aiDifficulty}
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
          targetRef={truckPositionRef}
          targetRotationRef={truckRotationRef}
          speedRef={speedRef}
          lookAhead={12}
          shakeTrigger={sfxCollision + sfxSlip}
        />
      </Scene3D>

      {/* Procedural racing sound effects */}
      <RaceSFX
        speed={hudSpeed}
        isRacing={phase === 'racing'}
        isBoosting={inputState.boost}
        collisionTrigger={sfxCollision}
        slipTrigger={sfxSlip}
        lapTrigger={sfxLap}
        finishTrigger={sfxFinish}
        countdownBeep={countdown}
      />

      {/* Mario Kart style HUD */}
      <RaceHUD3D
        speed={hudSpeed}
        maxSpeed={maxSpeed}
        position={position}
        totalRacers={totalRacers}
        lap={lap}
        totalLaps={totalLaps}
        time={raceTime}
        bestLapTime={lapTimes.length > 0 ? Math.min(...lapTimes) : undefined}
        lapTimes={lapTimes}
        lapNotification={lapNotification}
        positionNotification={positionNotification}
        isPaused={phase === 'paused'}
        isFinished={phase === 'finished'}
        countdown={countdown}
        coins={coins}
        currentItem={currentItem}
        playerX={hudPosition.x}
        playerZ={hudPosition.z}
        playerRotation={hudRotationY}
        aiPositions={hudAiPositions}
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

      {/* Truck collision bump notification */}
      {bumpNotification && (
        <div className="fixed top-1/3 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="bg-red-500/80 backdrop-blur-sm rounded-2xl px-8 py-3 border-2 border-white/40 animate-bounce">
            <span className="text-3xl font-black text-white" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.5)' }}>
              {bumpNotification}
            </span>
          </div>
        </div>
      )}

      {/* Banana slip notification */}
      {slipNotification && (
        <div className="fixed top-1/3 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="bg-yellow-500/90 backdrop-blur-sm rounded-2xl px-8 py-3 border-2 border-yellow-300/60 animate-bounce">
            <span className="text-3xl font-black text-white" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.5)' }}>
              🍌 {slipNotification}
            </span>
          </div>
        </div>
      )}

      {/* Speed Level Slider — with tactile feedback */}
      <div
        className="fixed right-4 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-2 rounded-2xl px-3 py-4 border transition-all duration-200"
        style={{
          background: speedPulse ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          borderColor: speedPulse
            ? (speedLevel <= 3 ? '#22c55e' : speedLevel <= 6 ? '#eab308' : speedLevel <= 8 ? '#f97316' : '#ef4444')
            : 'rgba(255,255,255,0.2)',
          transform: speedPulse ? 'scale(1.05)' : 'scale(1)',
          boxShadow: speedPulse
            ? `0 0 20px ${speedLevel <= 3 ? '#22c55e40' : speedLevel <= 6 ? '#eab30840' : speedLevel <= 8 ? '#f9731640' : '#ef444440'}`
            : 'none',
        }}
      >
        <span className="text-white font-bold text-xs tracking-wider">SPEED</span>
        <div className="relative h-48 w-8 flex items-center justify-center">
          <input
            type="range"
            min="1"
            max="10"
            value={speedLevel}
            onChange={(e) => handleSpeedLevelChange(Number(e.target.value))}
            className="speed-slider absolute w-48 h-8 appearance-none bg-transparent cursor-pointer"
            style={{
              transform: 'rotate(-90deg)',
              WebkitAppearance: 'none',
              background: 'transparent',
            }}
          />
          {/* Track background with tick marks */}
          <div className="absolute w-2 h-48 rounded-full overflow-hidden pointer-events-none">
            <div
              className="absolute bottom-0 w-full rounded-full"
              style={{
                height: `${((speedLevel - 1) / 9) * 100}%`,
                background: speedLevel <= 3 ? '#22c55e' : speedLevel <= 6 ? '#eab308' : speedLevel <= 8 ? '#f97316' : '#ef4444',
                transition: 'height 0.15s ease-out, background 0.3s',
              }}
            />
            <div className="absolute inset-0 bg-white/10" />
          </div>
          {/* Tick marks — 10 discrete notches */}
          <div className="absolute left-full ml-1 h-48 flex flex-col justify-between pointer-events-none" style={{ paddingTop: 2, paddingBottom: 2 }}>
            {[...Array(10)].map((_, i) => {
              const level = 10 - i; // top = 10, bottom = 1
              const isActive = level <= speedLevel;
              const isZoneBoundary = level === 3 || level === 6 || level === 8;
              return (
                <div
                  key={i}
                  className="flex items-center gap-1"
                >
                  <div
                    className="rounded-full transition-all duration-150"
                    style={{
                      width: isZoneBoundary ? 10 : 6,
                      height: isZoneBoundary ? 3 : 2,
                      backgroundColor: isActive
                        ? (level <= 3 ? '#22c55e' : level <= 6 ? '#eab308' : level <= 8 ? '#f97316' : '#ef4444')
                        : 'rgba(255,255,255,0.15)',
                      boxShadow: isActive && level === speedLevel ? `0 0 6px ${level <= 3 ? '#22c55e' : level <= 6 ? '#eab308' : level <= 8 ? '#f97316' : '#ef4444'}` : 'none',
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
        <span
          className="text-2xl font-black tabular-nums transition-all duration-150"
          style={{
            color: speedLevel <= 3 ? '#22c55e' : speedLevel <= 6 ? '#eab308' : speedLevel <= 8 ? '#f97316' : '#ef4444',
            transform: speedPulse ? 'scale(1.3)' : 'scale(1)',
          }}
        >
          {speedLevel}
        </span>
        <span
          className="text-[10px] font-bold tracking-wider transition-all duration-150"
          style={{
            color: speedPulse
              ? (speedLevel <= 3 ? '#22c55e' : speedLevel <= 6 ? '#eab308' : speedLevel <= 8 ? '#f97316' : '#ef4444')
              : 'rgba(255,255,255,0.5)',
          }}
        >
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
