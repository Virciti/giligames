/**
 * RaceScene - Main racing game scene
 *
 * Implements the Scene interface for race mode gameplay.
 * Manages track, player truck, AI trucks, boost pads, lap tracking,
 * countdown, and race finish detection.
 */

import type { Scene, InputState, Vector2D } from '../types';
import { RaceTruck, createRaceTruck } from '../entities/RaceTruck';
import { Track, createTrack, TrackType } from '../entities/Track';
import { BoostPad, createBoostPads } from '../entities/BoostPad';
import { AIController, createAIController, AIDifficulty } from '../ai/AIController';
import { Camera, createCamera } from '../Camera';
import { Vec2 } from '../Physics';

// Race state enum
export type RaceState = 'countdown' | 'racing' | 'finished' | 'paused';

// Race configuration
export interface RaceSceneConfig {
  trackType: TrackType;
  waypoints: Vector2D[];
  trackWidth: number;
  laps: number;
  aiCount: number;
  boostPads: Array<{ x: number; y: number; width: number; height: number }>;
  playerTruck: {
    id: string;
    color: string;
    secondaryColor?: string;
    speed: number;
    handling: number;
  };
  aiDifficulty?: AIDifficulty;
  onRaceComplete?: (results: RaceResult[]) => void;
}

export interface RaceResult {
  truckId: string;
  position: number;
  time: number;
  isPlayer: boolean;
}

// AI truck colors
const AI_COLORS = [
  { color: '#FF6B6B', secondary: '#CC5555' },
  { color: '#4ECDC4', secondary: '#3BA89F' },
  { color: '#FFE66D', secondary: '#CCBB55' },
  { color: '#9B5DE5', secondary: '#7A4AB8' },
  { color: '#FF9F43', secondary: '#CC7F35' },
];

// Countdown timing
const COUNTDOWN_DURATION = 4; // 3, 2, 1, GO!

export class RaceScene implements Scene {
  public readonly id = 'race';

  // Core components
  private track: Track | null = null;
  private playerTruck: RaceTruck | null = null;
  private aiTrucks: RaceTruck[] = [];
  private aiControllers: AIController[] = [];
  private boostPads: BoostPad[] = [];
  private camera: Camera | null = null;

  // Race state
  private raceState: RaceState = 'countdown';
  private countdownTimer: number = COUNTDOWN_DURATION;
  private raceTimer: number = 0;
  private results: RaceResult[] = [];

  // Configuration
  private config: RaceSceneConfig | null = null;
  private onRaceComplete: ((results: RaceResult[]) => void) | null = null;

  // Track previous positions for checkpoint detection
  private prevPositions: Map<string, Vector2D> = new Map();

  // Canvas dimensions (set during render)
  private canvasWidth: number = 800;
  private canvasHeight: number = 600;

