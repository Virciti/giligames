'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameLoop, InputController, createScene } from '@/lib/game';
import type { Scene, InputState } from '@/lib/game/types';
import type { RaceLevel } from '@/content/types';
import { getLevelById } from '@/content/levels';
import { useGameStore } from '@/lib/stores';

// ============================================================
// Types
// ============================================================

interface RaceCanvasProps {
  levelId: string;
  onComplete: (position: number, laps: number[]) => void;
  inputState?: InputState;
}

interface RaceState {
  playerPosition: { x: number; y: number };
  playerAngle: number;
  playerSpeed: number;
  playerLap: number;
  playerWaypoint: number;
  aiRacers: Array<{
    position: { x: number; y: number };
    angle: number;
    speed: number;
    lap: number;
    waypoint: number;
    color: string;
  }>;
  raceStarted: boolean;
  raceFinished: boolean;
  positions: number[]; // 1st, 2nd, 3rd, 4th order by player index (0 = player)
  lapTimes: number[];
}

// ============================================================
// Racing Constants
// ============================================================

const PLAYER_ACCELERATION = 150;
const PLAYER_MAX_SPEED = 200;
const PLAYER_TURN_SPEED = 2.5;
const PLAYER_FRICTION = 0.98;
const BOOST_MULTIPLIER = 1.5;
const AI_SPEED_VARIANCE = 0.2;

// Colors for AI trucks
const AI_COLORS = ['#4ECDC4', '#7BC74D', '#9B5DE5', '#FF9F43'];

// ============================================================
// RaceScene Implementation
// ============================================================

