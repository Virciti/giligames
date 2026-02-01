/**
 * TruckEntity - Monster truck entity with physics, input handling, and rendering
 */

import type { Vector2D, Rect, InputState, PhysicsBody, Camera } from '../types';
import type { Truck } from '@/content/types';
import { createPhysicsBody, Physics, Vec2 } from '../Physics';

// Truck dimensions
const TRUCK_WIDTH = 80;
const TRUCK_HEIGHT = 50;
const WHEEL_RADIUS = 12;

// Exhaust particle
interface ExhaustParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

export interface TruckEntityConfig {
  x: number;
  y: number;
  truck: Truck;
}

export class TruckEntity {
  // Physics body
  public body: PhysicsBody;

  // Transform
  public rotation: number = 0;
  public width: number = TRUCK_WIDTH;
  public height: number = TRUCK_HEIGHT;

  // Truck configuration
  public truckConfig: Truck;

  // Visual state
  private wheelRotation: number = 0;
  private exhaustParticles: ExhaustParticle[] = [];
  private isMoving: boolean = false;
  private facingRight: boolean = true;

  // Stats-based multipliers
  private speedMultiplier: number;
  private jumpMultiplier: number;
  private handlingMultiplier: number;

  constructor(config: TruckEntityConfig) {
    this.truckConfig = config.truck;

    // Create physics body
    this.body = createPhysicsBody(config.x, config.y, {
      mass: 1,
      friction: 0.1,
      restitution: 0.2,
    });

    // Calculate stat multipliers (stats are 1-5)
    this.speedMultiplier = 0.6 + (config.truck.stats.speed * 0.2); // 0.8 - 1.6
    this.jumpMultiplier = 0.6 + (config.truck.stats.jump * 0.2); // 0.8 - 1.6
    this.handlingMultiplier = 0.6 + (config.truck.stats.handling * 0.2); // 0.8 - 1.6
  }

  /**
   * Get the truck's bounding rectangle
   */
  getBounds(): Rect {
    return {
      x: this.body.position.x,
      y: this.body.position.y,
      width: this.width,
      height: this.height,
    };
  }

  /**
   * Get center position
   */
  getCenter(): Vector2D {
    return {
      x: this.body.position.x + this.width / 2,
      y: this.body.position.y + this.height / 2,
    };
  }

  /**
   * Check if the truck is grounded
   */
  get isGrounded(): boolean {
    return this.body.isGrounded;
  }

  /**
   * Apply input to control the truck
   */
  applyInput(input: InputState, deltaTime: number): void {
    const baseSpeed = 350 * this.speedMultiplier;
    const baseJump = 500 * this.jumpMultiplier;
    const acceleration = 1500 * this.handlingMultiplier;

    this.isMoving = false;

    // Horizontal movement
    if (input.left) {
      this.body.acceleration.x = -acceleration;
      this.facingRight = false;
      this.isMoving = true;
    } else if (input.right) {
      this.body.acceleration.x = acceleration;
      this.facingRight = true;
      this.isMoving = true;
    }

    // Clamp horizontal velocity
    if (Math.abs(this.body.velocity.x) > baseSpeed) {
      this.body.velocity.x = Math.sign(this.body.velocity.x) * baseSpeed;
    }

    // Jumping
    if (input.jump && this.body.isGrounded) {
      this.body.velocity.y = -baseJump;
      this.body.isGrounded = false;
    }

    // Update rotation based on velocity (tilt when moving fast)
    const targetRotation = (this.body.velocity.x / baseSpeed) * 0.15; // Max ~8 degrees
    this.rotation = this.rotation + (targetRotation - this.rotation) * 0.1;

    // Generate exhaust particles when moving
    if (this.isMoving && this.body.isGrounded) {
      this.generateExhaust(deltaTime);
    }
  }

  /**
   * Apply physics to the truck
   */
  applyPhysics(physics: Physics, deltaTime: number): void {
    physics.update(this.body, deltaTime);

    // Update wheel rotation based on horizontal velocity
    this.wheelRotation += (this.body.velocity.x * deltaTime) / WHEEL_RADIUS;

    // Update exhaust particles
    this.updateExhaust(deltaTime);
  }

  /**
   * Apply upward force (for ramps)
   */
  applyLaunchForce(force: number): void {
    if (this.body.velocity.y > -force * 0.5) {
      this.body.velocity.y = -force;
      this.body.isGrounded = false;
    }
  }

  /**
   * Generate exhaust particles
   */
  private generateExhaust(deltaTime: number): void {
    // Limit particle count
    if (this.exhaustParticles.length > 20) return;

    // Random chance to spawn
    if (Math.random() > 0.3) return;

    const exhaustX = this.facingRight
      ? this.body.position.x + 5
      : this.body.position.x + this.width - 5;

    this.exhaustParticles.push({
      x: exhaustX,
      y: this.body.position.y + this.height - 10,
      vx: (this.facingRight ? -1 : 1) * (30 + Math.random() * 20),
      vy: -20 - Math.random() * 30,
      life: 0.5 + Math.random() * 0.3,
      maxLife: 0.5 + Math.random() * 0.3,
      size: 4 + Math.random() * 4,
    });
  }

