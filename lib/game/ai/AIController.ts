/**
 * AIController - Waypoint-following AI for race trucks
 *
 * Controls AI trucks in race mode, following waypoints around the track
 * with configurable difficulty that affects precision and mistakes.
 */

import type { Vector2D } from '../types';
import type { RaceTruck } from '../entities/RaceTruck';
import { Vec2 } from '../Physics';

export type AIDifficulty = 'easy' | 'medium' | 'hard';

export interface AIControllerConfig {
  waypoints: Vector2D[];
  difficulty: AIDifficulty;
  trackWidth: number;
}

// Difficulty settings
const DIFFICULTY_SETTINGS: Record<
  AIDifficulty,
  {
    speedMultiplier: number; // How fast AI drives relative to max
    waypointRadius: number; // How close to waypoint before moving to next
    wobbleAmount: number; // Random steering wobble
    mistakeChance: number; // Chance per second of making a mistake
    mistakeDuration: number; // How long mistakes last
    reactionTime: number; // Delay before reacting to waypoints
    lookAhead: number; // How many waypoints to look ahead
  }
> = {
  easy: {
    speedMultiplier: 0.65,
    waypointRadius: 60,
    wobbleAmount: 0.3,
    mistakeChance: 0.15,
    mistakeDuration: 0.8,
    reactionTime: 0.15,
    lookAhead: 1,
  },
  medium: {
    speedMultiplier: 0.8,
    waypointRadius: 45,
    wobbleAmount: 0.15,
    mistakeChance: 0.05,
    mistakeDuration: 0.4,
    reactionTime: 0.08,
    lookAhead: 2,
  },
  hard: {
    speedMultiplier: 0.95,
    waypointRadius: 30,
    wobbleAmount: 0.05,
    mistakeChance: 0.01,
    mistakeDuration: 0.2,
    reactionTime: 0.02,
    lookAhead: 3,
  },
};

interface MistakeState {
  active: boolean;
  timer: number;
  steerDirection: number; // -1 or 1
}

export class AIController {
  public readonly waypoints: Vector2D[];
  public readonly difficulty: AIDifficulty;
  public readonly trackWidth: number;

  private settings: (typeof DIFFICULTY_SETTINGS)['easy'];
  public currentWaypointIndex: number = 0;

  // State for natural movement
  private wobbleOffset: number = 0;
  private wobbleTimer: number = 0;
  private mistake: MistakeState = { active: false, timer: 0, steerDirection: 0 };
  private reactionBuffer: Vector2D | null = null;
  private reactionTimer: number = 0;

  // For smoother steering
  private lastSteerDirection: number = 0;

  constructor(config: AIControllerConfig) {
    this.waypoints = config.waypoints;
    this.difficulty = config.difficulty;
    this.trackWidth = config.trackWidth;
    this.settings = DIFFICULTY_SETTINGS[config.difficulty];
  }

  /**
   * Update AI controller and apply to truck
   */
  update(truck: RaceTruck, deltaTime: number): void {
    if (truck.state.finished) return;

    // Update wobble (makes AI feel alive)
    this.updateWobble(deltaTime);

    // Update mistake state
    this.updateMistake(deltaTime);

    // Update reaction buffer
    this.updateReaction(deltaTime);

    // Get target position (next waypoint with look-ahead)
    const targetPos = this.getTargetPosition(truck);

    // Calculate direction to target
    const toTarget = Vec2.subtract(targetPos, truck.state.position);
    const distanceToTarget = Vec2.length(toTarget);

    // Check if we've reached current waypoint
    if (distanceToTarget < this.settings.waypointRadius) {
      this.advanceWaypoint();
    }

    // Calculate desired angle to target
    const targetAngle = Math.atan2(toTarget.y, toTarget.x);

    // Calculate angle difference (normalized to -PI to PI)
    let angleDiff = targetAngle - truck.state.rotation;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    // Determine steering direction
    let steerDirection = 0;
    if (Math.abs(angleDiff) > 0.05) {
      steerDirection = angleDiff > 0 ? 1 : -1;
    }

    // Apply wobble to steering
    steerDirection += this.wobbleOffset;

    // Apply mistake if active
    if (this.mistake.active) {
      steerDirection = this.mistake.steerDirection * 0.5;
    }

    // Smooth steering
    this.lastSteerDirection = this.lastSteerDirection * 0.8 + steerDirection * 0.2;

    // Apply steering
    truck.steerDelta(this.lastSteerDirection, deltaTime);

    // Calculate speed based on angle (slow down for turns)
    const turnFactor = 1 - Math.min(1, Math.abs(angleDiff) / Math.PI) * 0.5;
    const targetSpeed = this.settings.speedMultiplier * turnFactor;

    // Accelerate or brake
    if (targetSpeed > 0.3 && !this.mistake.active) {
      truck.accelerate(deltaTime * targetSpeed);
    } else if (this.mistake.active) {
      // During mistakes, reduce speed
      truck.accelerate(deltaTime * 0.3);
    }

    // Check for random mistake trigger
    if (!this.mistake.active && Math.random() < this.settings.mistakeChance * deltaTime) {
      this.triggerMistake();
    }
  }

