import { describe, it, expect } from 'vitest';
import {
  Vec2,
  Physics,
  createPhysics,
  createPhysicsBody,
  DEFAULT_PHYSICS_CONFIG,
} from '@/lib/game/Physics';

describe('Vec2', () => {
  describe('create', () => {
    it('should create a vector with default values', () => {
      const v = Vec2.create();
      expect(v.x).toBe(0);
      expect(v.y).toBe(0);
    });

    it('should create a vector with given values', () => {
      const v = Vec2.create(10, 20);
      expect(v.x).toBe(10);
      expect(v.y).toBe(20);
    });
  });

  describe('clone', () => {
    it('should create an independent copy', () => {
      const v1 = Vec2.create(5, 10);
      const v2 = Vec2.clone(v1);
      v2.x = 100;
      expect(v1.x).toBe(5);
      expect(v2.x).toBe(100);
    });
  });

  describe('add', () => {
    it('should add two vectors', () => {
      const a = Vec2.create(1, 2);
      const b = Vec2.create(3, 4);
      const result = Vec2.add(a, b);
      expect(result.x).toBe(4);
      expect(result.y).toBe(6);
    });
  });

  describe('subtract', () => {
    it('should subtract two vectors', () => {
      const a = Vec2.create(5, 10);
      const b = Vec2.create(3, 4);
      const result = Vec2.subtract(a, b);
      expect(result.x).toBe(2);
      expect(result.y).toBe(6);
    });
  });

  describe('multiply', () => {
    it('should multiply vector by scalar', () => {
      const v = Vec2.create(3, 4);
      const result = Vec2.multiply(v, 2);
      expect(result.x).toBe(6);
      expect(result.y).toBe(8);
    });
  });

  describe('divide', () => {
    it('should divide vector by scalar', () => {
      const v = Vec2.create(6, 8);
      const result = Vec2.divide(v, 2);
      expect(result.x).toBe(3);
      expect(result.y).toBe(4);
    });

    it('should return zero vector when dividing by zero', () => {
      const v = Vec2.create(6, 8);
      const result = Vec2.divide(v, 0);
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });
  });

  describe('length', () => {
    it('should calculate vector length', () => {
      const v = Vec2.create(3, 4);
      expect(Vec2.length(v)).toBe(5);
    });
  });

  describe('normalize', () => {
    it('should normalize a vector to unit length', () => {
      const v = Vec2.create(3, 4);
      const result = Vec2.normalize(v);
      expect(Vec2.length(result)).toBeCloseTo(1, 5);
    });

    it('should return zero vector for zero vector', () => {
      const v = Vec2.create(0, 0);
      const result = Vec2.normalize(v);
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });
  });

  describe('dot', () => {
    it('should calculate dot product', () => {
      const a = Vec2.create(1, 2);
      const b = Vec2.create(3, 4);
      expect(Vec2.dot(a, b)).toBe(11);
    });
  });

  describe('distance', () => {
    it('should calculate distance between two points', () => {
      const a = Vec2.create(0, 0);
      const b = Vec2.create(3, 4);
      expect(Vec2.distance(a, b)).toBe(5);
    });
  });

  describe('lerp', () => {
    it('should interpolate between two vectors', () => {
      const a = Vec2.create(0, 0);
      const b = Vec2.create(10, 10);
      const result = Vec2.lerp(a, b, 0.5);
      expect(result.x).toBe(5);
      expect(result.y).toBe(5);
    });

    it('should return first vector at t=0', () => {
      const a = Vec2.create(1, 2);
      const b = Vec2.create(10, 20);
      const result = Vec2.lerp(a, b, 0);
      expect(result.x).toBe(1);
      expect(result.y).toBe(2);
    });

    it('should return second vector at t=1', () => {
      const a = Vec2.create(1, 2);
      const b = Vec2.create(10, 20);
      const result = Vec2.lerp(a, b, 1);
      expect(result.x).toBe(10);
      expect(result.y).toBe(20);
    });
  });

  describe('equals', () => {
    it('should return true for equal vectors', () => {
      const a = Vec2.create(1, 2);
      const b = Vec2.create(1, 2);
      expect(Vec2.equals(a, b)).toBe(true);
    });

    it('should return false for different vectors', () => {
      const a = Vec2.create(1, 2);
      const b = Vec2.create(1, 3);
      expect(Vec2.equals(a, b)).toBe(false);
    });

    it('should handle floating point errors within epsilon', () => {
      const a = Vec2.create(0.1 + 0.2, 0);
      const b = Vec2.create(0.3, 0);
      expect(Vec2.equals(a, b)).toBe(true);
    });
  });
});

