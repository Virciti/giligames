/**
 * RaceTruck - Top-down racing truck entity
 *
 * Used in race mode with top-down perspective (different from side-view StadiumTruck).
 * Handles truck physics, steering, acceleration, and lap tracking.
 */

import type { Vector2D, Rect, Camera } from '../types';
import { Vec2 } from '../Physics';

export interface RaceTruckConfig {
  id: string;
  color: string;
  secondaryColor?: string;
  speed: number; // 1-5 stat
  handling: number; // 1-5 stat
  position: Vector2D;
  rotation?: number; // radians
}

export interface RaceTruckState {
  position: Vector2D;
  velocity: Vector2D;
  rotation: number; // radians (0 = facing right, PI/2 = facing down)
  speed: number; // current speed magnitude
  lap: number;
  checkpointIndex: number;
  finished: boolean;
  finishTime: number;
  boosting: boolean;
  boostTimer: number;
}

// Constants for truck physics
const BASE_MAX_SPEED = 150;
const BASE_ACCELERATION = 200;
const BASE_BRAKE_FORCE = 300;
const BASE_TURN_SPEED = 2.5;
const FRICTION = 0.98;
const BOOST_MULTIPLIER = 1.5;
const BOOST_DURATION = 1.0; // seconds

// Truck dimensions
const TRUCK_WIDTH = 24;
const TRUCK_HEIGHT = 40;

export class RaceTruck {
  public readonly id: string;
  public readonly color: string;
  public readonly secondaryColor: string;

  // Stats (1-5 scale, affects physics)
  private speedStat: number;
  private handlingStat: number;

  // Derived physics values
  private maxSpeed: number;
  private acceleration: number;
  private turnSpeed: number;

  // Current state
  public state: RaceTruckState;

  // Track whether we're player-controlled or AI
  public isPlayer: boolean = false;

  constructor(config: RaceTruckConfig) {
    this.id = config.id;
    this.color = config.color;
    this.secondaryColor = config.secondaryColor ?? config.color;
    this.speedStat = config.speed;
    this.handlingStat = config.handling;

    // Calculate derived physics values from stats
    this.maxSpeed = BASE_MAX_SPEED + (config.speed - 1) * 30; // 150-270
    this.acceleration = BASE_ACCELERATION + (config.speed - 1) * 40; // 200-360
    this.turnSpeed = BASE_TURN_SPEED + (config.handling - 1) * 0.4; // 2.5-4.1

    // Initialize state
    this.state = {
      position: Vec2.clone(config.position),
      velocity: Vec2.zero(),
      rotation: config.rotation ?? -Math.PI / 2, // Default facing up
      speed: 0,
      lap: 0,
      checkpointIndex: 0,
      finished: false,
      finishTime: 0,
      boosting: false,
      boostTimer: 0,
    };
  }

  /**
   * Steer the truck left or right
   * @param direction -1 for left, 1 for right, 0 for no steering
   */
  steer(direction: number): void {
    if (this.state.finished) return;

    // Only steer when moving
    const speedFactor = Math.min(1, Math.abs(this.state.speed) / 50);
    const turnAmount = this.turnSpeed * direction * speedFactor;
    this.state.rotation += turnAmount * (1 / 60); // Assuming 60fps, will be adjusted in update
  }

  /**
   * Apply steering with delta time
   */
  steerDelta(direction: number, deltaTime: number): void {
    if (this.state.finished) return;

    // Only steer when moving
    const speedFactor = Math.min(1, Math.abs(this.state.speed) / 50);
    const turnAmount = this.turnSpeed * direction * speedFactor;
    this.state.rotation += turnAmount * deltaTime;
  }

  /**
   * Accelerate the truck forward
   */
  accelerate(deltaTime: number): void {
    if (this.state.finished) return;

    const currentMaxSpeed = this.state.boosting
      ? this.maxSpeed * BOOST_MULTIPLIER
      : this.maxSpeed;

    this.state.speed += this.acceleration * deltaTime;
    this.state.speed = Math.min(this.state.speed, currentMaxSpeed);
  }

  /**
   * Apply brakes to slow down
   */
  brake(deltaTime: number): void {
    if (this.state.finished) return;

    this.state.speed -= BASE_BRAKE_FORCE * deltaTime;
    this.state.speed = Math.max(this.state.speed, -this.maxSpeed * 0.3); // Allow some reverse
  }

  /**
   * Apply a speed boost
   */
  applyBoost(): void {
    if (this.state.finished) return;

    this.state.boosting = true;
    this.state.boostTimer = BOOST_DURATION;
    // Instant speed increase
    this.state.speed = Math.min(this.state.speed * 1.3, this.maxSpeed * BOOST_MULTIPLIER);
  }