  /**
   * Initialize the race scene
   */
  async init(config?: Record<string, unknown>): Promise<void> {
    if (!config) {
      throw new Error('RaceScene requires configuration');
    }
    const raceConfig = config as unknown as RaceSceneConfig;

    this.config = raceConfig;
    this.onRaceComplete = raceConfig.onRaceComplete ?? null;

    // Create track
    this.track = createTrack({
      trackType: raceConfig.trackType,
      waypoints: raceConfig.waypoints,
      trackWidth: raceConfig.trackWidth,
      laps: raceConfig.laps,
    });

    // Create boost pads
    this.boostPads = createBoostPads(raceConfig.boostPads);

    // Get starting positions
    const totalTrucks = 1 + raceConfig.aiCount;
    const startPositions = this.track.getStartPositions(totalTrucks);

    // Create player truck (first position)
    this.playerTruck = createRaceTruck({
      id: raceConfig.playerTruck.id,
      color: raceConfig.playerTruck.color,
      secondaryColor: raceConfig.playerTruck.secondaryColor,
      speed: raceConfig.playerTruck.speed,
      handling: raceConfig.playerTruck.handling,
      position: startPositions[0].position,
      rotation: startPositions[0].rotation,
    });
    this.playerTruck.isPlayer = true;

    // Create AI trucks
    this.aiTrucks = [];
    this.aiControllers = [];
    const difficulty = raceConfig.aiDifficulty ?? 'medium';

    for (let i = 0; i < raceConfig.aiCount; i++) {
      const colorSet = AI_COLORS[i % AI_COLORS.length];
      const startPos = startPositions[i + 1];

      const aiTruck = createRaceTruck({
        id: `ai-truck-${i + 1}`,
        color: colorSet.color,
        secondaryColor: colorSet.secondary,
        speed: 3 + Math.random(), // 3-4 speed
        handling: 3 + Math.random(), // 3-4 handling
        position: startPos.position,
        rotation: startPos.rotation,
      });

      const aiController = createAIController({
        waypoints: raceConfig.waypoints,
        difficulty,
        trackWidth: raceConfig.trackWidth,
      });

      this.aiTrucks.push(aiTruck);
      this.aiControllers.push(aiController);
    }

    // Create camera
    this.camera = createCamera({
      viewportWidth: this.canvasWidth,
      viewportHeight: this.canvasHeight,
      followSpeed: 0.15,
    });

    // Set camera bounds to track bounds
    const trackBounds = this.track.getBounds();
    this.camera.setWorldBounds({
      x: trackBounds.x - 100,
      y: trackBounds.y - 100,
      width: trackBounds.width + 200,
      height: trackBounds.height + 200,
    });

    // Center camera on start
    if (this.playerTruck) {
      this.camera.centerOn(this.playerTruck.state.position);
      this.camera.setTarget(this.playerTruck.state.position);
    }

    // Initialize previous positions
    this.prevPositions.clear();
    this.prevPositions.set(this.playerTruck.id, Vec2.clone(this.playerTruck.state.position));
    for (const truck of this.aiTrucks) {
      this.prevPositions.set(truck.id, Vec2.clone(truck.state.position));
    }

    // Reset race state
    this.raceState = 'countdown';
    this.countdownTimer = COUNTDOWN_DURATION;
    this.raceTimer = 0;
    this.results = [];
  }

  /**
   * Update the race scene
   */
  update(deltaTime: number, input: InputState): void {
    if (this.raceState === 'paused') return;

    // Handle pause input
    if (input.pause) {
      this.onPause?.();
      return;
    }

    // Update based on race state
    switch (this.raceState) {
      case 'countdown':
        this.updateCountdown(deltaTime);
        break;
      case 'racing':
        this.updateRacing(deltaTime, input);
        break;
      case 'finished':
        this.updateFinished(deltaTime);
        break;
    }

    // Update camera
    if (this.camera && this.playerTruck) {
      this.camera.setTarget(this.playerTruck.state.position);
      this.camera.update(deltaTime);
    }

    // Update boost pads
    for (const pad of this.boostPads) {
      pad.update(deltaTime);
    }
  }

  /**
   * Update countdown phase
   */
  private updateCountdown(deltaTime: number): void {
    this.countdownTimer -= deltaTime;

    if (this.countdownTimer <= 0) {
      this.raceState = 'racing';
    }
  }

  /**
   * Update racing phase
   */
  private updateRacing(deltaTime: number, input: InputState): void {
    this.raceTimer += deltaTime;

    // Update player truck
    if (this.playerTruck && !this.playerTruck.state.finished) {
      this.updatePlayerTruck(deltaTime, input);
    }

    // Update AI trucks
    for (let i = 0; i < this.aiTrucks.length; i++) {
      const truck = this.aiTrucks[i];
      const controller = this.aiControllers[i];

      if (!truck.state.finished) {
        controller.update(truck, deltaTime);
        truck.update(deltaTime);
        this.checkTruckProgress(truck);
        this.checkBoostPads(truck);
        this.keepOnTrack(truck);
      }
    }

    // Check race completion
    this.checkRaceCompletion();
  }

