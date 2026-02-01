/**
 * GameLoop - Manages the game's update/render cycle using requestAnimationFrame
 */

import type { GameLoopCallbacks, GameLoopConfig } from './types';

export class GameLoop {
  private callbacks: GameLoopCallbacks;
  private config: Required<GameLoopConfig>;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private animationFrameId: number | null = null;
  private lastTimestamp: number = 0;
  private accumulatedTime: number = 0;
  private frameCount: number = 0;
  private fpsAccumulator: number = 0;
  private lastFpsUpdate: number = 0;

  constructor(callbacks: GameLoopCallbacks, config: GameLoopConfig = {}) {
    this.callbacks = callbacks;
    this.config = {
      targetFps: config.targetFps ?? 60,
      maxDeltaTime: config.maxDeltaTime ?? 0.1, // 100ms max delta
    };
  }

  /**
   * Start the game loop
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.isPaused = false;
    this.lastTimestamp = performance.now();
    this.lastFpsUpdate = this.lastTimestamp;
    this.frameCount = 0;
    this.fpsAccumulator = 0;

    this.tick(this.lastTimestamp);
  }

  /**
   * Stop the game loop completely
   */
  stop(): void {
    this.isRunning = false;
    this.isPaused = false;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Pause the game loop (keeps RAF running but skips updates)
   */
  pause(): void {
    if (!this.isRunning || this.isPaused) return;
    this.isPaused = true;
  }

  /**
   * Resume a paused game loop
   */
  resume(): void {
    if (!this.isRunning || !this.isPaused) return;
    this.isPaused = false;
    this.lastTimestamp = performance.now();
  }

  /**
   * Check if the game loop is currently running
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Check if the game loop is paused
   */
  getIsPaused(): boolean {
    return this.isPaused;
  }

  /**
   * Main tick function called by requestAnimationFrame
   */
  private tick = (timestamp: number): void => {
    if (!this.isRunning) return;

    this.animationFrameId = requestAnimationFrame(this.tick);

    // Calculate delta time in seconds
    let deltaTime = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;

    // Clamp delta time to prevent spiral of death
    if (deltaTime > this.config.maxDeltaTime) {
      deltaTime = this.config.maxDeltaTime;
    }

    // Track FPS
    this.frameCount++;
    this.fpsAccumulator += deltaTime;

    // Update FPS display every second
    if (timestamp - this.lastFpsUpdate >= 1000) {
      const fps = this.frameCount / this.fpsAccumulator;
      this.callbacks.onFpsUpdate?.(Math.round(fps));
      this.frameCount = 0;
      this.fpsAccumulator = 0;
      this.lastFpsUpdate = timestamp;
    }

    // Skip update if paused, but still render (for pause screen)
    if (!this.isPaused) {
      this.callbacks.update(deltaTime);
    }

    // Always render (allows pause screen rendering)
    this.callbacks.render();
  };
}

/**
 * Create a simple game loop with just update and render callbacks
 */
export function createGameLoop(
  update: (deltaTime: number) => void,
  render: () => void,
  config?: GameLoopConfig
): GameLoop {
  return new GameLoop({ update, render }, config);
}
