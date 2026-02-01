/**
 * Collision - AABB and circle collision detection
 */

import type { Rect, Circle, Vector2D, CollisionResult } from './types';

// ============================================================
// AABB (Axis-Aligned Bounding Box) Collision
// ============================================================

/**
 * Check if two rectangles are overlapping
 */
export function checkAABB(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
 * Check AABB collision and return detailed result with overlap and normal
 */
export function checkAABBDetailed(a: Rect, b: Rect): CollisionResult {
  // Check if not colliding
  if (!checkAABB(a, b)) {
    return {
      collided: false,
      overlap: { x: 0, y: 0 },
      normal: { x: 0, y: 0 },
    };
  }

  // Calculate overlap on each axis
  const overlapLeft = a.x + a.width - b.x;
  const overlapRight = b.x + b.width - a.x;
  const overlapTop = a.y + a.height - b.y;
  const overlapBottom = b.y + b.height - a.y;

  // Find minimum overlap
  const overlapX = overlapLeft < overlapRight ? overlapLeft : -overlapRight;
  const overlapY = overlapTop < overlapBottom ? overlapTop : -overlapBottom;

  // Determine collision normal (direction to push a out of b)
  let normal: Vector2D;
  let overlap: Vector2D;

  if (Math.abs(overlapX) < Math.abs(overlapY)) {
    normal = { x: overlapX > 0 ? -1 : 1, y: 0 };
    overlap = { x: Math.abs(overlapX), y: 0 };
  } else {
    normal = { x: 0, y: overlapY > 0 ? -1 : 1 };
    overlap = { x: 0, y: Math.abs(overlapY) };
  }

  return {
    collided: true,
    overlap,
    normal,
  };
}

// ============================================================
// Circle Collision
// ============================================================

/**
 * Check if two circles are overlapping
 */
export function checkCircle(a: Circle, b: Circle): boolean {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const distanceSquared = dx * dx + dy * dy;
  const radiusSum = a.radius + b.radius;
  return distanceSquared < radiusSum * radiusSum;
}

/**
 * Check circle collision and return detailed result
 */
export function checkCircleDetailed(a: Circle, b: Circle): CollisionResult {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const distanceSquared = dx * dx + dy * dy;
  const radiusSum = a.radius + b.radius;

  if (distanceSquared >= radiusSum * radiusSum) {
    return {
      collided: false,
      overlap: { x: 0, y: 0 },
      normal: { x: 0, y: 0 },
    };
  }

  const distance = Math.sqrt(distanceSquared);

  // Handle case where circles are at the same position
  if (distance === 0) {
    return {
      collided: true,
      overlap: { x: radiusSum, y: 0 },
      normal: { x: 1, y: 0 },
    };
  }

  const overlapAmount = radiusSum - distance;
  const normal: Vector2D = {
    x: dx / distance,
    y: dy / distance,
  };

  return {
    collided: true,
    overlap: {
      x: overlapAmount * Math.abs(normal.x),
      y: overlapAmount * Math.abs(normal.y),
    },
    normal: {
      x: -normal.x, // Point from a to b, but we want push direction
      y: -normal.y,
    },
  };
}

// ============================================================
// Circle-AABB Collision
// ============================================================

/**
 * Check if a circle is overlapping with a rectangle
 */
export function checkCircleAABB(circle: Circle, rect: Rect): boolean {
  // Find the closest point on the rectangle to the circle center
  const closestX = clamp(circle.x, rect.x, rect.x + rect.width);
  const closestY = clamp(circle.y, rect.y, rect.y + rect.height);

  // Check if the closest point is within the circle
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  return dx * dx + dy * dy < circle.radius * circle.radius;
}

/**
 * Check circle-AABB collision and return detailed result
 */
export function checkCircleAABBDetailed(circle: Circle, rect: Rect): CollisionResult {
  // Find the closest point on the rectangle to the circle center
  const closestX = clamp(circle.x, rect.x, rect.x + rect.width);
  const closestY = clamp(circle.y, rect.y, rect.y + rect.height);

  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  const distanceSquared = dx * dx + dy * dy;

  if (distanceSquared >= circle.radius * circle.radius) {
    return {
      collided: false,
      overlap: { x: 0, y: 0 },
      normal: { x: 0, y: 0 },
    };
  }

  const distance = Math.sqrt(distanceSquared);

  // Handle case where circle center is inside the rectangle
  if (distance === 0) {
    // Push out through the nearest edge
    const distToLeft = circle.x - rect.x;
    const distToRight = rect.x + rect.width - circle.x;
    const distToTop = circle.y - rect.y;
    const distToBottom = rect.y + rect.height - circle.y;

    const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);

    if (minDist === distToLeft) {
      return { collided: true, overlap: { x: distToLeft + circle.radius, y: 0 }, normal: { x: -1, y: 0 } };
    } else if (minDist === distToRight) {
      return { collided: true, overlap: { x: distToRight + circle.radius, y: 0 }, normal: { x: 1, y: 0 } };
    } else if (minDist === distToTop) {
      return { collided: true, overlap: { x: 0, y: distToTop + circle.radius }, normal: { x: 0, y: -1 } };
    } else {
      return { collided: true, overlap: { x: 0, y: distToBottom + circle.radius }, normal: { x: 0, y: 1 } };
    }
  }

  const overlapAmount = circle.radius - distance;
  const normal: Vector2D = {
    x: dx / distance,
    y: dy / distance,
  };

  return {
    collided: true,
    overlap: {
      x: overlapAmount * Math.abs(normal.x),
      y: overlapAmount * Math.abs(normal.y),
    },
    normal,
  };
}

// ============================================================
// Point Collision
// ============================================================

/**
 * Check if a point is inside a rectangle
 */
export function pointInRect(point: Vector2D, rect: Rect): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

/**
 * Check if a point is inside a circle
 */
export function pointInCircle(point: Vector2D, circle: Circle): boolean {
  const dx = point.x - circle.x;
  const dy = point.y - circle.y;
  return dx * dx + dy * dy <= circle.radius * circle.radius;
}

// ============================================================
// Utility Functions
// ============================================================

/**
 * Clamp a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Get the center point of a rectangle
 */
export function getRectCenter(rect: Rect): Vector2D {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  };
}

/**
 * Create a rectangle from center point and dimensions
 */
export function rectFromCenter(center: Vector2D, width: number, height: number): Rect {
  return {
    x: center.x - width / 2,
    y: center.y - height / 2,
    width,
    height,
  };
}

/**
 * Expand a rectangle by a given amount on all sides
 */
export function expandRect(rect: Rect, amount: number): Rect {
  return {
    x: rect.x - amount,
    y: rect.y - amount,
    width: rect.width + amount * 2,
    height: rect.height + amount * 2,
  };
}
