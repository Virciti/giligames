'use client';

import { useRef, useEffect, useCallback } from 'react';
import { GameLoop } from '@/lib/game/GameLoop';
import { SceneManager } from '@/lib/game/SceneManager';
import { InputController } from '@/lib/game/InputController';
import { useGameStore } from '@/lib/stores';
import { stadiumLevels } from '@/content/levels';
import type { StadiumLevel } from '@/content/types';
import type { InputState } from '@/lib/game/types';

// ============================================================
// Types
// ============================================================

export interface StadiumCanvasProps {
  levelId: string;
  onComplete: (stars: number, score: number) => void;
  onExit: () => void;
  onStarCollected?: (count: number) => void;
  onScoreUpdate?: (score: number) => void;
  onTimeUpdate?: (time: number) => void;
}

export interface StadiumSceneCallbacks {
  onComplete: (stars: number, score: number) => void;
  onStarCollected: (count: number) => void;
  onScoreUpdate: (score: number) => void;
  onTimeUpdate: (time: number) => void;
}

// ============================================================
// Placeholder Scene Implementation
// Until StadiumScene is fully implemented
// ============================================================

function createPlaceholderStadiumScene(
  levelConfig: StadiumLevel['config'],
  callbacks: StadiumSceneCallbacks
) {
  let ctx: CanvasRenderingContext2D | null = null;
  let canvasWidth = 0;
  let canvasHeight = 0;

  // Game state
  let truckX = 100;
  let truckY = levelConfig.groundY - 40;
  let velocityX = 0;
  let velocityY = 0;
  let isGrounded = true;
  let starsCollected = 0;
  let score = 0;
  let elapsedTime = 0;

  // Physics constants
  const gravity = 1200;
  const moveSpeed = 300;
  const jumpForce = -500;
  const friction = 0.85;

  // Star collection tracking
  const collectedStars: Set<number> = new Set();

  return {
    id: 'stadium',

    init(config?: Record<string, unknown>) {
      // Reset game state
      truckX = 100;
      truckY = levelConfig.groundY - 40;
      velocityX = 0;
      velocityY = 0;
      isGrounded = true;
      starsCollected = 0;
      score = 0;
      elapsedTime = 0;
      collectedStars.clear();

      // Get canvas dimensions from config if provided
      if (config?.ctx) {
        ctx = config.ctx as CanvasRenderingContext2D;
        canvasWidth = ctx.canvas.width;
        canvasHeight = ctx.canvas.height;
      }
    },

    update(deltaTime: number, input: InputState) {
      elapsedTime += deltaTime;
      callbacks.onTimeUpdate(Math.floor(elapsedTime));

      // Horizontal movement
      if (input.left) {
        velocityX = -moveSpeed;
      } else if (input.right) {
        velocityX = moveSpeed;
      } else {
        velocityX *= friction;
      }

      // Jump
      if (input.jump && isGrounded) {
        velocityY = jumpForce;
        isGrounded = false;
      }

      // Apply gravity
      if (!isGrounded) {
        velocityY += gravity * deltaTime;
      }

      // Update position
      truckX += velocityX * deltaTime;
      truckY += velocityY * deltaTime;

      // Ground collision
      if (truckY >= levelConfig.groundY - 40) {
        truckY = levelConfig.groundY - 40;
        velocityY = 0;
        isGrounded = true;
      }

      // World bounds
      truckX = Math.max(0, Math.min(levelConfig.width - 60, truckX));

      // Platform collisions
      for (const platform of levelConfig.platforms) {
        if (
          truckX + 60 > platform.x &&
          truckX < platform.x + platform.width &&
          truckY + 40 > platform.y &&
          truckY + 40 < platform.y + platform.height + velocityY * deltaTime &&
          velocityY > 0
        ) {
          truckY = platform.y - 40;
          velocityY = 0;
          isGrounded = true;
        }
      }

      // Star collection
      levelConfig.starPositions.forEach((star, index) => {
        if (collectedStars.has(index)) return;

        const dx = truckX + 30 - star.x;
        const dy = truckY + 20 - star.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 40) {
          collectedStars.add(index);
          starsCollected++;
          score += 100;
          callbacks.onStarCollected(starsCollected);
          callbacks.onScoreUpdate(score);
        }
      });

      // Check level completion
      if (starsCollected >= levelConfig.starPositions.length) {
        const earnedStars = Math.min(3, Math.floor(starsCollected / 2) + 1);
        callbacks.onComplete(earnedStars, score);
      }
    },

    render(renderCtx: CanvasRenderingContext2D) {
      ctx = renderCtx;
      canvasWidth = ctx.canvas.width;
      canvasHeight = ctx.canvas.height;

      // Clear canvas
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Calculate camera offset to follow truck
      const cameraX = Math.max(
        0,
        Math.min(
          levelConfig.width - canvasWidth,
          truckX - canvasWidth / 2 + 30
        )
      );

      ctx.save();
      ctx.translate(-cameraX, 0);

      // Draw ground
      ctx.fillStyle = '#4a5568';
      ctx.fillRect(0, levelConfig.groundY, levelConfig.width, canvasHeight - levelConfig.groundY);

      // Draw dirt pattern on ground
      ctx.fillStyle = '#2d3748';
      for (let x = 0; x < levelConfig.width; x += 50) {
        ctx.fillRect(x, levelConfig.groundY, 30, 10);
      }

      // Draw platforms
      ctx.fillStyle = '#718096';
      for (const platform of levelConfig.platforms) {
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        // Platform top highlight
        ctx.fillStyle = '#a0aec0';
        ctx.fillRect(platform.x, platform.y, platform.width, 4);
        ctx.fillStyle = '#718096';
      }

      // Draw ramps
      for (const ramp of levelConfig.ramps) {
        ctx.save();
        ctx.translate(ramp.x + ramp.width / 2, ramp.y + ramp.height / 2);
        ctx.rotate((ramp.angle * Math.PI) / 180);
        ctx.fillStyle = '#805ad5';
        ctx.fillRect(-ramp.width / 2, -ramp.height / 2, ramp.width, ramp.height);
        ctx.restore();
      }

      // Draw obstacles
      for (const obstacle of levelConfig.obstacles) {
        if (obstacle.type === 'box') {
          ctx.fillStyle = '#c53030';
          ctx.fillRect(obstacle.x, obstacle.y, 40, 40);
          // Box detail
          ctx.strokeStyle = '#742a2a';
          ctx.lineWidth = 2;
          ctx.strokeRect(obstacle.x + 5, obstacle.y + 5, 30, 30);
        } else {
          ctx.fillStyle = '#dd6b20';
          ctx.beginPath();
          ctx.ellipse(obstacle.x + 20, obstacle.y + 20, 20, 25, 0, 0, Math.PI * 2);
          ctx.fill();
          // Barrel stripes
          ctx.strokeStyle = '#7b341e';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(obstacle.x + 5, obstacle.y + 10);
          ctx.lineTo(obstacle.x + 35, obstacle.y + 10);
          ctx.moveTo(obstacle.x + 5, obstacle.y + 30);
          ctx.lineTo(obstacle.x + 35, obstacle.y + 30);
          ctx.stroke();
        }
      }

      // Draw stars
      ctx.fillStyle = '#ffd700';
      for (let index = 0; index < levelConfig.starPositions.length; index++) {
        if (collectedStars.has(index)) continue;
        const star = levelConfig.starPositions[index];

        // Draw star shape
        ctx.save();
        ctx.translate(star.x, star.y);
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
          const radius = 15;
          if (i === 0) {
            ctx.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
          } else {
            ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
          }
        }
        ctx.closePath();
        ctx.fill();

        // Star glow effect
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
      }

      // Draw truck (player)
      ctx.fillStyle = '#ff6b6b';
      ctx.fillRect(truckX, truckY, 60, 40);

      // Truck cab
      ctx.fillStyle = '#c53030';
      ctx.fillRect(truckX + 40, truckY - 15, 20, 15);

      // Truck wheels
      ctx.fillStyle = '#1a202c';
      ctx.beginPath();
      ctx.arc(truckX + 15, truckY + 40, 10, 0, Math.PI * 2);
      ctx.arc(truckX + 45, truckY + 40, 10, 0, Math.PI * 2);
      ctx.fill();

      // Wheel rims
      ctx.fillStyle = '#718096';
      ctx.beginPath();
      ctx.arc(truckX + 15, truckY + 40, 5, 0, Math.PI * 2);
      ctx.arc(truckX + 45, truckY + 40, 5, 0, Math.PI * 2);
      ctx.fill();

      // Truck window
      ctx.fillStyle = '#4299e1';
      ctx.fillRect(truckX + 43, truckY - 12, 14, 10);

      ctx.restore();
    },

    cleanup() {
      ctx = null;
    },

    onPause() {
      // Pause audio, effects, etc.
    },

    onResume() {
      // Resume audio, effects, etc.
    },
  };
}

