'use client';

import { useState, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Scene3D } from './Scene3D';
import { MonsterTruck } from './MonsterTruck';
import { FollowCamera } from './FollowCamera';
import { Star, Home, RotateCcw, Pause, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '@/lib/stores/player-store';
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

interface StadiumGame3DProps {
  onExit?: () => void;
}

// Stadium arena floor
function Arena() {
  return (
    <RigidBody type="fixed" colliders={false}>
      {/* Main floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#3d5a3d" roughness={0.9} />
      </mesh>
      <CuboidCollider args={[100, 0.1, 100]} position={[0, -0.1, 0]} />

      {/* Dirt area in center */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[60, 32]} />
        <meshStandardMaterial color="#8B4513" roughness={1} />
      </mesh>
    </RigidBody>
  );
}

// Ramps for jumping
function Ramp({ position, rotation = 0, size = [10, 2, 6] }: {
  position: [number, number, number];
  rotation?: number;
  size?: [number, number, number];
}) {
  return (
    <RigidBody type="fixed" position={position} rotation={[0, rotation, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color="#8B4513" roughness={0.8} />
      </mesh>
      {/* Ramp surface */}
      <mesh position={[0, size[1] / 2 + 0.1, -size[2] / 4]} rotation={[-0.3, 0, 0]}>
        <boxGeometry args={[size[0], 0.2, size[2] * 0.7]} />
        <meshStandardMaterial color="#654321" roughness={0.7} />
      </mesh>
    </RigidBody>
  );
}

// Collectible star
function CollectibleStar({ position, collected, onCollect }: {
  position: [number, number, number];
  collected: boolean;
  onCollect: () => void;
}) {
  if (collected) return null;

  return (
    <group position={position}>
      {/* Star shape using simple geometry */}
      <mesh rotation={[0, 0, 0]}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color="#FFD700"
          emissive="#FFD700"
          emissiveIntensity={0.5}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      {/* Glow effect */}
      <pointLight color="#FFD700" intensity={2} distance={5} />
    </group>
  );
}

// Stadium walls
function StadiumWalls() {
  const wallHeight = 8;
  const wallThickness = 2;
  const arenaSize = 80;

  return (
    <>
      {/* North wall */}
      <RigidBody type="fixed" position={[0, wallHeight / 2, -arenaSize]}>
        <mesh castShadow>
          <boxGeometry args={[arenaSize * 2, wallHeight, wallThickness]} />
          <meshStandardMaterial color="#4a4a4a" />
        </mesh>
      </RigidBody>
      {/* South wall */}
      <RigidBody type="fixed" position={[0, wallHeight / 2, arenaSize]}>
        <mesh castShadow>
          <boxGeometry args={[arenaSize * 2, wallHeight, wallThickness]} />
          <meshStandardMaterial color="#4a4a4a" />
        </mesh>
      </RigidBody>
      {/* East wall */}
      <RigidBody type="fixed" position={[arenaSize, wallHeight / 2, 0]}>
        <mesh castShadow>
          <boxGeometry args={[wallThickness, wallHeight, arenaSize * 2]} />
          <meshStandardMaterial color="#4a4a4a" />
        </mesh>
      </RigidBody>
      {/* West wall */}
      <RigidBody type="fixed" position={[-arenaSize, wallHeight / 2, 0]}>
        <mesh castShadow>
          <boxGeometry args={[wallThickness, wallHeight, arenaSize * 2]} />
          <meshStandardMaterial color="#4a4a4a" />
        </mesh>
      </RigidBody>
    </>
  );
}

// HUD for stadium mode
function StadiumHUD({
  stars,
  totalStars,
  time,
  isPaused,
  onPause,
  onResume,
  onRestart,
  onExit,
}: {
  stars: number;
  totalStars: number;
  time: number;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onRestart: () => void;
  onExit: () => void;
}) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Top HUD */}
      <div className="fixed top-20 left-4 right-4 flex justify-between items-start z-40 pointer-events-none">
        {/* Stars collected */}
        <div className="bg-black/50 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-2">
          <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
          <span className="text-xl font-bold text-white">{stars}/{totalStars}</span>
        </div>

        {/* Timer */}
        <div className="bg-black/50 backdrop-blur-sm rounded-xl px-4 py-2">
          <span className="text-xl font-mono font-bold text-white">{formatTime(time)}</span>
        </div>

        {/* Pause button */}
        <button
          onClick={onPause}
          className="pointer-events-auto bg-black/50 backdrop-blur-sm rounded-xl p-3 hover:bg-black/70 transition-colors"
        >
          <Pause className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Pause menu */}
      <AnimatePresence>
        {isPaused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 shadow-2xl max-w-sm w-full mx-4"
            >
              <h2 className="text-3xl font-bold text-white text-center mb-6">Paused</h2>
              <div className="space-y-3">
                <button
                  onClick={onResume}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl py-4 font-bold text-lg flex items-center justify-center gap-2"
                >
                  <Play className="w-6 h-6" />
                  Resume
                </button>
                <button
                  onClick={onRestart}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl py-4 font-bold text-lg flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-6 h-6" />
                  Restart
                </button>
                <button
                  onClick={onExit}
                  className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl py-4 font-bold text-lg flex items-center justify-center gap-2"
                >
                  <Home className="w-6 h-6" />
                  Exit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function StadiumGame3D({ onExit }: StadiumGame3DProps) {
  // Read player's selected truck from store
  const selectedTruckId = usePlayerStore((s) => s.selectedTruck);
  const truckData = getTruckById(selectedTruckId);
  const playerTruckColor = truckData?.color ?? '#FF6B6B';
  const playerTruckStyle = TRUCK_STYLE_MAP[selectedTruckId] ?? 'classic';

  const [isPaused, setIsPaused] = useState(false);
  const [time, setTime] = useState(0);
  const [starsCollected, setStarsCollected] = useState(0);
  const [collectedStars, setCollectedStars] = useState<Set<number>>(new Set());

  const [truckPosition, setTruckPosition] = useState(new THREE.Vector3(0, 2, 0));
  const [truckRotation, setTruckRotation] = useState(new THREE.Euler(0, 0, 0));

  const [inputState, setInputState] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
    brake: false,
    boost: false,
  });

  // Star positions in the arena
  const starPositions: [number, number, number][] = [
    [20, 3, 0],
    [-20, 3, 0],
    [0, 3, 20],
    [0, 3, -20],
    [30, 5, 30],
  ];

  // Timer
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setTime((t) => t + 0.1);
    }, 100);
    return () => clearInterval(timer);
  }, [isPaused]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPaused) return;
      switch (e.key.toLowerCase()) {
        case ' ':
          setInputState((prev) => ({ ...prev, forward: true }));
          e.preventDefault(); // Prevent page scroll
          break;
        case 'arrowdown':
          setInputState((prev) => ({ ...prev, backward: true }));
          e.preventDefault();
          break;
        case 'arrowleft':
          setInputState((prev) => ({ ...prev, left: true }));
          e.preventDefault();
          break;
        case 'arrowright':
          setInputState((prev) => ({ ...prev, right: true }));
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
          setIsPaused(true);
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case ' ':
          setInputState((prev) => ({ ...prev, forward: false }));
          break;
        case 'arrowdown':
          setInputState((prev) => ({ ...prev, backward: false }));
          break;
        case 'arrowleft':
          setInputState((prev) => ({ ...prev, left: false }));
          break;
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
  }, [isPaused]);

  const handlePositionUpdate = useCallback((pos: THREE.Vector3, rot: THREE.Euler) => {
    setTruckPosition(pos);
    setTruckRotation(rot);

    // Check star collection
    starPositions.forEach((starPos, index) => {
      if (collectedStars.has(index)) return;
      const dist = Math.sqrt(
        Math.pow(pos.x - starPos[0], 2) +
        Math.pow(pos.z - starPos[2], 2)
      );
      if (dist < 5) {
        setCollectedStars((prev) => new Set([...prev, index]));
        setStarsCollected((prev) => prev + 1);
      }
    });
  }, [collectedStars, starPositions]);

  const handleRestart = () => {
    setTime(0);
    setStarsCollected(0);
    setCollectedStars(new Set());
    setIsPaused(false);
    setTruckPosition(new THREE.Vector3(0, 2, 0));
    setTruckRotation(new THREE.Euler(0, 0, 0));
  };

  return (
    <div className="w-full h-screen relative">
      <Scene3D showSky debug={false}>
        {/* Arena */}
        <Arena />
        <StadiumWalls />

        {/* Ramps */}
        <Ramp position={[25, 0, 0]} rotation={0} />
        <Ramp position={[-25, 0, 0]} rotation={Math.PI} />
        <Ramp position={[0, 0, 25]} rotation={Math.PI / 2} />
        <Ramp position={[0, 0, -25]} rotation={-Math.PI / 2} />

        {/* Collectible stars */}
        {starPositions.map((pos, index) => (
          <CollectibleStar
            key={index}
            position={pos}
            collected={collectedStars.has(index)}
            onCollect={() => {}}
          />
        ))}

        {/* Player truck - uses selected truck from store */}
        <MonsterTruck
          position={[0, 2, 0]}
          rotation={[0, 0, 0]}
          color={playerTruckColor}
          truckStyle={playerTruckStyle as 'flames' | 'shark' | 'classic' | 'dragon' | 'stars'}
          inputState={isPaused ? undefined : inputState}
          onPositionUpdate={handlePositionUpdate}
          isPlayer
        />

        {/* Classic racing game third-person camera */}
        <FollowCamera
          target={truckPosition}
          targetRotation={truckRotation}
          offset={new THREE.Vector3(0, 5, -12)}
          lookAhead={15}
          smoothness={0.12}
        />
      </Scene3D>

      {/* HUD */}
      <StadiumHUD
        stars={starsCollected}
        totalStars={starPositions.length}
        time={time}
        isPaused={isPaused}
        onPause={() => setIsPaused(true)}
        onResume={() => setIsPaused(false)}
        onRestart={handleRestart}
        onExit={onExit || (() => {})}
      />

      {/* Control hints */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm rounded-xl px-6 py-3 z-40">
        <p className="text-white/80 text-sm text-center">
          <span className="font-bold text-white">Controls:</span> Space = Gas, ←/→ = Steer, ↓ = Reverse, B = Brake, Shift = Boost
        </p>
      </div>
    </div>
  );
}

export default StadiumGame3D;
