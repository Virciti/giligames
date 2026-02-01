/**
 * Platform - Static platform for the truck to land on
 */

import type { Rect, Camera } from '../types';

export interface PlatformConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  id?: string;
  color?: string;
  style?: 'solid' | 'metal' | 'dirt';
}

export class Platform {
  public id: string;
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  public color: string;
  public style: 'solid' | 'metal' | 'dirt';

  constructor(config: PlatformConfig) {
    this.id = config.id || `platform-${config.x}-${config.y}`;
    this.x = config.x;
    this.y = config.y;
    this.width = config.width;
    this.height = config.height;
    this.color = config.color || '#6B4423';
    this.style = config.style || 'solid';
  }

  /**
   * Get the platform's bounding rectangle for collision detection
   */
  getBounds(): Rect {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }

  /**
   * Render the platform
   */
  render(ctx: CanvasRenderingContext2D, camera: Camera): void {
    const screenX = this.x - camera.position.x;
    const screenY = this.y - camera.position.y;

    switch (this.style) {
      case 'metal':
        this.renderMetal(ctx, screenX, screenY);
        break;
      case 'dirt':
        this.renderDirt(ctx, screenX, screenY);
        break;
      default:
        this.renderSolid(ctx, screenX, screenY);
    }
  }

  /**
   * Render solid style platform
   */
  private renderSolid(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    // Main body
    ctx.fillStyle = this.color;
    ctx.fillRect(x, y, this.width, this.height);

    // Top highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(x, y, this.width, 3);

    // Bottom shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(x, y + this.height - 3, this.width, 3);

    // Left edge highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(x, y, 2, this.height);

    // Right edge shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(x + this.width - 2, y, 2, this.height);

    // Surface texture lines
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1;
    const lineSpacing = 12;
    for (let lx = x + lineSpacing; lx < x + this.width; lx += lineSpacing) {
      ctx.beginPath();
      ctx.moveTo(lx, y);
      ctx.lineTo(lx, y + this.height);
      ctx.stroke();
    }
  }

  /**
   * Render metal style platform
   */
  private renderMetal(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    // Main body with gradient
    const gradient = ctx.createLinearGradient(x, y, x, y + this.height);
    gradient.addColorStop(0, '#7A7A7A');
    gradient.addColorStop(0.3, '#5A5A5A');
    gradient.addColorStop(0.7, '#4A4A4A');
    gradient.addColorStop(1, '#3A3A3A');

    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, this.width, this.height);

    // Metal plate borders
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, this.width - 2, this.height - 2);

    // Rivets along the edge
    ctx.fillStyle = '#888';
    const rivetSpacing = 20;
    const rivetSize = 3;

    for (let rx = x + 8; rx < x + this.width - 8; rx += rivetSpacing) {
      // Top row
      ctx.beginPath();
      ctx.arc(rx, y + 5, rivetSize, 0, Math.PI * 2);
      ctx.fill();

      // Bottom row
      ctx.beginPath();
      ctx.arc(rx, y + this.height - 5, rivetSize, 0, Math.PI * 2);
      ctx.fill();
    }

    // Diamond plate pattern
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    const patternSize = 8;
    for (let py = y + 8; py < y + this.height - 8; py += patternSize) {
      for (let px = x + 4; px < x + this.width - 4; px += patternSize) {
        ctx.beginPath();
        ctx.moveTo(px, py - 2);
        ctx.lineTo(px + 3, py);
        ctx.lineTo(px, py + 2);
        ctx.lineTo(px - 3, py);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  /**
   * Render dirt style platform
   */
  private renderDirt(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    // Base dirt color
    ctx.fillStyle = '#8B6914';
    ctx.fillRect(x, y, this.width, this.height);

    // Top grass layer
    ctx.fillStyle = '#4A7C23';
    ctx.fillRect(x, y, this.width, 6);

    // Grass blades on top
    ctx.fillStyle = '#5A9C2D';
    const bladeWidth = 4;
    for (let bx = x; bx < x + this.width; bx += bladeWidth + 2) {
      const bladeHeight = 4 + Math.random() * 4;
      ctx.beginPath();
      ctx.moveTo(bx, y);
      ctx.lineTo(bx + bladeWidth / 2, y - bladeHeight);
      ctx.lineTo(bx + bladeWidth, y);
      ctx.closePath();
      ctx.fill();
    }

    // Dirt texture - darker spots
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    for (let i = 0; i < 10; i++) {
      const spotX = x + Math.random() * (this.width - 10);
      const spotY = y + 8 + Math.random() * (this.height - 12);
      const spotSize = 3 + Math.random() * 5;
      ctx.beginPath();
      ctx.ellipse(spotX, spotY, spotSize, spotSize * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Small rocks
    ctx.fillStyle = '#666';
    for (let i = 0; i < 5; i++) {
      const rockX = x + 5 + Math.random() * (this.width - 10);
      const rockY = y + 10 + Math.random() * (this.height - 14);
      const rockSize = 2 + Math.random() * 3;
      ctx.beginPath();
      ctx.arc(rockX, rockY, rockSize, 0, Math.PI * 2);
      ctx.fill();
    }

    // Bottom edge darker
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(x, y + this.height - 4, this.width, 4);
  }
}

/**
 * Create a new Platform
 */
export function createPlatform(config: PlatformConfig): Platform {
  return new Platform(config);
}