// ============================================================
// StadiumCanvas Component
// ============================================================

export function StadiumCanvas({
  levelId,
  onComplete,
  onExit,
  onStarCollected,
  onScoreUpdate,
  onTimeUpdate,
}: StadiumCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<GameLoop | null>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const inputControllerRef = useRef<InputController | null>(null);

  const { isPaused, pauseGame, resumeGame, controlLayout, autoAccelerate } = useGameStore();

  // Get level configuration
  const level = stadiumLevels.find((l) => l.id === levelId);

  // Memoized callbacks
  const handleComplete = useCallback(
    (stars: number, score: number) => {
      onComplete(stars, score);
    },
    [onComplete]
  );

  const handleStarCollected = useCallback(
    (count: number) => {
      onStarCollected?.(count);
    },
    [onStarCollected]
  );

  const handleScoreUpdate = useCallback(
    (score: number) => {
      onScoreUpdate?.(score);
    },
    [onScoreUpdate]
  );

  const handleTimeUpdate = useCallback(
    (time: number) => {
      onTimeUpdate?.(time);
    },
    [onTimeUpdate]
  );

  // Initialize game on mount
  useEffect(() => {
    if (!canvasRef.current || !level) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const updateCanvasSize = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };
    updateCanvasSize();

    // Create input controller
    const inputController = new InputController({
      layout: controlLayout,
      autoAccelerate,
      touchAreaSize: 64,
    });
    inputController.attach(canvas);
    inputControllerRef.current = inputController;

    // Create scene manager
    const sceneManager = new SceneManager();
    sceneManagerRef.current = sceneManager;

    // Create and register the stadium scene
    const stadiumScene = createPlaceholderStadiumScene(level.config, {
      onComplete: handleComplete,
      onStarCollected: handleStarCollected,
      onScoreUpdate: handleScoreUpdate,
      onTimeUpdate: handleTimeUpdate,
    });

    sceneManager.register({
      id: 'stadium',
      scene: stadiumScene,
    });

    // Initialize scene
    sceneManager.switchTo('stadium', { ctx });

    // Create game loop
    const gameLoop = new GameLoop({
      update: (deltaTime) => {
        const input = inputController.getState();

        // Handle pause input
        if (input.pause) {
          pauseGame();
          inputController.reset();
        }

        sceneManager.update(deltaTime, input);
      },
      render: () => {
        sceneManager.render(ctx);
      },
    });

    gameLoopRef.current = gameLoop;
    gameLoop.start();

    // Handle window resize
    const handleResize = () => {
      updateCanvasSize();
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      gameLoop.stop();
      inputController.detach();
      sceneManager.destroy();
      gameLoopRef.current = null;
      sceneManagerRef.current = null;
      inputControllerRef.current = null;
    };
  }, [
    level,
    levelId,
    controlLayout,
    autoAccelerate,
    handleComplete,
    handleStarCollected,
    handleScoreUpdate,
    handleTimeUpdate,
    pauseGame,
  ]);

  // Handle pause/resume
  useEffect(() => {
    if (!gameLoopRef.current) return;

    if (isPaused) {
      gameLoopRef.current.pause();
      sceneManagerRef.current?.pause();
    } else {
      gameLoopRef.current.resume();
      sceneManagerRef.current?.resume();
    }
  }, [isPaused]);

  // Update input controller settings when they change
  useEffect(() => {
    if (inputControllerRef.current) {
      inputControllerRef.current.setConfig({
        layout: controlLayout,
        autoAccelerate,
      });
    }
  }, [controlLayout, autoAccelerate]);

  if (!level) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-3xl">
        <p className="text-white text-xl">Level not found: {levelId}</p>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full rounded-3xl touch-none"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}

export default StadiumCanvas;