function createRaceScene(
  level: RaceLevel,
  onStateUpdate: (state: Partial<RaceState>) => void,
  onRaceComplete: (position: number, lapTimes: number[]) => void
): Scene {
  const config = level.config;

  // Initialize race state
  const state: RaceState = {
    playerPosition: { ...config.waypoints[0] },
    playerAngle: Math.atan2(
      config.waypoints[1].y - config.waypoints[0].y,
      config.waypoints[1].x - config.waypoints[0].x
    ),
    playerSpeed: 0,
    playerLap: 1,
    playerWaypoint: 0,
    aiRacers: [],
    raceStarted: false,
    raceFinished: false,
    positions: [],
    lapTimes: [],
  };

  let raceTime = 0;
  let lapStartTime = 0;

  // Initialize AI racers
  for (let i = 0; i < config.aiCount; i++) {
    const offset = (i + 1) * 30;
    state.aiRacers.push({
      position: {
        x: config.waypoints[0].x - offset * Math.cos(state.playerAngle + Math.PI / 2),
        y: config.waypoints[0].y - offset * Math.sin(state.playerAngle + Math.PI / 2),
      },
      angle: state.playerAngle,
      speed: 0,
      lap: 1,
      waypoint: 0,
      color: AI_COLORS[i % AI_COLORS.length],
    });
  }

  // Calculate positions
  function calculatePositions(): number[] {
    const racers = [
      { index: 0, lap: state.playerLap, waypoint: state.playerWaypoint, dist: getDistToNextWaypoint(state.playerPosition, state.playerWaypoint) },
      ...state.aiRacers.map((ai, i) => ({
        index: i + 1,
        lap: ai.lap,
        waypoint: ai.waypoint,
        dist: getDistToNextWaypoint(ai.position, ai.waypoint),
      })),
    ];

    racers.sort((a, b) => {
      if (b.lap !== a.lap) return b.lap - a.lap;
      if (b.waypoint !== a.waypoint) return b.waypoint - a.waypoint;
      return a.dist - b.dist;
    });

    const positions = new Array(racers.length).fill(0);
    racers.forEach((racer, pos) => {
      positions[racer.index] = pos + 1;
    });
    return positions;
  }

  function getDistToNextWaypoint(pos: { x: number; y: number }, currentWaypoint: number): number {
    const nextWaypoint = config.waypoints[(currentWaypoint + 1) % config.waypoints.length];
    return Math.hypot(nextWaypoint.x - pos.x, nextWaypoint.y - pos.y);
  }

  function checkWaypointProgress(
    pos: { x: number; y: number },
    currentWaypoint: number
  ): { newWaypoint: number; crossedFinish: boolean } {
    const nextIndex = (currentWaypoint + 1) % config.waypoints.length;
    const nextWaypoint = config.waypoints[nextIndex];
    const dist = Math.hypot(nextWaypoint.x - pos.x, nextWaypoint.y - pos.y);

    if (dist < config.trackWidth * 0.8) {
      return {
        newWaypoint: nextIndex,
        crossedFinish: nextIndex === 0 && currentWaypoint === config.waypoints.length - 1,
      };
    }
    return { newWaypoint: currentWaypoint, crossedFinish: false };
  }

  function checkBoostPad(pos: { x: number; y: number }): boolean {
    return config.boostPads.some(
      (pad) =>
        pos.x >= pad.x &&
        pos.x <= pad.x + pad.width &&
        pos.y >= pad.y &&
        pos.y <= pad.y + pad.height
    );
  }

  return createScene('race', {
    init() {
      lapStartTime = 0;
      raceTime = 0;
      onStateUpdate({ ...state });
    },

    update(deltaTime: number, input: InputState) {
      if (state.raceFinished) return;
      if (!state.raceStarted) return;

      raceTime += deltaTime;

      // Player controls
      const isAccelerating = input.up || input.jump;
      const isBraking = input.down;
      const isTurningLeft = input.left;
      const isTurningRight = input.right;

      // Apply acceleration
      if (isAccelerating) {
        const boost = checkBoostPad(state.playerPosition) ? BOOST_MULTIPLIER : 1;
        state.playerSpeed = Math.min(
          state.playerSpeed + PLAYER_ACCELERATION * deltaTime * boost,
          PLAYER_MAX_SPEED * boost
        );
      }

      // Apply braking
      if (isBraking) {
        state.playerSpeed = Math.max(0, state.playerSpeed - PLAYER_ACCELERATION * 2 * deltaTime);
      }

      // Apply friction
      state.playerSpeed *= PLAYER_FRICTION;

      // Steering (only when moving)
      if (state.playerSpeed > 10) {
        const turnFactor = Math.min(1, state.playerSpeed / 100);
        if (isTurningLeft) {
          state.playerAngle -= PLAYER_TURN_SPEED * deltaTime * turnFactor;
        }
        if (isTurningRight) {
          state.playerAngle += PLAYER_TURN_SPEED * deltaTime * turnFactor;
        }
      }

      // Update position
      state.playerPosition.x += Math.cos(state.playerAngle) * state.playerSpeed * deltaTime;
      state.playerPosition.y += Math.sin(state.playerAngle) * state.playerSpeed * deltaTime;

      // Check waypoint progress
      const { newWaypoint, crossedFinish } = checkWaypointProgress(
        state.playerPosition,
        state.playerWaypoint
      );
      state.playerWaypoint = newWaypoint;

      if (crossedFinish) {
        const lapTime = raceTime - lapStartTime;
        state.lapTimes.push(lapTime);
        lapStartTime = raceTime;
        state.playerLap++;

        if (state.playerLap > config.laps) {
          state.raceFinished = true;
          state.positions = calculatePositions();
          onRaceComplete(state.positions[0], state.lapTimes);
          return;
        }
      }

      // Update AI racers
      state.aiRacers.forEach((ai, index) => {
        // Simple AI: move towards next waypoint
        const targetWaypoint = config.waypoints[(ai.waypoint + 1) % config.waypoints.length];
        const targetAngle = Math.atan2(
          targetWaypoint.y - ai.position.y,
          targetWaypoint.x - ai.position.x
        );

        // Smooth angle interpolation
        let angleDiff = targetAngle - ai.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        ai.angle += angleDiff * 3 * deltaTime;

        // AI speed (varies slightly)
        const aiSpeedMult = 0.8 + AI_SPEED_VARIANCE * (index / config.aiCount);
        const aiTargetSpeed = PLAYER_MAX_SPEED * aiSpeedMult;
        const boost = checkBoostPad(ai.position) ? BOOST_MULTIPLIER : 1;
        ai.speed = Math.min(ai.speed + PLAYER_ACCELERATION * 0.8 * deltaTime, aiTargetSpeed * boost);
        ai.speed *= PLAYER_FRICTION;

        // Update AI position
        ai.position.x += Math.cos(ai.angle) * ai.speed * deltaTime;
        ai.position.y += Math.sin(ai.angle) * ai.speed * deltaTime;

        // Check AI waypoint progress
        const aiProgress = checkWaypointProgress(ai.position, ai.waypoint);
        ai.waypoint = aiProgress.newWaypoint;
        if (aiProgress.crossedFinish) {
          ai.lap++;
          if (ai.lap > config.laps && !state.raceFinished) {
            state.raceFinished = true;
            state.positions = calculatePositions();
            onRaceComplete(state.positions[0], state.lapTimes);
          }
        }
      });

      // Update positions
      state.positions = calculatePositions();

      onStateUpdate({ ...state });
    },

    render(ctx: CanvasRenderingContext2D) {
      const canvas = ctx.canvas;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw grass background
      ctx.fillStyle = '#7BC74D';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw track
      ctx.strokeStyle = '#666666';
      ctx.lineWidth = config.trackWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      config.waypoints.forEach((wp, i) => {
        if (i === 0) ctx.moveTo(wp.x, wp.y);
        else ctx.lineTo(wp.x, wp.y);
      });
      ctx.closePath();
      ctx.stroke();

      // Draw track center line (dashed)
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.setLineDash([20, 20]);
      ctx.beginPath();
      config.waypoints.forEach((wp, i) => {
        if (i === 0) ctx.moveTo(wp.x, wp.y);
        else ctx.lineTo(wp.x, wp.y);
      });
      ctx.closePath();
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw boost pads
      ctx.fillStyle = '#FFE66D';
      config.boostPads.forEach((pad) => {
        ctx.fillRect(pad.x, pad.y, pad.width, pad.height);
        // Arrow indicator
        ctx.fillStyle = '#FF9F43';
        ctx.beginPath();
        ctx.moveTo(pad.x + pad.width / 2, pad.y + 5);
        ctx.lineTo(pad.x + pad.width - 5, pad.y + pad.height / 2);
        ctx.lineTo(pad.x + pad.width / 2, pad.y + pad.height - 5);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#FFE66D';
      });

      // Draw start/finish line
      const startWp = config.waypoints[0];
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(startWp.x - 30, startWp.y - 5, 60, 10);
      ctx.fillStyle = '#000000';
      for (let i = 0; i < 6; i++) {
        if (i % 2 === 0) {
          ctx.fillRect(startWp.x - 30 + i * 10, startWp.y - 5, 10, 5);
          ctx.fillRect(startWp.x - 30 + i * 10 + 10, startWp.y, 10, 5);
        }
      }

      // Draw AI racers
      state.aiRacers.forEach((ai) => {
        ctx.save();
        ctx.translate(ai.position.x, ai.position.y);
        ctx.rotate(ai.angle);

        // Truck body
        ctx.fillStyle = ai.color;
        ctx.fillRect(-20, -12, 40, 24);

        // Truck cabin
        ctx.fillStyle = '#333333';
        ctx.fillRect(10, -8, 8, 16);

        // Wheels
        ctx.fillStyle = '#222222';
        ctx.fillRect(-18, -15, 10, 6);
        ctx.fillRect(-18, 9, 10, 6);
        ctx.fillRect(8, -15, 10, 6);
        ctx.fillRect(8, 9, 10, 6);

        ctx.restore();
      });

      // Draw player truck
      ctx.save();
      ctx.translate(state.playerPosition.x, state.playerPosition.y);
      ctx.rotate(state.playerAngle);

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(-18, -10, 40, 24);

      // Truck body
      ctx.fillStyle = '#FF6B6B';
      ctx.fillRect(-20, -12, 40, 24);

      // Truck cabin
      ctx.fillStyle = '#333333';
      ctx.fillRect(10, -8, 8, 16);

      // Stripe
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-15, -2, 25, 4);

      // Wheels
      ctx.fillStyle = '#222222';
      ctx.fillRect(-18, -15, 10, 6);
      ctx.fillRect(-18, 9, 10, 6);
      ctx.fillRect(8, -15, 10, 6);
      ctx.fillRect(8, 9, 10, 6);

      ctx.restore();

      // Draw waypoint indicators (debug, can be removed)
      // config.waypoints.forEach((wp, i) => {
      //   ctx.fillStyle = i === state.playerWaypoint ? '#FF0000' : '#FFFFFF';
      //   ctx.beginPath();
      //   ctx.arc(wp.x, wp.y, 5, 0, Math.PI * 2);
      //   ctx.fill();
      // });
    },

    cleanup() {
      // Nothing to clean up
    },
  });
}

