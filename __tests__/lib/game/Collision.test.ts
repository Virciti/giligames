import { describe, it, expect } from 'vitest';
import {
  checkAABB,
  checkAABBDetailed,
  checkCircle,
  checkCircleDetailed,
  checkCircleAABB,
  checkCircleAABBDetailed,
  pointInRect,
  pointInCircle,
  getRectCenter,
  rectFromCenter,
  expandRect,
} from '@/lib/game/Collision';

describe('AABB Collision', () => {
  describe('checkAABB', () => {
    it('should detect overlapping rectangles', () => {
      const a = { x: 0, y: 0, width: 100, height: 100 };
      const b = { x: 50, y: 50, width: 100, height: 100 };
      expect(checkAABB(a, b)).toBe(true);
    });

    it('should not detect non-overlapping rectangles', () => {
      const a = { x: 0, y: 0, width: 50, height: 50 };
      const b = { x: 100, y: 100, width: 50, height: 50 };
      expect(checkAABB(a, b)).toBe(false);
    });

    it('should detect touching rectangles as overlapping', () => {
      const a = { x: 0, y: 0, width: 50, height: 50 };
      const b = { x: 49, y: 0, width: 50, height: 50 };
      expect(checkAABB(a, b)).toBe(true);
    });

    it('should not detect edge-touching rectangles', () => {
      const a = { x: 0, y: 0, width: 50, height: 50 };
      const b = { x: 50, y: 0, width: 50, height: 50 };
      expect(checkAABB(a, b)).toBe(false);
    });
  });

  describe('checkAABBDetailed', () => {
    it('should return collided=false for non-overlapping rectangles', () => {
      const a = { x: 0, y: 0, width: 50, height: 50 };
      const b = { x: 100, y: 100, width: 50, height: 50 };
      const result = checkAABBDetailed(a, b);
      expect(result.collided).toBe(false);
    });

    it('should return overlap and normal for overlapping rectangles', () => {
      const a = { x: 0, y: 0, width: 100, height: 100 };
      const b = { x: 90, y: 0, width: 100, height: 100 };
      const result = checkAABBDetailed(a, b);
      expect(result.collided).toBe(true);
      expect(result.overlap.x).toBeGreaterThan(0);
    });

    it('should calculate correct normal for horizontal collision', () => {
      const a = { x: 0, y: 0, width: 100, height: 100 };
      const b = { x: 95, y: 0, width: 100, height: 100 };
      const result = checkAABBDetailed(a, b);
      expect(result.normal.x).toBe(-1);
      expect(result.normal.y).toBe(0);
    });

    it('should calculate correct normal for vertical collision', () => {
      const a = { x: 0, y: 0, width: 100, height: 100 };
      const b = { x: 0, y: 95, width: 100, height: 100 };
      const result = checkAABBDetailed(a, b);
      expect(result.normal.x).toBe(0);
      expect(result.normal.y).toBe(-1);
    });
  });
});

describe('Circle Collision', () => {
  describe('checkCircle', () => {
    it('should detect overlapping circles', () => {
      const a = { x: 0, y: 0, radius: 50 };
      const b = { x: 75, y: 0, radius: 50 };
      expect(checkCircle(a, b)).toBe(true);
    });

    it('should not detect non-overlapping circles', () => {
      const a = { x: 0, y: 0, radius: 50 };
      const b = { x: 150, y: 0, radius: 50 };
      expect(checkCircle(a, b)).toBe(false);
    });

    it('should not detect touching circles', () => {
      const a = { x: 0, y: 0, radius: 50 };
      const b = { x: 100, y: 0, radius: 50 };
      expect(checkCircle(a, b)).toBe(false);
    });
  });

  describe('checkCircleDetailed', () => {
    it('should return collided=false for non-overlapping circles', () => {
      const a = { x: 0, y: 0, radius: 50 };
      const b = { x: 150, y: 0, radius: 50 };
      const result = checkCircleDetailed(a, b);
      expect(result.collided).toBe(false);
    });

    it('should return overlap for overlapping circles', () => {
      const a = { x: 0, y: 0, radius: 50 };
      const b = { x: 75, y: 0, radius: 50 };
      const result = checkCircleDetailed(a, b);
      expect(result.collided).toBe(true);
    });

    it('should handle circles at the same position', () => {
      const a = { x: 50, y: 50, radius: 25 };
      const b = { x: 50, y: 50, radius: 25 };
      const result = checkCircleDetailed(a, b);
      expect(result.collided).toBe(true);
      expect(result.normal.x).toBe(1);
    });
  });
});

