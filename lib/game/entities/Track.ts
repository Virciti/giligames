/**
 * Track - Race track rendering and collision
 *
 * Renders different track types (oval, figure8, winding, stadium) with
 * road surface, boundaries, and start/finish line. Provides waypoints
 * for AI and collision boundaries for keeping trucks on track.
 */

import type { Vector2D, Rect } from '../types';
import { Vec2 } from '../Physics';

export type TrackType = 'oval' | 'figure8' | 'winding' | 'stadium';

export interface TrackConfig {
  trackType: TrackType;
  waypoints: Vector2D[];
  trackWidth: number;
  laps: number;
}

// Track colors
const TRACK_COLORS = {
  road: '#444444',
  roadStripe: '#FFFFFF',
  boundary: '#CC0000',
  grass: '#4CAF50',
  startFinish: '#FFFFFF',
  startFinishAlt: '#000000',
  checkpoint: 'rgba(255, 255, 0, 0.3)',
};

export class Track {
  public readonly trackType: TrackType;
  public readonly waypoints: Vector2D[];
  public readonly trackWidth: number;
  public readonly laps: number;

  // Calculated track properties
  private trackSegments: Array<{ start: Vector2D; end: Vector2D; angle: number }> = [];
  private bounds: Rect = { x: 0, y: 0, width: 0, height: 0 };

  constructor(config: TrackConfig) {
    this.trackType = config.trackType;
    this.waypoints = config.waypoints;
    this.trackWidth = config.trackWidth;
    this.laps = config.laps;

    this.calculateSegments();
    this.calculateBounds();
  }

  /**
   * Calculate track segments from waypoints
   */
  private calculateSegments(): void {
    this.trackSegments = [];

    for (let i = 0; i < this.waypoints.length; i++) {
      const start = this.waypoints[i];
      const end = this.waypoints[(i + 1) % this.waypoints.length];
      const angle = Math.atan2(end.y - start.y, end.x - start.x);

      this.trackSegments.push({ start, end, angle });
    }
  }

  /**
   * Calculate bounding box of track
   */
  private calculateBounds(): void {
    if (this.waypoints.length === 0) return;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const point of this.waypoints) {
      minX = Math.min(minX, point.x - this.trackWidth);
      minY = Math.min(minY, point.y - this.trackWidth);
      maxX = Math.max(maxX, point.x + this.trackWidth);
      maxY = Math.max(maxY, point.y + this.trackWidth);
    }

    this.bounds = {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  /**
   * Get track bounds
   */
  getBounds(): Rect {
    return { ...this.bounds };
  }

  /**
   * Get starting positions for trucks
   */
  getStartPositions(count: number): Array<{ position: Vector2D; rotation: number }> {
    if (this.waypoints.length < 2) {
      return Array(count)
        .fill(null)
        .map(() => ({
          position: { x: 0, y: 0 },
          rotation: 0,
        }));
    }

    const startSegment = this.trackSegments[0];
    const startAngle = startSegment.angle;
    const perpAngle = startAngle + Math.PI / 2;

    const positions: Array<{ position: Vector2D; rotation: number }> = [];

    // Position trucks in a grid behind start line
    const rows = Math.ceil(count / 2);
    const spacing = 50; // Space between trucks
    const rowSpacing = 60; // Space between rows

    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / 2);
      const col = i % 2;

      // Offset perpendicular to track direction
      const perpOffset = (col - 0.5) * spacing;
      // Offset along track (behind start line)
      const alongOffset = -row * rowSpacing - 30;

      const position = {
        x: startSegment.start.x + Math.cos(startAngle) * alongOffset + Math.cos(perpAngle) * perpOffset,
        y: startSegment.start.y + Math.sin(startAngle) * alongOffset + Math.sin(perpAngle) * perpOffset,
      };

      positions.push({
        position,
        rotation: startAngle,
      });
    }

