'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import * as THREE from 'three';
import { Scene3D } from './Scene3D';
import { MonsterTruck } from './MonsterTruck';
import { AITruck } from './AITruck';
import { Track3D } from './Track3D';
import { FollowCamera } from './FollowCamera';
import { RaceHUD3D } from './RaceHUD3D';
import { ItemBox, Collectible, BoostPad, PowerUpType } from './ItemBox';
import { JumpArena } from './JumpArena';

interface RaceGame3DProps {
  onExit?: () => void;
}

type GamePhase = 'countdown' | 'racing' | 'paused' | 'finished';
type GameMode = 'race' | 'jump';

// Generate item box positions around the track
function generateItemBoxPositions(trackLength: number, trackWidth: number): [number, number, number][] {
  const positions: [number, number, number][] = [];
  const count = 8;

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const x = Math.cos(angle) * trackLength;
    const z = Math.sin(angle) * trackWidth;
    positions.push([x, 3, z]);
  }

  return positions;
}

// Generate coin positions
function generateCoinPositions(trackLength: number, trackWidth: number): [number, number, number][] {
  const positions: [number, number, number][] = [];
  const count = 24;

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const offset = (i % 3 - 1) * 3; // -3, 0, or 3 offset from center
    const x = Math.cos(angle) * trackLength;
    const z = Math.sin(angle) * trackWidth + offset;
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

export function RaceGame3D({ onExit }: RaceGame3DProps) {
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

  // Track parameters - longer winding track for more fun
  const trackLength = 120;
  const trackWidth = 70;

  // Vehicle state
  const [truckPosition, setTruckPosition] = useState(new THREE.Vector3(100, 2, 0));
  const [truckRotation, setTruckRotation] = useState(new THREE.Euler(0, 0, 0));

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
    }, 100);

    return () => clearInterval(timer);
  }, [phase]);

  // Handle position update from truck
  const handlePositionUpdate = useCallback((pos: THREE.Vector3, rot: THREE.Euler, spd: number) => {
    setTruckPosition(pos);
    setTruckRotation(rot);
    setSpeed(spd * 1.5);

    // Update player progress
    playerProgressRef.current = calculateProgress(pos);
  }, [calculateProgress]);

  // Handle AI position updates
  const handleAIPositionUpdate = useCallback((index: number) => (pos: THREE.Vector3, progress: number) => {
    aiProgressRef.current[index] = progress;
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
    setTruckPosition(new THREE.Vector3(140, 2, 0));
    setTruckRotation(new THREE.Euler(0, 0, 0));
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
      setTruckRotation(new THREE.Euler(0, 0, 0));
      setPhase('racing'); // Start immediately in jump mode
      setCountdown(null);
    } else {
      setTruckPosition(new THREE.Vector3(140, 2, 0));
      setTruckRotation(new THREE.Euler(0, 0, 0));
      setPhase('countdown');
      setCountdown(3);
    }
    setSpeed(0);
    setCoins(0);
    setTrickScore(0);
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

  const startPosition: [number, number, number] = gameMode === 'race' ? [140, 2, 0] : [0, 2, -40];

  return (
    <div className="w-full h-screen relative">
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
          </>
        )}

        {/* JUMP MODE: Arena with ramps and cars */}
        {gameMode === 'jump' && (
          <>
            <JumpArena isActive={true} truckPosition={truckPosition} />

            {/* Simple ground for jump arena */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
              <planeGeometry args={[200, 200]} />
              <meshStandardMaterial color="#3d6b47" roughness={0.95} />
            </mesh>
          </>
        )}

        {/* Player truck - MEGALODON shark theme */}
        <MonsterTruck
          position={startPosition}
          rotation={[0, 0, 0]}
          color="#1E90FF"
          truckStyle="shark"
          inputState={activeInput}
          onPositionUpdate={handlePositionUpdate}
          isPlayer
          gameMode={gameMode}
        />

        {/* AI Trucks that actually race - only in race mode */}
        {gameMode === 'race' && (
          <>
            <AITruck
              startPosition={[140, 2, 8]}
              color="#228B22"
              truckStyle="dragon"
              difficulty="easy"
              trackLength={trackLength}
              trackWidth={trackWidth}
              isRacing={isRacing}
              onPositionUpdate={handleAIPositionUpdate(0)}
            />
            <AITruck
              startPosition={[140, 2, -8]}
              color="#FF4500"
              truckStyle="bull"
              difficulty="easy"
              trackLength={trackLength}
              trackWidth={trackWidth}
              isRacing={isRacing}
              onPositionUpdate={handleAIPositionUpdate(1)}
            />
            <AITruck
              startPosition={[140, 2, 16]}
              color="#32CD32"
              truckStyle="flames"
              difficulty="easy"
              trackLength={trackLength}
              trackWidth={trackWidth}
              isRacing={isRacing}
              onPositionUpdate={handleAIPositionUpdate(2)}
            />
          </>
        )}

        {/* Camera */}
        <FollowCamera
          target={truckPosition}
          targetRotation={truckRotation}
          offset={new THREE.Vector3(0, 4, -8)}
          lookAhead={10}
          smoothness={0.08}
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
      />

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