// ============================================================
// Component
// ============================================================

export function RaceCanvas({ levelId, onComplete, inputState }: RaceCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<GameLoop | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const inputControllerRef = useRef<InputController | null>(null);

  const [countdown, setCountdown] = useState(3);
  const [isRaceStarted, setIsRaceStarted] = useState(false);

  const { isPaused } = useGameStore();

  // Get level config
  const level = getLevelById(levelId) as RaceLevel | undefined;

  // State update handler - updates are handled by callbacks, not setState
  const handleStateUpdate = useCallback((_state: Partial<RaceState>) => {
    // State updates are handled by the game loop rendering
    // We don't need to trigger React re-renders for every frame
  }, []);

  const handleRaceComplete = useCallback((position: number, lapTimes: number[]) => {
    onComplete(position, lapTimes);
  }, [onComplete]);

  // Initialize game
  useEffect(() => {
    if (!canvasRef.current || !level) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    updateSize();

    // Create scene
    const scene = createRaceScene(level, handleStateUpdate, handleRaceComplete);
    sceneRef.current = scene;
    scene.init();

    // Create input controller
    const inputController = new InputController({
      layout: 'right',
      autoAccelerate: false,
    });
    inputController.attach(canvas);
    inputControllerRef.current = inputController;

    // Create game loop
    const gameLoop = new GameLoop({
      update: (dt) => {
        const input = inputState || inputController.getState();
        scene.update(dt, input);
      },
      render: () => {
        scene.render(ctx);
      },
    });
    gameLoopRef.current = gameLoop;
    gameLoop.start();

    return () => {
      gameLoop.stop();
      inputController.detach();
      scene.cleanup();
    };
  }, [level, handleStateUpdate, handleRaceComplete, inputState]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setTimeout(() => {
      const newCount = countdown - 1;
      setCountdown(newCount);
      if (newCount === 0) {
        setIsRaceStarted(true);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  // Handle pause state
  useEffect(() => {
    if (!gameLoopRef.current) return;

    if (isPaused) {
      gameLoopRef.current.pause();
    } else {
      gameLoopRef.current.resume();
    }
  }, [isPaused]);

  // Update race started state in scene - handled in countdown timer

  if (!level) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-800">
        <p className="text-white text-xl">Level not found</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ touchAction: 'none' }}
      />

      {/* Countdown Overlay */}
      <AnimatePresence>
        {countdown > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 flex items-center justify-center z-10"
          >
            <motion.div
              key={countdown}
              initial={{ scale: 2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: 'spring', damping: 10 }}
              className="text-9xl font-bold text-white drop-shadow-lg"
            >
              {countdown}
            </motion.div>
          </motion.div>
        )}
        {countdown === 0 && !isRaceStarted && (
          <motion.div
            initial={{ scale: 2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', damping: 10 }}
            className="absolute inset-0 flex items-center justify-center z-10"
          >
            <span className="text-6xl font-bold text-brand-green drop-shadow-lg">
              GO!
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default RaceCanvas;