  /**
   * Update player truck based on input
   */
  private updatePlayerTruck(deltaTime: number, input: InputState): void {
    if (!this.playerTruck) return;

    // Steering
    let steerDirection = 0;
    if (input.left) steerDirection -= 1;
    if (input.right) steerDirection += 1;

    if (steerDirection !== 0) {
      this.playerTruck.steerDelta(steerDirection, deltaTime);
    }

    // Acceleration/braking
    if (input.up) {
      this.playerTruck.accelerate(deltaTime);
    } else if (input.down) {
      this.playerTruck.brake(deltaTime);
    }

    // Update physics
    this.playerTruck.update(deltaTime);

    // Check progress
    this.checkTruckProgress(this.playerTruck);

    // Check boost pads
    this.checkBoostPads(this.playerTruck);

    // Keep on track
    this.keepOnTrack(this.playerTruck);
  }

  /**
   * Check truck progress (checkpoints and laps)
   */
  private checkTruckProgress(truck: RaceTruck): void {
    if (!this.track || !this.config) return;

    const prevPos = this.prevPositions.get(truck.id);
    if (!prevPos) return;

    // Update checkpoint
    const newCheckpoint = this.track.getCheckpointIndex(
      truck.state.position,
      truck.state.checkpointIndex
    );

    if (newCheckpoint !== truck.state.checkpointIndex) {
      // Check if this is the start/finish checkpoint (0)
      if (newCheckpoint === 0 && truck.state.checkpointIndex > this.config.waypoints.length / 2) {
        // Crossed start/finish line going forward
        if (this.track.crossedStartFinish(prevPos, truck.state.position)) {
          truck.state.lap++;

          // Check if finished
          if (truck.state.lap >= this.config.laps) {
            const position = this.results.length + 1;
            truck.finish(this.raceTimer);
            this.results.push({
              truckId: truck.id,
              position,
              time: this.raceTimer,
              isPlayer: truck.isPlayer,
            });

            // Camera shake on player finish
            if (truck.isPlayer && this.camera) {
              this.camera.shake(5, 0.3);
            }
          }
        }
      }

      truck.state.checkpointIndex = newCheckpoint;
    }

    // Store current position for next frame
    this.prevPositions.set(truck.id, Vec2.clone(truck.state.position));
  }

  /**
   * Check and apply boost pads
   */
  private checkBoostPads(truck: RaceTruck): void {
    const truckBounds = truck.getBounds();

    for (const pad of this.boostPads) {
      if (pad.checkCollision(truckBounds) && pad.tryActivate(truck.id)) {
        truck.applyBoost();

        // Camera shake on boost
        if (truck.isPlayer && this.camera) {
          this.camera.shake(3, 0.15);
        }
      }
    }
  }