describe('createPhysicsBody', () => {
  it('should create body with default values', () => {
    const body = createPhysicsBody();
    expect(body.position.x).toBe(0);
    expect(body.position.y).toBe(0);
    expect(body.velocity.x).toBe(0);
    expect(body.velocity.y).toBe(0);
    expect(body.mass).toBe(1);
    expect(body.isGrounded).toBe(false);
  });

  it('should create body at specified position', () => {
    const body = createPhysicsBody(100, 200);
    expect(body.position.x).toBe(100);
    expect(body.position.y).toBe(200);
  });

  it('should accept optional parameters', () => {
    const body = createPhysicsBody(0, 0, {
      mass: 2,
      friction: 0.5,
      isGrounded: true,
    });
    expect(body.mass).toBe(2);
    expect(body.friction).toBe(0.5);
    expect(body.isGrounded).toBe(true);
  });
});

describe('Physics', () => {
  describe('update', () => {
    it('should apply gravity when not grounded', () => {
      const physics = createPhysics();
      const body = createPhysicsBody(0, 0);

      physics.update(body, 1);

      expect(body.velocity.y).toBeGreaterThan(0);
      expect(body.position.y).toBeGreaterThan(0);
    });

    it('should not apply gravity when grounded', () => {
      const physics = createPhysics();
      const body = createPhysicsBody(0, 0, { isGrounded: true });

      physics.update(body, 1);

      expect(body.velocity.y).toBe(0);
    });

    it('should clamp velocity to max values', () => {
      const physics = createPhysics({ maxVelocityX: 100 });
      const body = createPhysicsBody(0, 0);
      body.velocity.x = 500;

      physics.update(body, 0.016);

      expect(body.velocity.x).toBeLessThanOrEqual(100);
    });
  });

  describe('applyForce', () => {
    it('should add force to acceleration', () => {
      const physics = createPhysics();
      const body = createPhysicsBody(0, 0);

      physics.applyForce(body, { x: 100, y: 0 });

      expect(body.acceleration.x).toBe(100);
    });

    it('should account for mass', () => {
      const physics = createPhysics();
      const body = createPhysicsBody(0, 0, { mass: 2 });

      physics.applyForce(body, { x: 100, y: 0 });

      expect(body.acceleration.x).toBe(50);
    });
  });

  describe('applyImpulse', () => {
    it('should add impulse to velocity', () => {
      const physics = createPhysics();
      const body = createPhysicsBody(0, 0);

      physics.applyImpulse(body, { x: 100, y: 0 });

      expect(body.velocity.x).toBe(100);
    });

    it('should account for mass', () => {
      const physics = createPhysics();
      const body = createPhysicsBody(0, 0, { mass: 2 });

      physics.applyImpulse(body, { x: 100, y: 0 });

      expect(body.velocity.x).toBe(50);
    });
  });

  describe('jump', () => {
    it('should apply upward velocity when grounded', () => {
      const physics = createPhysics();
      const body = createPhysicsBody(0, 0, { isGrounded: true });

      physics.jump(body, 500);

      expect(body.velocity.y).toBe(-500);
      expect(body.isGrounded).toBe(false);
    });

    it('should not jump when not grounded', () => {
      const physics = createPhysics();
      const body = createPhysicsBody(0, 0, { isGrounded: false });

      physics.jump(body, 500);

      expect(body.velocity.y).toBe(0);
    });
  });

  describe('forceJump', () => {
    it('should apply upward velocity even when not grounded', () => {
      const physics = createPhysics();
      const body = createPhysicsBody(0, 0, { isGrounded: false });

      physics.forceJump(body, 500);

      expect(body.velocity.y).toBe(-500);
    });
  });

  describe('moveHorizontal', () => {
    it('should set horizontal velocity', () => {
      const physics = createPhysics();
      const body = createPhysicsBody(0, 0);

      physics.moveHorizontal(body, 100);

      expect(body.velocity.x).toBe(100);
    });
  });

  describe('getConfig / setConfig', () => {
    it('should return current config', () => {
      const physics = createPhysics();
      const config = physics.getConfig();
      expect(config.gravity).toBe(DEFAULT_PHYSICS_CONFIG.gravity);
    });

    it('should update config', () => {
      const physics = createPhysics();
      physics.setConfig({ gravity: 500 });
      expect(physics.getConfig().gravity).toBe(500);
    });
  });
});

describe('createPhysics', () => {
  it('should create Physics instance with default config', () => {
    const physics = createPhysics();
    expect(physics).toBeInstanceOf(Physics);
  });

  it('should create Physics instance with custom config', () => {
    const physics = createPhysics({ gravity: 500 });
    expect(physics.getConfig().gravity).toBe(500);
  });
});
