/**
 * StarCollectible - Collectible star entity with animation and collection detection
 */

import type { Vector2D, Rect, Camera } from '../types';

const STAR_SIZE = 24;
const ROTATION_SPEED = 2; // radians per second
const BOB_AMPLITUDE = 4;
const BOB_SPEED = 3;
const SPARKLE_COUNT = 4;

interface Sparkle {
  angle: number;
  distance: number;
  size: number;
  speed: number;
}

export interface StarCollectibleConfig {
  x: number;
  y: number;
  id?: string;
}

export class StarCollectible {
  public id: string;
  public position: Vector2D;
  public collected: boolean = false;

  // Animation state
  private rotation: number = 0;
  private bobOffset: number = 0;
  private bobTime: number = 0;
  private sparkles: Sparkle[];
  private collectAnimation: number = 0;
  private isCollecting: boolean = false;

  constructor(config: StarCollectibleConfig) {
    this.id = config.id || `star-${config.x}-${config.y}`;
    this.position = { x: config.x, y: config.y };

    // Initialize sparkles
    this.sparkles = [];
    for (let i = 0; i < SPARKLE_COUNT; i++) {
      this.sparkles.push({
        angle: (i / SPARKLE_COUNT) * Math.PI * 2,
        distance: STAR_SIZE * 0.6 + Math.random() * 4,
        size: 2 + Math.random() * 2,
        speed: 0.5 + Math.random() * 0.5,
      });
    }
  }

  /**
   * Get the star's bounding rectangle for collision detection
   */
  getBounds(): Rect {
    return {
      x: this.position.x - STAR_SIZE / 2,
      y: this.position.y - STAR_SIZE / 2 + this.bobOffset,
      width: STAR_SIZE,
      height: STAR_SIZE,
    };
  }

  /**
   * Check if the star collides with a truck bounding box
   */
  checkCollection(truckBounds: Rect): boolean {
    if (this.collected || this.isCollecting) return false;

    const starBounds = this.getBounds();

    // AABB collision check
    const collided =
      starBounds.x < truckBounds.x + truckBounds.width &&
      starBounds.x + starBounds.width > truckBounds.x &&
      starBounds.y < truckBounds.y + truckBounds.height &&
      starBounds.y + starBounds.height > truckBounds.y;

    if (collided) {
      this.isCollecting = true;
    }

    return collided;
  }

  /**
   * Update animation state
   */
  update(deltaTime: number): void {
    if (this.collected) return;

    // Update rotation
    this.rotation += ROTATION_SPEED * deltaTime;

    // Update bob animation
    this.bobTime += BOB_SPEED * deltaTime;
    this.bobOffset = Math.sin(this.bobTime) * BOB_AMPLITUDE;

    // Update sparkles
    for (const sparkle of this.sparkles) {
      sparkle.angle += sparkle.speed * deltaTime;
    }

    // Update collection animation
    if (this.isCollecting) {
      this.collectAnimation += deltaTime * 4;
      if (this.collectAnimation >= 1) {
        this.collected = true;
        this.isCollecting = false;
      }
    }
  }

  /**
   * Render the star
   */
  render(ctx: CanvasRenderingContext2D, camera: Camera): void {
    if (this.collected) return;

    const screenX = this.position.x - camera.position.x;
    const screenY = this.position.y - camera.position.y + this.bobOffset;

    ctx.save();

    // Apply collection animation (scale up and fade out)
    if (this.isCollecting) {
      const scale = 1 + this.collectAnimation * 0.5;
      const alpha = 1 - this.collectAnimation;
      ctx.globalAlpha = alpha;
      ctx.translate(screenX, screenY);
      ctx.scale(scale, scale);
      ctx.translate(-screenX, -screenY);
    }

    // Draw glow
    this.renderGlow(ctx, screenX, screenY);

    // Draw star
    this.renderStar(ctx, screenX, screenY);

    // Draw sparkles
    this.renderSparkles(ctx, screenX, screenY);

    ctx.restore();
  }

  /**
   * Render the star glow effect
   */
  private renderGlow(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, STAR_SIZE);
    gradient.addColorStop(0, 'rgba(255, 223, 0, 0.4)');
    gradient.addColorStop(0.5, 'rgba(255, 223, 0, 0.2)');
    gradient.addColorStop(1, 'rgba(255, 223, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, STAR_SIZE, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Render the star shape
   */
  private renderStar(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.rotation);

    // Draw 5-pointed star
    const outerRadius = STAR_SIZE / 2;
    const innerRadius = outerRadius * 0.4;
    const points = 5;

    // Star gradient fill
    const gradient = ctx.createRadialGradient(0, 0, innerRadius * 0.5, 0, 0, outerRadius);
    gradient.addColorStop(0, '#FFF176');
    gradient.addColorStop(0.5, '#FFD700');
    gradient.addColorStop(1, '#FFA000');

    ctx.fillStyle = gradient;
    ctx.beginPath();

    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;

      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }

    ctx.closePath();
    ctx.fill();

    // Star outline
    ctx.strokeStyle = '#FF8F00';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Center highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.arc(0, -2, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Render sparkle effects around the star
   */
  private renderSparkles(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.fillStyle = '#FFFFFF';

    for (const sparkle of this.sparkles) {
      const sx = x + Math.cos(sparkle.angle) * sparkle.distance;
      const sy = y + Math.sin(sparkle.angle) * sparkle.distance + this.bobOffset;
      const pulse = 0.5 + Math.sin(sparkle.angle * 2) * 0.5;
      const size = sparkle.size * pulse;

      // Draw 4-pointed sparkle
      ctx.beginPath();
      ctx.moveTo(sx - size, sy);
      ctx.lineTo(sx, sy - size * 0.5);
      ctx.lineTo(sx + size, sy);
      ctx.lineTo(sx, sy + size * 0.5);
      ctx.closePath();
      ctx.fill();
    }
  }

  /**
   * Reset the star to uncollected state
   */
  reset(): void {
    this.collected = false;
    this.isCollecting = false;
    this.collectAnimation = 0;
    this.rotation = 0;
    this.bobTime = 0;
    this.bobOffset = 0;
  }
}

/**
 * Create a new StarCollectible
 */
export function createStarCollectible(config: StarCollectibleConfig): StarCollectible {
  return new StarCollectible(config);
}