  /**
   * Keep truck on track (push back if going off)
   */
  private keepOnTrack(truck: RaceTruck): void {
    if (!this.track) return;

    const distFromCenter = this.track.getDistanceFromCenter(truck.state.position);
    const maxDist = this.track.trackWidth / 2 - 10;

    if (distFromCenter > maxDist) {
      // Slow down when off track
      truck.state.speed *= 0.95;

      // Simple boundary push - find nearest waypoint and push toward center
      let nearestDist = Infinity;
      let nearestWaypoint: Vector2D | null = null;

      for (const wp of this.track.waypoints) {
        const dist = Vec2.distance(truck.state.position, wp);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestWaypoint = wp;
        }
      }

      if (nearestWaypoint) {
        const toCenter = Vec2.normalize(Vec2.subtract(nearestWaypoint, truck.state.position));
        truck.state.position.x += toCenter.x * 2;
        truck.state.position.y += toCenter.y * 2;
      }
    }
  }

  /**
   * Check if race is complete
   */
  private checkRaceCompletion(): void {
    const allTrucks = [this.playerTruck, ...this.aiTrucks].filter(Boolean) as RaceTruck[];
    const finishedCount = allTrucks.filter((t) => t.state.finished).length;

    if (finishedCount === allTrucks.length) {
      this.raceState = 'finished';

      if (this.onRaceComplete) {
        this.onRaceComplete(this.results);
      }
    }
  }

  /**
   * Update finished phase
   */
  private updateFinished(deltaTime: number): void {
    // Could add celebration animations here
    // For now, just keep timer running
    this.raceTimer += deltaTime;
  }

  /**
   * Render the race scene
   */
  render(ctx: CanvasRenderingContext2D): void {
    // Store canvas dimensions
    this.canvasWidth = ctx.canvas.width;
    this.canvasHeight = ctx.canvas.height;

    // Clear canvas
    ctx.fillStyle = '#2D5A27'; // Dark grass color
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    // Apply camera transform
    if (this.camera) {
      this.camera.applyTransform(ctx);
    }

    // Render track
    if (this.track) {
      this.track.render(ctx);
    }

    // Render boost pads
    for (const pad of this.boostPads) {
      pad.render(ctx);
    }

    // Render AI trucks
    for (const truck of this.aiTrucks) {
      truck.render(ctx);
    }

    // Render player truck (last so it's on top)
    if (this.playerTruck) {
      this.playerTruck.render(ctx);
    }

    // Restore camera transform
    if (this.camera) {
      this.camera.restoreTransform(ctx);
    }

    // Render HUD (not affected by camera)
    this.renderHUD(ctx);
  }

  /**
   * Render heads-up display
   */
  private renderHUD(ctx: CanvasRenderingContext2D): void {
    const padding = 20;

    // Countdown overlay
    if (this.raceState === 'countdown') {
      this.renderCountdown(ctx);
    }

    // Position indicator
    this.renderPositionIndicator(ctx, padding, padding);

    // Lap counter
    this.renderLapCounter(ctx, this.canvasWidth - padding, padding);

    // Race timer
    this.renderTimer(ctx, this.canvasWidth / 2, padding);

    // Finish overlay
    if (this.raceState === 'finished') {
      this.renderFinishOverlay(ctx);
    }
  }

  /**
   * Render countdown
   */
  private renderCountdown(ctx: CanvasRenderingContext2D): void {
    const countValue = Math.ceil(this.countdownTimer);
    let text = String(countValue);
    let color = '#FFFFFF';

    if (countValue <= 0) {
      text = 'GO!';
      color = '#00FF00';
    } else if (countValue === 1) {
      color = '#FF0000';
    } else if (countValue === 2) {
      color = '#FFFF00';
    } else if (countValue === 3) {
      color = '#00FF00';
    }

    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    // Countdown text
    ctx.fillStyle = color;
    ctx.font = 'bold 120px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 10;
    ctx.fillText(text, this.canvasWidth / 2, this.canvasHeight / 2);
    ctx.shadowBlur = 0;
  }

  /**
   * Render position indicator
   */
  private renderPositionIndicator(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const position = this.getCurrentPosition();
    const total = 1 + this.aiTrucks.length;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.beginPath();
    ctx.roundRect(x, y, 80, 50, 8);
    ctx.fill();

    // Position number
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(String(position), x + 10, y + 8);

    // Ordinal suffix
    const suffix = this.getOrdinalSuffix(position);
    ctx.font = 'bold 14px Arial';
    ctx.fillText(suffix, x + 38, y + 10);

    // Total
    ctx.font = '14px Arial';
    ctx.fillStyle = '#AAAAAA';
    ctx.fillText(`/ ${total}`, x + 10, y + 32);
  }

  /**
   * Render lap counter
   */
  private renderLapCounter(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    if (!this.playerTruck || !this.config) return;

    const currentLap = Math.min(this.playerTruck.state.lap + 1, this.config.laps);
    const totalLaps = this.config.laps;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.beginPath();
    ctx.roundRect(x - 90, y, 90, 50, 8);
    ctx.fill();

    // Lap text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText('LAP', x - 10, y + 5);

    // Lap numbers
    ctx.font = 'bold 22px Arial';
    ctx.fillText(`${currentLap}/${totalLaps}`, x - 10, y + 22);
  }

  /**
   * Render race timer
   */
  private renderTimer(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const minutes = Math.floor(this.raceTimer / 60);
    const seconds = Math.floor(this.raceTimer % 60);
    const ms = Math.floor((this.raceTimer * 1000) % 1000);

    const timeStr = `${minutes}:${String(seconds).padStart(2, '0')}.${String(ms).padStart(3, '0').slice(0, 2)}`;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.beginPath();
    ctx.roundRect(x - 60, y, 120, 35, 8);
    ctx.fill();

    // Time text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(timeStr, x, y + 8);
  }

  /**
   * Render finish overlay
   */
  private renderFinishOverlay(ctx: CanvasRenderingContext2D): void {
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    // Find player result
    const playerResult = this.results.find((r) => r.isPlayer);
    const position = playerResult?.position ?? 0;

    // Position text
    let positionText = `${position}${this.getOrdinalSuffix(position)} PLACE!`;
    let color = '#FFFFFF';

    if (position === 1) {
      positionText = 'YOU WIN!';
      color = '#FFD700';
    } else if (position === 2) {
      color = '#C0C0C0';
    } else if (position === 3) {
      color = '#CD7F32';
    }

    ctx.fillStyle = color;
    ctx.font = 'bold 60px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 10;
    ctx.fillText(positionText, this.canvasWidth / 2, this.canvasHeight / 2 - 40);

    // Time
    if (playerResult) {
      const minutes = Math.floor(playerResult.time / 60);
      const seconds = Math.floor(playerResult.time % 60);
      const ms = Math.floor((playerResult.time * 1000) % 1000);
      const timeStr = `Time: ${minutes}:${String(seconds).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '24px Arial';
      ctx.fillText(timeStr, this.canvasWidth / 2, this.canvasHeight / 2 + 20);
    }

    ctx.shadowBlur = 0;
  }

  /**
   * Get current race position for player
   */
  private getCurrentPosition(): number {
    if (!this.playerTruck || !this.config) return 1;

    const allTrucks = [this.playerTruck, ...this.aiTrucks];

    // Sort by lap, then checkpoint, then distance to next checkpoint
    const sorted = allTrucks.sort((a, b) => {
      // First by lap (descending)
      if (a.state.lap !== b.state.lap) {
        return b.state.lap - a.state.lap;
      }

      // Then by checkpoint (descending)
      if (a.state.checkpointIndex !== b.state.checkpointIndex) {
        return b.state.checkpointIndex - a.state.checkpointIndex;
      }

      // Then by distance to next checkpoint (ascending - closer is better)
      if (this.track) {
        const nextA = (a.state.checkpointIndex + 1) % this.config!.waypoints.length;
        const nextB = (b.state.checkpointIndex + 1) % this.config!.waypoints.length;
        const distA = Vec2.distance(a.state.position, this.config!.waypoints[nextA]);
        const distB = Vec2.distance(b.state.position, this.config!.waypoints[nextB]);
        return distA - distB;
      }

      return 0;
    });

    return sorted.findIndex((t) => t.id === this.playerTruck!.id) + 1;
  }

  /**
   * Get ordinal suffix (st, nd, rd, th)
   */
  private getOrdinalSuffix(n: number): string {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  }

  /**
   * Cleanup the scene
   */
  cleanup(): void {
    this.track = null;
    this.playerTruck = null;
    this.aiTrucks = [];
    this.aiControllers = [];
    this.boostPads = [];
    this.camera = null;
    this.prevPositions.clear();
    this.results = [];
    this.config = null;
    this.onRaceComplete = null;
  }

  /**
   * Pause the race
   */
  onPause(): void {
    if (this.raceState === 'racing') {
      this.raceState = 'paused';
    }
  }

  /**
   * Resume the race
   */
  onResume(): void {
    if (this.raceState === 'paused') {
      this.raceState = 'racing';
    }
  }

  /**
   * Get current race state
   */
  getRaceState(): RaceState {
    return this.raceState;
  }

  /**
   * Get race results
   */
  getResults(): RaceResult[] {
    return [...this.results];
  }

  /**
   * Get race timer
   */
  getRaceTime(): number {
    return this.raceTimer;
  }
}

/**
 * Create a new RaceScene instance
 */
export function createRaceScene(): RaceScene {
  return new RaceScene();
}
