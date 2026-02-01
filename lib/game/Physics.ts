/**
 * Physics - Simple 2D physics for velocity, gravity, and movement
 */

import type { Vector2D, PhysicsBody, PhysicsConfig, Rect } from './types';
import { checkAABBDetailed } from './Collision';

// ============================================================
// Default Configuration
// ============================================================

export const DEFAULT_PHYSICS_CONFIG: PhysicsConfig = {
  gravity: 980, // pixels per second squared (feels like ~10m/s²)
  maxVelocityX: 500,
  maxVelocityY: 1000,
  groundFriction: 0.85,
  airResistance: 0.99,
};

// ============================================================
// Vector2D Utilities
// ============================================================

export const Vec2 = {
  create(x: number = 0, y: number = 0): Vector2D {
    return { x, y };
  },

  clone(v: Vector2D): Vector2D {
    return { x: v.x, y: v.y };
  },

  add(a: Vector2D, b: Vector2D): Vector2D {
    return { x: a.x + b.x, y: a.y + b.y };
  },

  subtract(a: Vector2D, b: Vector2D): Vector2D {
    return { x: a.x - b.x, y: a.y - b.y };
  },

  multiply(v: Vector2D, scalar: number): Vector2D {
    return { x: v.x * scalar, y: v.y * scalar };
  },

  divide(v: Vector2D, scalar: number): Vector2D {
    if (scalar === 0) return { x: 0, y: 0 };
    return { x: v.x / scalar, y: v.y / scalar };
  },

  length(v: Vector2D): number {
    return Math.sqrt(v.x * v.x + v.y * v.y);
  },

  lengthSquared(v: Vector2D): number {
    return v.x * v.x + v.y * v.y;
  },

  normalize(v: Vector2D): Vector2D {
    const len = Vec2.length(v);
    if (len === 0) return { x: 0, y: 0 };
    return { x: v.x / len, y: v.y / len };
  },

  dot(a: Vector2D, b: Vector2D): number {
    return a.x * b.x + a.y * b.y;
  },

  distance(a: Vector2D, b: Vector2D): number {
    return Vec2.length(Vec2.subtract(b, a));
  },

  lerp(a: Vector2D, b: Vector2D, t: number): Vector2D {
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
    };
  },

  clamp(v: Vector2D, maxLength: number): Vector2D {
    const len = Vec2.length(v);
    if (len <= maxLength) return Vec2.clone(v);
    return Vec2.multiply(Vec2.normalize(v), maxLength);
  },

  zero(): Vector2D {
    return { x: 0, y: 0 };
  },

  equals(a: Vector2D, b: Vector2D, epsilon: number = 0.0001): boolean {
    return Math.abs(a.x - b.x) < epsilon && Math.abs(a.y - b.y) < epsilon;
  },
};

// ============================================================
// Physics Body Factory
// ============================================================

/**
 * Create a new physics body with default values
 */
export function createPhysicsBody(
  x: number = 0,
  y: number = 0,
  options: Partial<Omit<PhysicsBody, 'position'>> = {}
): PhysicsBody {
  return {
    position: { x, y },
    velocity: options.velocity ?? Vec2.zero(),
    acceleration: options.acceleration ?? Vec2.zero(),
    mass: options.mass ?? 1,
    friction: options.friction ?? 0.1,
    restitution: options.restitution ?? 0.2,
    isGrounded: options.isGrounded ?? false,
  };
}

// ============================================================
// Physics Engine
// ============================================================

export class Physics {
  private config: PhysicsConfig;

  constructor(config: Partial<PhysicsConfig> = {}) {
    this.config = { ...DEFAULT_PHYSICS_CONFIG, ...config };
  }

  /**
   * Update a physics body for one frame
   */
  update(body: PhysicsBody, deltaTime: number): void {
    // Apply gravity if not grounded
    if (!body.isGrounded) {
      body.acceleration.y = this.config.gravity;
    } else {
      body.acceleration.y = 0;
    }

    // Apply acceleration to velocity
    body.velocity.x += body.acceleration.x * deltaTime;
    body.velocity.y += body.acceleration.y * deltaTime;

    // Apply friction/resistance
    if (body.isGrounded) {
      body.velocity.x *= Math.pow(this.config.groundFriction, deltaTime * 60);
    } else {
      body.velocity.x *= Math.pow(this.config.airResistance, deltaTime * 60);
    }

    // Clamp velocity
    body.velocity.x = clamp(body.velocity.x, -this.config.maxVelocityX, this.config.maxVelocityX);
    body.velocity.y = clamp(body.velocity.y, -this.config.maxVelocityY, this.config.maxVelocityY);

    // Apply velocity to position
    body.position.x += body.velocity.x * deltaTime;
    body.position.y += body.velocity.y * deltaTime;

    // Clear acceleration for next frame
    body.acceleration.x = 0;
  }

  /**
   * Apply a force to a body
   */
  applyForce(body: PhysicsBody, force: Vector2D): void {
    body.acceleration.x += force.x / body.mass;
    body.acceleration.y += force.y / body.mass;
  }

  /**
   * Apply an impulse (instant velocity change) to a body
   */
  applyImpulse(body: PhysicsBody, impulse: Vector2D): void {
    body.velocity.x += impulse.x / body.mass;
    body.velocity.y += impulse.y / body.mass;
  }

  /**
   * Make a body jump with given strength
   */
  jump(body: PhysicsBody, strength: number): void {
    if (!body.isGrounded) return;

    body.velocity.y = -strength;
    body.isGrounded = false;
  }

  /**
   * Force a body to jump (ignores grounded check)
   */
  forceJump(body: PhysicsBody, strength: number): void {
    body.velocity.y = -strength;
    body.isGrounded = false;
  }

  /**
   * Move a body horizontally with given speed
   */
  moveHorizontal(body: PhysicsBody, speed: number): void {
    body.velocity.x = speed;
  }

  /**
   * Resolve collision between a body and a static rectangle (like ground)
   */
  resolveStaticCollision(
    body: PhysicsBody,
    bodyRect: Rect,
    staticRect: Rect
  ): boolean {
    const result = checkAABBDetailed(bodyRect, staticRect);

    if (!result.collided) {
      return false;
    }

    // Push body out of collision
    if (result.normal.y < 0) {
      // Collision from above - landing on ground
      body.position.y -= result.overlap.y;
      body.velocity.y = 0;
      body.isGrounded = true;
    } else if (result.normal.y > 0) {
      // Collision from below - hitting ceiling
      body.position.y += result.overlap.y;
      body.velocity.y = Math.abs(body.velocity.y) * body.restitution;
    }

    if (result.normal.x !== 0) {
      // Horizontal collision
      body.position.x += result.overlap.x * result.normal.x;
      body.velocity.x = -body.velocity.x * body.restitution;
    }

    return true;
  }

  /**
   * Check if a body would collide with ground at given y position
   */
  checkGroundCollision(body: PhysicsBody, bodyHeight: number, groundY: number): boolean {
    return body.position.y + bodyHeight >= groundY;
  }

  /**
   * Land a body on ground at given y position
   */
  landOnGround(body: PhysicsBody, bodyHeight: number, groundY: number): void {
    body.position.y = groundY - bodyHeight;
    body.velocity.y = 0;
    body.isGrounded = true;
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<PhysicsConfig> {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<PhysicsConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// ============================================================
// Utility Functions
// ============================================================

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Create a new Physics instance with default config
 */
export function createPhysics(config?: Partial<PhysicsConfig>): Physics {
  return new Physics(config);
}