  /**
   * Update truck physics
   */
  update(deltaTime: number): void {
    if (this.state.finished) return;

    // Update boost timer
    if (this.state.boosting) {
      this.state.boostTimer -= deltaTime;
      if (this.state.boostTimer <= 0) {
        this.state.boosting = false;
        this.state.boostTimer = 0;
      }
    }

    // Apply friction
    this.state.speed *= Math.pow(FRICTION, deltaTime * 60);

    // Stop if very slow
    if (Math.abs(this.state.speed) < 1) {
      this.state.speed = 0;
    }

    // Calculate velocity from speed and rotation
    this.state.velocity = {
      x: Math.cos(this.state.rotation) * this.state.speed,
      y: Math.sin(this.state.rotation) * this.state.speed,
    };

    // Update position
    this.state.position.x += this.state.velocity.x * deltaTime;
    this.state.position.y += this.state.velocity.y * deltaTime;
  }

  /**
   * Reset truck to a starting position
   */
  reset(position: Vector2D, rotation: number): void {
    this.state.position = Vec2.clone(position);
    this.state.velocity = Vec2.zero();
    this.state.rotation = rotation;
    this.state.speed = 0;
    this.state.lap = 0;
    this.state.checkpointIndex = 0;
    this.state.finished = false;
    this.state.finishTime = 0;
    this.state.boosting = false;
    this.state.boostTimer = 0;
  }

  /**
   * Mark truck as finished
   */
  finish(time: number): void {
    this.state.finished = true;
    this.state.finishTime = time;
  }

  /**
   * Get bounding rect for collision detection
   */
  getBounds(): Rect {
    return {
      x: this.state.position.x - TRUCK_WIDTH / 2,
      y: this.state.position.y - TRUCK_HEIGHT / 2,
      width: TRUCK_WIDTH,
      height: TRUCK_HEIGHT,
    };
  }

  /**
   * Get collision polygon (rotated rectangle corners)
   */
  getCorners(): Vector2D[] {
    const cos = Math.cos(this.state.rotation);
    const sin = Math.sin(this.state.rotation);
    const hw = TRUCK_WIDTH / 2;
    const hh = TRUCK_HEIGHT / 2;

    // Local corners
    const localCorners = [
      { x: -hw, y: -hh }, // front-left
      { x: hw, y: -hh }, // front-right
      { x: hw, y: hh }, // back-right
      { x: -hw, y: hh }, // back-left
    ];

    // Rotate and translate
    return localCorners.map((corner) => ({
      x: this.state.position.x + corner.x * cos - corner.y * sin,
      y: this.state.position.y + corner.x * sin + corner.y * cos,
    }));
  }

  /**
   * Render the truck from top-down view
   */
  render(ctx: CanvasRenderingContext2D, _camera?: Camera): void {
    ctx.save();

    // Move to truck position and rotate
    ctx.translate(this.state.position.x, this.state.position.y);
    ctx.rotate(this.state.rotation + Math.PI / 2); // Add PI/2 so "up" in sprite = forward

    // Draw truck body (rectangle)
    const hw = TRUCK_WIDTH / 2;
    const hh = TRUCK_HEIGHT / 2;

    // Main body
    ctx.fillStyle = this.color;
    ctx.fillRect(-hw, -hh, TRUCK_WIDTH, TRUCK_HEIGHT);

    // Cab (front portion)
    ctx.fillStyle = this.secondaryColor;
    ctx.fillRect(-hw + 2, -hh, TRUCK_WIDTH - 4, TRUCK_HEIGHT * 0.35);

    // Wheels (4 corners)
    ctx.fillStyle = '#333333';
    const wheelW = 4;
    const wheelH = 8;
    // Front wheels
    ctx.fillRect(-hw - 2, -hh + 4, wheelW, wheelH);
    ctx.fillRect(hw - 2, -hh + 4, wheelW, wheelH);
    // Back wheels
    ctx.fillRect(-hw - 2, hh - 12, wheelW, wheelH);
    ctx.fillRect(hw - 2, hh - 12, wheelW, wheelH);

    // Boost effect
    if (this.state.boosting) {
      // Draw flame behind truck
      ctx.fillStyle = '#FF6600';
      ctx.beginPath();
      ctx.moveTo(-hw + 4, hh);
      ctx.lineTo(0, hh + 15 + Math.random() * 10);
      ctx.lineTo(hw - 4, hh);
      ctx.closePath();
      ctx.fill();

      // Inner flame
      ctx.fillStyle = '#FFFF00';
      ctx.beginPath();
      ctx.moveTo(-hw + 8, hh);
      ctx.lineTo(0, hh + 8 + Math.random() * 5);
      ctx.lineTo(hw - 8, hh);
      ctx.closePath();
      ctx.fill();
    }

    // Outline
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(-hw, -hh, TRUCK_WIDTH, TRUCK_HEIGHT);

    ctx.restore();
  }

  /**
   * Get truck dimensions
   */
  static get dimensions(): { width: number; height: number } {
    return { width: TRUCK_WIDTH, height: TRUCK_HEIGHT };
  }
}

/**
 * Create a new RaceTruck instance
 */
export function createRaceTruck(config: RaceTruckConfig): RaceTruck {
  return new RaceTruck(config);
}
