/**
 * Obstacle - Crushable obstacles that give points when destroyed
 */

import type { Vector2D, Rect, Camera } from '../types';

export type ObstacleType = 'box' | 'barrel';

// Obstacle dimensions by type
const OBSTACLE_SIZES: Record<ObstacleType, { width: number; height: number }> = {
  box: { width: 40, height: 40 },
  barrel: { width: 32, height: 44 },
};

// Points awarded for crushing
const OBSTACLE_POINTS: Record<ObstacleType, number> = {
  box: 100,
  barrel: 150,
};

// Debris particle
interface Debris {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  size: number;
  color: string;
  life: number;
}

export interface ObstacleConfig {
  x: number;
  y: number;
  type: ObstacleType;
  id?: string;
}

export class Obstacle {
  public id: string;
  public position: Vector2D;
  public type: ObstacleType;
  public crushed: boolean = false;
  public points: number;

  // Dimensions
  public width: number;
  public height: number;

  // Animation
  private debris: Debris[] = [];
  private crushAnimation: number = 0;
  private isCrushing: boolean = false;
  private shakeOffset: Vector2D = { x: 0, y: 0 };

  constructor(config: ObstacleConfig) {
    this.id = config.id || `obstacle-${config.x}-${config.y}`;
    this.position = { x: config.x, y: config.y };
    this.type = config.type;
    this.points = OBSTACLE_POINTS[config.type];

    const size = OBSTACLE_SIZES[config.type];
    this.width = size.width;
    this.height = size.height;
  }

  /**
   * Get the obstacle's bounding rectangle
   */
  getBounds(): Rect {
    return {
      x: this.position.x,
      y: this.position.y,
      width: this.width,
      height: this.height,
    };
  }

  /**
   * Check collision with truck and crush if hit with enough force
   */
  checkCrush(truckBounds: Rect, truckVelocity: Vector2D): boolean {
    if (this.crushed || this.isCrushing) return false;

    const bounds = this.getBounds();

    // AABB collision check
    const collided =
      bounds.x < truckBounds.x + truckBounds.width &&
      bounds.x + bounds.width > truckBounds.x &&
      bounds.y < truckBounds.y + truckBounds.height &&
      bounds.y + bounds.height > truckBounds.y;

    if (!collided) return false;

    // Check if truck has enough velocity to crush (either fast horizontal or falling)
    const speed = Math.sqrt(truckVelocity.x ** 2 + truckVelocity.y ** 2);
    const minCrushSpeed = 150;

    if (speed >= minCrushSpeed) {
      this.crush(truckVelocity);
      return true;
    }

    return false;
  }

  /**
   * Crush the obstacle and create debris
   */
  private crush(impactVelocity: Vector2D): void {
    this.isCrushing = true;

    // Create debris particles
    const debrisCount = 8 + Math.floor(Math.random() * 6);
    const colors = this.type === 'box'
      ? ['#8B4513', '#A0522D', '#CD853F', '#DEB887']
      : ['#4A4A4A', '#5A5A5A', '#6A6A6A', '#7A7A7A'];

    const centerX = this.position.x + this.width / 2;
    const centerY = this.position.y + this.height / 2;

    for (let i = 0; i < debrisCount; i++) {
      const angle = (i / debrisCount) * Math.PI * 2 + Math.random() * 0.5;
      const speed = 100 + Math.random() * 200;

      // Add impact velocity influence
      const vx = Math.cos(angle) * speed + impactVelocity.x * 0.3;
      const vy = Math.sin(angle) * speed - 100 - Math.random() * 100;

      this.debris.push({
        x: centerX + (Math.random() - 0.5) * this.width,
        y: centerY + (Math.random() - 0.5) * this.height,
        vx,
        vy,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 15,
        size: 6 + Math.random() * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 0.8 + Math.random() * 0.4,
      });
    }
  }

  /**
   * Update obstacle state
   */
  update(deltaTime: number): void {
    if (this.crushed) return;

    // Update crushing animation
    if (this.isCrushing) {
      this.crushAnimation += deltaTime * 3;

      // Update debris
      for (let i = this.debris.length - 1; i >= 0; i--) {
        const d = this.debris[i];
        d.x += d.vx * deltaTime;
        d.y += d.vy * deltaTime;
        d.vy += 500 * deltaTime; // Gravity
        d.rotation += d.rotationSpeed * deltaTime;
        d.life -= deltaTime;

        if (d.life <= 0) {
          this.debris.splice(i, 1);
        }
      }

      // Mark as crushed when animation is complete
      if (this.crushAnimation >= 1 && this.debris.length === 0) {
        this.crushed = true;
        this.isCrushing = false;
      }
    } else {
      // Subtle idle animation - slight shake
      this.shakeOffset.x = Math.sin(Date.now() * 0.01) * 0.5;
    }
  }