  /**
   * Get the target position considering look-ahead
   */
  private getTargetPosition(truck: RaceTruck): Vector2D {
    // Use reaction buffer if available (adds reaction delay)
    if (this.reactionBuffer && this.reactionTimer > 0) {
      return this.reactionBuffer;
    }

    // Calculate look-ahead target
    const lookAhead = this.settings.lookAhead;
    let targetIndex = this.currentWaypointIndex;

    // Check distance to current waypoint
    const currentWaypoint = this.waypoints[this.currentWaypointIndex];
    const distToCurrent = Vec2.distance(truck.state.position, currentWaypoint);

    // If close to current, start blending toward next
    if (distToCurrent < this.settings.waypointRadius * 2 && lookAhead > 0) {
      targetIndex = (this.currentWaypointIndex + 1) % this.waypoints.length;

      // Blend between current and next based on distance
      const blend = 1 - distToCurrent / (this.settings.waypointRadius * 2);
      const nextWaypoint = this.waypoints[targetIndex];

      const target = Vec2.lerp(currentWaypoint, nextWaypoint, blend * 0.5);

      // Store in reaction buffer
      this.reactionBuffer = target;
      this.reactionTimer = this.settings.reactionTime;

      return target;
    }

    const target = this.waypoints[targetIndex];
    this.reactionBuffer = target;
    this.reactionTimer = this.settings.reactionTime;

    return target;
  }

  /**
   * Advance to next waypoint
   */
  private advanceWaypoint(): void {
    this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.waypoints.length;
  }

  /**
   * Update wobble for natural movement
   */
  private updateWobble(deltaTime: number): void {
    this.wobbleTimer += deltaTime;

    // Create smooth wobble using sine wave with some randomness
    const frequency = 1.5 + Math.random() * 0.5;
    this.wobbleOffset =
      Math.sin(this.wobbleTimer * frequency) *
      this.settings.wobbleAmount *
      (0.8 + Math.random() * 0.4);
  }

  /**
   * Update mistake state
   */
  private updateMistake(deltaTime: number): void {
    if (this.mistake.active) {
      this.mistake.timer -= deltaTime;
      if (this.mistake.timer <= 0) {
        this.mistake.active = false;
      }
    }
  }

  /**
   * Update reaction time buffer
   */
  private updateReaction(deltaTime: number): void {
    if (this.reactionTimer > 0) {
      this.reactionTimer -= deltaTime;
    }
  }

  /**
   * Trigger a random mistake
   */
  private triggerMistake(): void {
    this.mistake = {
      active: true,
      timer: this.settings.mistakeDuration,
      steerDirection: Math.random() > 0.5 ? 1 : -1,
    };
  }

  /**
   * Reset AI controller state
   */
  reset(): void {
    this.currentWaypointIndex = 0;
    this.wobbleOffset = 0;
    this.wobbleTimer = 0;
    this.mistake = { active: false, timer: 0, steerDirection: 0 };
    this.reactionBuffer = null;
    this.reactionTimer = 0;
    this.lastSteerDirection = 0;
  }

  /**
   * Set current waypoint index (useful for lap tracking)
   */
  setWaypointIndex(index: number): void {
    this.currentWaypointIndex = index % this.waypoints.length;
  }

  /**
   * Get current target waypoint
   */
  getCurrentWaypoint(): Vector2D {
    return this.waypoints[this.currentWaypointIndex];
  }

  /**
   * Get progress through waypoints (0-1)
   */
  getProgress(): number {
    return this.currentWaypointIndex / this.waypoints.length;
  }
}

/**
 * Create a new AIController instance
 */
export function createAIController(config: AIControllerConfig): AIController {
  return new AIController(config);
}