  /**
   * Update exhaust particles
   */
  private updateExhaust(deltaTime: number): void {
    for (let i = this.exhaustParticles.length - 1; i >= 0; i--) {
      const p = this.exhaustParticles[i];
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      p.vy += 50 * deltaTime; // Slight upward deceleration
      p.life -= deltaTime;

      if (p.life <= 0) {
        this.exhaustParticles.splice(i, 1);
      }
    }
  }

  /**
   * Render the truck
   */
  render(ctx: CanvasRenderingContext2D, camera: Camera): void {
    const screenPos = {
      x: this.body.position.x - camera.position.x,
      y: this.body.position.y - camera.position.y,
    };

    ctx.save();

    // Apply rotation around center
    const centerX = screenPos.x + this.width / 2;
    const centerY = screenPos.y + this.height / 2;
    ctx.translate(centerX, centerY);
    ctx.rotate(this.rotation);
    ctx.translate(-centerX, -centerY);

    // Render exhaust particles behind truck
    this.renderExhaust(ctx, camera);

    // Draw truck body
    this.renderBody(ctx, screenPos);

    // Draw wheels
    this.renderWheels(ctx, screenPos);

    ctx.restore();
  }

  /**
   * Render exhaust particles
   */
  private renderExhaust(ctx: CanvasRenderingContext2D, camera: Camera): void {
    for (const p of this.exhaustParticles) {
      const alpha = p.life / p.maxLife;
      ctx.fillStyle = `rgba(100, 100, 100, ${alpha * 0.5})`;
      ctx.beginPath();
      ctx.arc(
        p.x - camera.position.x,
        p.y - camera.position.y,
        p.size * alpha,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }

  /**
   * Render the truck body
   */
  private renderBody(ctx: CanvasRenderingContext2D, screenPos: Vector2D): void {
    const x = screenPos.x;
    const y = screenPos.y;

    // Main body color
    ctx.fillStyle = this.truckConfig.color;

    // Draw main body rectangle
    ctx.beginPath();
    ctx.roundRect(x + 5, y + 10, this.width - 10, this.height - 25, 5);
    ctx.fill();

    // Draw cab (raised section)
    const cabX = this.facingRight ? x + 45 : x + 10;
    ctx.fillStyle = this.truckConfig.secondaryColor || this.truckConfig.color;
    ctx.beginPath();
    ctx.roundRect(cabX, y + 2, 25, 20, [5, 5, 0, 0]);
    ctx.fill();

    // Window
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.roundRect(cabX + 3, y + 5, 19, 12, 2);
    ctx.fill();

    // Highlight/shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.roundRect(x + 8, y + 12, this.width - 16, 8, 3);
    ctx.fill();

    // Grille (front)
    const grilleX = this.facingRight ? x + this.width - 12 : x + 5;
    ctx.fillStyle = '#333';
    ctx.fillRect(grilleX, y + 18, 7, 12);
    ctx.fillStyle = '#666';
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(grilleX + 1, y + 20 + i * 4, 5, 2);
    }
  }

  /**
   * Render the wheels
   */
  private renderWheels(ctx: CanvasRenderingContext2D, screenPos: Vector2D): void {
    const x = screenPos.x;
    const y = screenPos.y;
    const wheelY = y + this.height - WHEEL_RADIUS;

    // Wheel positions
    const wheels = [
      { x: x + 18, y: wheelY },
      { x: x + this.width - 18, y: wheelY },
    ];

    for (const wheel of wheels) {
      // Tire (outer)
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.arc(wheel.x, wheel.y, WHEEL_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      // Tire tread pattern
      ctx.save();
      ctx.translate(wheel.x, wheel.y);
      ctx.rotate(this.wheelRotation);

      ctx.strokeStyle = '#444';
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(
          Math.cos(angle) * (WHEEL_RADIUS - 4),
          Math.sin(angle) * (WHEEL_RADIUS - 4)
        );
        ctx.lineTo(
          Math.cos(angle) * WHEEL_RADIUS,
          Math.sin(angle) * WHEEL_RADIUS
        );
        ctx.stroke();
      }

      // Hub cap
      ctx.fillStyle = '#888';
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  /**
   * Reset truck to a position
   */
  reset(x: number, y: number): void {
    this.body.position.x = x;
    this.body.position.y = y;
    this.body.velocity = Vec2.zero();
    this.body.acceleration = Vec2.zero();
    this.body.isGrounded = false;
    this.rotation = 0;
    this.wheelRotation = 0;
    this.exhaustParticles = [];
    this.facingRight = true;
  }
}

/**
 * Create a new TruckEntity
 */
export function createTruckEntity(config: TruckEntityConfig): TruckEntity {
  return new TruckEntity(config);
}