  /**
   * Render the obstacle
   */
  render(ctx: CanvasRenderingContext2D, camera: Camera): void {
    const screenX = this.position.x - camera.position.x + this.shakeOffset.x;
    const screenY = this.position.y - camera.position.y + this.shakeOffset.y;

    // Render debris particles
    this.renderDebris(ctx, camera);

    // Don't render main obstacle if crushing is far along
    if (this.isCrushing && this.crushAnimation > 0.3) return;
    if (this.crushed) return;

    ctx.save();

    // Apply crush animation (squish and fade)
    if (this.isCrushing) {
      const squish = 1 - this.crushAnimation * 0.5;
      const alpha = 1 - this.crushAnimation;
      ctx.globalAlpha = alpha;
      ctx.translate(screenX + this.width / 2, screenY + this.height);
      ctx.scale(1 + this.crushAnimation * 0.3, squish);
      ctx.translate(-(screenX + this.width / 2), -(screenY + this.height));
    }

    if (this.type === 'box') {
      this.renderBox(ctx, screenX, screenY);
    } else {
      this.renderBarrel(ctx, screenX, screenY);
    }

    ctx.restore();
  }

  /**
   * Render a box obstacle
   */
  private renderBox(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    // Main box
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x, y, this.width, this.height);

    // Lighter top face
    ctx.fillStyle = '#A0522D';
    ctx.fillRect(x + 2, y + 2, this.width - 4, 8);

    // Darker bottom edge
    ctx.fillStyle = '#654321';
    ctx.fillRect(x, y + this.height - 4, this.width, 4);

    // Wood grain lines
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 1;

    // Horizontal planks
    ctx.beginPath();
    ctx.moveTo(x, y + this.height / 3);
    ctx.lineTo(x + this.width, y + this.height / 3);
    ctx.moveTo(x, y + (this.height * 2) / 3);
    ctx.lineTo(x + this.width, y + (this.height * 2) / 3);
    ctx.stroke();

    // Cross braces
    ctx.strokeStyle = '#5D4037';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 4, y + 4);
    ctx.lineTo(x + this.width - 4, y + this.height - 4);
    ctx.moveTo(x + this.width - 4, y + 4);
    ctx.lineTo(x + 4, y + this.height - 4);
    ctx.stroke();

    // Nails
    ctx.fillStyle = '#333';
    const nailPositions = [
      [6, 6], [this.width - 6, 6],
      [6, this.height - 6], [this.width - 6, this.height - 6]
    ];
    for (const [nx, ny] of nailPositions) {
      ctx.beginPath();
      ctx.arc(x + nx, y + ny, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * Render a barrel obstacle
   */
  private renderBarrel(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const cx = x + this.width / 2;

    // Main barrel body
    ctx.fillStyle = '#5A5A5A';
    ctx.beginPath();
    ctx.ellipse(cx, y + 4, this.width / 2, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Barrel cylinder
    ctx.fillStyle = '#4A4A4A';
    ctx.fillRect(x, y + 4, this.width, this.height - 8);

    // Bottom ellipse
    ctx.fillStyle = '#3A3A3A';
    ctx.beginPath();
    ctx.ellipse(cx, y + this.height - 4, this.width / 2, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Metal bands
    ctx.strokeStyle = '#777';
    ctx.lineWidth = 3;

    const bandPositions = [y + 8, y + this.height / 2, y + this.height - 8];
    for (const by of bandPositions) {
      ctx.beginPath();
      ctx.moveTo(x + 2, by);
      ctx.lineTo(x + this.width - 2, by);
      ctx.stroke();
    }

    // Rivets on bands
    ctx.fillStyle = '#888';
    for (const by of bandPositions) {
      ctx.beginPath();
      ctx.arc(x + 5, by, 2, 0, Math.PI * 2);
      ctx.arc(x + this.width - 5, by, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(x + 4, y + 10, 6, this.height - 20);
  }

  /**
   * Render debris particles
   */
  private renderDebris(ctx: CanvasRenderingContext2D, camera: Camera): void {
    for (const d of this.debris) {
      const sx = d.x - camera.position.x;
      const sy = d.y - camera.position.y;
      const alpha = Math.min(1, d.life);

      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(d.rotation);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = d.color;
      ctx.fillRect(-d.size / 2, -d.size / 2, d.size, d.size);
      ctx.restore();
    }
  }

  /**
   * Reset the obstacle to original state
   */
  reset(): void {
    this.crushed = false;
    this.isCrushing = false;
    this.crushAnimation = 0;
    this.debris = [];
    this.shakeOffset = { x: 0, y: 0 };
  }
}

/**
 * Create a new Obstacle
 */
export function createObstacle(config: ObstacleConfig): Obstacle {
  return new Obstacle(config);
}