describe('Circle-AABB Collision', () => {
  describe('checkCircleAABB', () => {
    it('should detect circle inside rectangle', () => {
      const circle = { x: 50, y: 50, radius: 25 };
      const rect = { x: 0, y: 0, width: 100, height: 100 };
      expect(checkCircleAABB(circle, rect)).toBe(true);
    });

    it('should detect circle overlapping rectangle edge', () => {
      const circle = { x: 110, y: 50, radius: 25 };
      const rect = { x: 0, y: 0, width: 100, height: 100 };
      expect(checkCircleAABB(circle, rect)).toBe(true);
    });

    it('should not detect circle outside rectangle', () => {
      const circle = { x: 150, y: 50, radius: 25 };
      const rect = { x: 0, y: 0, width: 100, height: 100 };
      expect(checkCircleAABB(circle, rect)).toBe(false);
    });
  });

  describe('checkCircleAABBDetailed', () => {
    it('should return collided=false for non-overlapping', () => {
      const circle = { x: 200, y: 200, radius: 25 };
      const rect = { x: 0, y: 0, width: 100, height: 100 };
      const result = checkCircleAABBDetailed(circle, rect);
      expect(result.collided).toBe(false);
    });

    it('should calculate normal for edge collision', () => {
      const circle = { x: 110, y: 50, radius: 25 };
      const rect = { x: 0, y: 0, width: 100, height: 100 };
      const result = checkCircleAABBDetailed(circle, rect);
      expect(result.collided).toBe(true);
      expect(result.normal.x).toBeGreaterThan(0);
    });
  });
});

describe('Point Collision', () => {
  describe('pointInRect', () => {
    it('should detect point inside rectangle', () => {
      const point = { x: 50, y: 50 };
      const rect = { x: 0, y: 0, width: 100, height: 100 };
      expect(pointInRect(point, rect)).toBe(true);
    });

    it('should detect point on rectangle edge', () => {
      const point = { x: 0, y: 50 };
      const rect = { x: 0, y: 0, width: 100, height: 100 };
      expect(pointInRect(point, rect)).toBe(true);
    });

    it('should not detect point outside rectangle', () => {
      const point = { x: 150, y: 50 };
      const rect = { x: 0, y: 0, width: 100, height: 100 };
      expect(pointInRect(point, rect)).toBe(false);
    });
  });

  describe('pointInCircle', () => {
    it('should detect point inside circle', () => {
      const point = { x: 50, y: 50 };
      const circle = { x: 50, y: 50, radius: 25 };
      expect(pointInCircle(point, circle)).toBe(true);
    });

    it('should detect point on circle edge', () => {
      const point = { x: 75, y: 50 };
      const circle = { x: 50, y: 50, radius: 25 };
      expect(pointInCircle(point, circle)).toBe(true);
    });

    it('should not detect point outside circle', () => {
      const point = { x: 100, y: 50 };
      const circle = { x: 50, y: 50, radius: 25 };
      expect(pointInCircle(point, circle)).toBe(false);
    });
  });
});

describe('Utility Functions', () => {
  describe('getRectCenter', () => {
    it('should return center of rectangle', () => {
      const rect = { x: 0, y: 0, width: 100, height: 50 };
      const center = getRectCenter(rect);
      expect(center.x).toBe(50);
      expect(center.y).toBe(25);
    });
  });

  describe('rectFromCenter', () => {
    it('should create rectangle from center', () => {
      const center = { x: 50, y: 50 };
      const rect = rectFromCenter(center, 100, 50);
      expect(rect.x).toBe(0);
      expect(rect.y).toBe(25);
      expect(rect.width).toBe(100);
      expect(rect.height).toBe(50);
    });
  });

  describe('expandRect', () => {
    it('should expand rectangle by given amount', () => {
      const rect = { x: 10, y: 10, width: 80, height: 80 };
      const expanded = expandRect(rect, 10);
      expect(expanded.x).toBe(0);
      expect(expanded.y).toBe(0);
      expect(expanded.width).toBe(100);
      expect(expanded.height).toBe(100);
    });
  });
});