    return positions;
  }

  /**
   * Get checkpoint index for a position
   * Returns the index of the nearest checkpoint/waypoint ahead
   */
  getCheckpointIndex(position: Vector2D, currentIndex: number): number {
    const nextIndex = (currentIndex + 1) % this.waypoints.length;
    const currentWaypoint = this.waypoints[currentIndex];
    const nextWaypoint = this.waypoints[nextIndex];

    // Check if passed through the checkpoint line
    const toPosition = Vec2.subtract(position, currentWaypoint);
    const toNext = Vec2.subtract(nextWaypoint, currentWaypoint);
    const segmentLength = Vec2.length(toNext);

    if (segmentLength === 0) return currentIndex;

    // Project position onto segment
    const dot = Vec2.dot(toPosition, toNext) / (segmentLength * segmentLength);

    // If past 70% of segment, consider checkpoint passed
    if (dot > 0.7) {
      return nextIndex;
    }

    return currentIndex;
  }

  /**
   * Check if a position is on the track
   */
  isOnTrack(position: Vector2D): boolean {
    const halfWidth = this.trackWidth / 2;

    // Check distance to each segment
    for (const segment of this.trackSegments) {
      const dist = this.pointToSegmentDistance(position, segment.start, segment.end);
      if (dist < halfWidth) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get distance from track center (negative if on track)
   */
  getDistanceFromCenter(position: Vector2D): number {
    let minDist = Infinity;

    for (const segment of this.trackSegments) {
      const dist = this.pointToSegmentDistance(position, segment.start, segment.end);
      minDist = Math.min(minDist, dist);
    }

    return minDist;
  }

  /**
   * Calculate distance from point to line segment
   */
  private pointToSegmentDistance(point: Vector2D, start: Vector2D, end: Vector2D): number {
    const segment = Vec2.subtract(end, start);
    const pointToStart = Vec2.subtract(point, start);

    const segmentLengthSq = Vec2.lengthSquared(segment);
    if (segmentLengthSq === 0) {
      return Vec2.length(pointToStart);
    }

    // Project point onto segment
    let t = Vec2.dot(pointToStart, segment) / segmentLengthSq;
    t = Math.max(0, Math.min(1, t));

    const projection = {
      x: start.x + t * segment.x,
      y: start.y + t * segment.y,
    };

    return Vec2.distance(point, projection);
  }

  /**
   * Check if crossed start/finish line (for lap counting)
   */
  crossedStartFinish(prevPosition: Vector2D, currentPosition: Vector2D): boolean {
    if (this.waypoints.length < 2) return false;

    const start = this.waypoints[0];
    const nextWaypoint = this.waypoints[1];
    const direction = Vec2.subtract(nextWaypoint, start);
    const perpendicular = { x: -direction.y, y: direction.x };
    const perpNorm = Vec2.normalize(perpendicular);

    // Create line perpendicular to track at start
    const halfWidth = this.trackWidth / 2 + 20;
    const lineStart = {
      x: start.x + perpNorm.x * halfWidth,
      y: start.y + perpNorm.y * halfWidth,
    };
    const lineEnd = {
      x: start.x - perpNorm.x * halfWidth,
      y: start.y - perpNorm.y * halfWidth,
    };

    // Check if movement crosses the line in correct direction
    return this.linesCross(prevPosition, currentPosition, lineStart, lineEnd);
  }

  /**
   * Check if two line segments cross
   */
  private linesCross(a1: Vector2D, a2: Vector2D, b1: Vector2D, b2: Vector2D): boolean {
    const d1 = this.crossProduct(Vec2.subtract(b2, b1), Vec2.subtract(a1, b1));
    const d2 = this.crossProduct(Vec2.subtract(b2, b1), Vec2.subtract(a2, b1));
    const d3 = this.crossProduct(Vec2.subtract(a2, a1), Vec2.subtract(b1, a1));
    const d4 = this.crossProduct(Vec2.subtract(a2, a1), Vec2.subtract(b2, a1));

    if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
      return true;
    }

    return false;
  }

  /**
   * 2D cross product (z-component of 3D cross)
   */
  private crossProduct(a: Vector2D, b: Vector2D): number {
    return a.x * b.y - a.y * b.x;
  }

  /**
   * Render the track
   */
  render(ctx: CanvasRenderingContext2D): void {
    // Draw grass background
    ctx.fillStyle = TRACK_COLORS.grass;
    ctx.fillRect(this.bounds.x - 50, this.bounds.y - 50, this.bounds.width + 100, this.bounds.height + 100);

    // Draw track surface
    this.renderTrackSurface(ctx);

    // Draw center line (dashed)
    this.renderCenterLine(ctx);

    // Draw boundaries
    this.renderBoundaries(ctx);

    // Draw start/finish line
    this.renderStartFinish(ctx);

    // Draw waypoint markers (debug, can be removed)
    // this.renderWaypoints(ctx);
  }

  /**
   * Render track surface
   */
  private renderTrackSurface(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = TRACK_COLORS.road;
    ctx.lineWidth = this.trackWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(this.waypoints[0].x, this.waypoints[0].y);

    for (let i = 1; i < this.waypoints.length; i++) {
      ctx.lineTo(this.waypoints[i].x, this.waypoints[i].y);
    }

    // Close the loop
    ctx.lineTo(this.waypoints[0].x, this.waypoints[0].y);
    ctx.stroke();
  }

  /**
   * Render center line (dashed)
   */
  private renderCenterLine(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = TRACK_COLORS.roadStripe;
    ctx.lineWidth = 2;
    ctx.setLineDash([20, 20]);
    ctx.lineCap = 'butt';

    ctx.beginPath();
    ctx.moveTo(this.waypoints[0].x, this.waypoints[0].y);

    for (let i = 1; i < this.waypoints.length; i++) {
      ctx.lineTo(this.waypoints[i].x, this.waypoints[i].y);
    }

    ctx.lineTo(this.waypoints[0].x, this.waypoints[0].y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  /**
   * Render track boundaries (edges)
   */
  private renderBoundaries(ctx: CanvasRenderingContext2D): void {
    const halfWidth = this.trackWidth / 2;

    // Draw outer and inner boundaries
    for (const offset of [1, -1]) {
      ctx.strokeStyle = TRACK_COLORS.boundary;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();

      for (let i = 0; i < this.waypoints.length; i++) {
        const curr = this.waypoints[i];
        const next = this.waypoints[(i + 1) % this.waypoints.length];
        const prev = this.waypoints[(i - 1 + this.waypoints.length) % this.waypoints.length];

        // Calculate perpendicular direction (average of adjacent segments)
        const toPrev = Vec2.normalize(Vec2.subtract(prev, curr));
        const toNext = Vec2.normalize(Vec2.subtract(next, curr));

        // Average perpendicular
        let perpX = -(toPrev.y + toNext.y) / 2;
        let perpY = (toPrev.x + toNext.x) / 2;
        const perpLen = Math.sqrt(perpX * perpX + perpY * perpY);
        if (perpLen > 0) {
          perpX /= perpLen;
          perpY /= perpLen;
        }

        const edgeX = curr.x + perpX * halfWidth * offset;
        const edgeY = curr.y + perpY * halfWidth * offset;

        if (i === 0) {
          ctx.moveTo(edgeX, edgeY);
        } else {
          ctx.lineTo(edgeX, edgeY);
        }
      }

      // Close boundary loop
      const first = this.waypoints[0];
      const second = this.waypoints[1];
      const last = this.waypoints[this.waypoints.length - 1];

      const toPrev = Vec2.normalize(Vec2.subtract(last, first));
      const toNext = Vec2.normalize(Vec2.subtract(second, first));

      let perpX = -(toPrev.y + toNext.y) / 2;
      let perpY = (toPrev.x + toNext.x) / 2;
      const perpLen = Math.sqrt(perpX * perpX + perpY * perpY);
      if (perpLen > 0) {
        perpX /= perpLen;
        perpY /= perpLen;
      }

      const edgeX = first.x + perpX * halfWidth * offset;
      const edgeY = first.y + perpY * halfWidth * offset;
      ctx.lineTo(edgeX, edgeY);

      ctx.stroke();
    }
  }

  /**
   * Render start/finish line
   */
  private renderStartFinish(ctx: CanvasRenderingContext2D): void {
    if (this.waypoints.length < 2) return;

    const start = this.waypoints[0];
    const next = this.waypoints[1];
    const direction = Vec2.normalize(Vec2.subtract(next, start));
    const perpendicular = { x: -direction.y, y: direction.x };

    const halfWidth = this.trackWidth / 2;

    // Draw checkered pattern
    const checkerSize = 10;
    const numCheckers = Math.floor(this.trackWidth / checkerSize);

    for (let i = 0; i < numCheckers; i++) {
      const offset = (i - numCheckers / 2 + 0.5) * checkerSize;
      const x = start.x + perpendicular.x * offset;
      const y = start.y + perpendicular.y * offset;

      // Draw 2x2 checker pattern
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 2; col++) {
          const isWhite = (i + row + col) % 2 === 0;
          ctx.fillStyle = isWhite ? TRACK_COLORS.startFinish : TRACK_COLORS.startFinishAlt;

          const checkX = x + direction.x * (row - 0.5) * checkerSize;
          const checkY = y + direction.y * (row - 0.5) * checkerSize;

          ctx.save();
          ctx.translate(checkX, checkY);
          ctx.rotate(Math.atan2(direction.y, direction.x));
          ctx.fillRect(-checkerSize / 2, -checkerSize / 2, checkerSize, checkerSize);
          ctx.restore();
        }
      }
    }
  }

  /**
   * Render waypoints (for debugging)
   */
  renderWaypoints(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';

    for (let i = 0; i < this.waypoints.length; i++) {
      const wp = this.waypoints[i];
      ctx.beginPath();
      ctx.arc(wp.x, wp.y, 10, 0, Math.PI * 2);
      ctx.fill();

      // Draw index
      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      ctx.fillText(String(i), wp.x - 4, wp.y + 4);
      ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
    }
  }
}

/**
 * Create a new Track instance
 */
export function createTrack(config: TrackConfig): Track {
  return new Track(config);
}
