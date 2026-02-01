/**
 * BoostPad - Speed boost pickup on race track
 *
 * Provides a temporary speed boost when trucks drive over it.
 * Features a glowing visual effect and cooldown timer.
 */

import type { Vector2D, Rect } from '../types';
import { checkAABB } from '../Collision';

export interface BoostPadConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  cooldown?: number; // Time before pad can be used again (per truck)
}

// Visual constants
const COLORS = {
  base: '#00AAFF',
  glow: '#00FFFF',
  inactive: '#666666',
  arrow: '#FFFFFF',
};

const GLOW_ANIMATION_SPEED = 3; // Cycles per second

export class BoostPad {
  public readonly position: Vector2D;
  public readonly width: number;
  public readonly height: number;
  public readonly cooldown: number;

  // Track which trucks have recently used this pad
  private usedBy: Map<string, number> = new Map(); // truckId -> cooldown timer

  // Animation state
  private glowPhase: number = 0;

  constructor(config: BoostPadConfig) {
    this.position = { x: config.x, y: config.y };
    this.width = config.width;
    this.height = config.height;
    this.cooldown = config.cooldown ?? 3; // Default 3 second cooldown
  }

  /**
   * Get the bounds rectangle
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
   * Check if a truck is colliding with this boost pad
   */
  checkCollision(truckBounds: Rect): boolean {
    return checkAABB(this.getBounds(), truckBounds);
  }

  /**
   * Check if the boost pad is active for a specific truck
   */
  isActiveFor(truckId: string): boolean {
    const cooldownRemaining = this.usedBy.get(truckId) ?? 0;
    return cooldownRemaining <= 0;
  }

  /**
   * Try to activate boost for a truck
   * Returns true if boost was applied, false if on cooldown
   */
  tryActivate(truckId: string): boolean {
    if (!this.isActiveFor(truckId)) {
      return false;
    }

    // Start cooldown for this truck
    this.usedBy.set(truckId, this.cooldown);
    return true;
  }

  /**
   * Update boost pad state
   */
  update(deltaTime: number): void {
    // Update animation
    this.glowPhase += deltaTime * GLOW_ANIMATION_SPEED * Math.PI * 2;
    if (this.glowPhase > Math.PI * 2) {
      this.glowPhase -= Math.PI * 2;
    }

    // Update cooldowns
    const toDelete: string[] = [];
    this.usedBy.forEach((remaining, truckId) => {
      if (remaining > 0) {
        const newRemaining = remaining - deltaTime;
        if (newRemaining <= 0) {
          toDelete.push(truckId);
        } else {
          this.usedBy.set(truckId, newRemaining);
        }
      }
    });
    toDelete.forEach((truckId) => this.usedBy.delete(truckId));
  }

  /**
   * Render the boost pad
   */
  render(ctx: CanvasRenderingContext2D): void {
    const bounds = this.getBounds();
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;

    // Calculate glow intensity
    const glowIntensity = 0.5 + Math.sin(this.glowPhase) * 0.5;

    // Draw outer glow
    const glowSize = 8 * glowIntensity;
    ctx.save();

    // Glow effect using shadow
    ctx.shadowColor = COLORS.glow;
    ctx.shadowBlur = 15 * glowIntensity;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Base rectangle with gradient
    const gradient = ctx.createLinearGradient(bounds.x, bounds.y, bounds.x + bounds.width, bounds.y + bounds.height);
    gradient.addColorStop(0, COLORS.base);
    gradient.addColorStop(0.5, COLORS.glow);
    gradient.addColorStop(1, COLORS.base);

    ctx.fillStyle = gradient;
    ctx.fillRect(bounds.x - glowSize / 2, bounds.y - glowSize / 2, bounds.width + glowSize, bounds.height + glowSize);

    ctx.restore();

    // Inner surface
    ctx.fillStyle = COLORS.base;
    ctx.globalAlpha = 0.8;
    ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
    ctx.globalAlpha = 1;

    // Border
    ctx.strokeStyle = COLORS.glow;
    ctx.lineWidth = 2;
    ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);

    // Draw arrows to indicate boost direction
    this.renderArrows(ctx, centerX, centerY);

    // Draw "BOOST" text
    ctx.fillStyle = COLORS.arrow;
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BOOST', centerX, centerY + bounds.height / 4);
  }

  /**
   * Render boost arrows
   */
  private renderArrows(ctx: CanvasRenderingContext2D, centerX: number, centerY: number): void {
    ctx.save();
    ctx.translate(centerX, centerY - 5);

    // Animate arrow position
    const arrowOffset = Math.sin(this.glowPhase) * 2;

    ctx.fillStyle = COLORS.arrow;
    ctx.globalAlpha = 0.9;

    // Draw upward-pointing arrow
    ctx.beginPath();
    ctx.moveTo(0, -8 + arrowOffset);
    ctx.lineTo(-8, 2 + arrowOffset);
    ctx.lineTo(-3, 2 + arrowOffset);
    ctx.lineTo(-3, 8 + arrowOffset);
    ctx.lineTo(3, 8 + arrowOffset);
    ctx.lineTo(3, 2 + arrowOffset);
    ctx.lineTo(8, 2 + arrowOffset);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  /**
   * Reset the boost pad (clear all cooldowns)
   */
  reset(): void {
    this.usedBy.clear();
    this.glowPhase = 0;
  }

  /**
   * Get cooldown remaining for a specific truck
   */
  getCooldownFor(truckId: string): number {
    return this.usedBy.get(truckId) ?? 0;
  }
}

/**
 * Create a new BoostPad instance
 */
export function createBoostPad(config: BoostPadConfig): BoostPad {
  return new BoostPad(config);
}

/**
 * Create multiple boost pads from an array of configs
 */
export function createBoostPads(
  configs: Array<{ x: number; y: number; width: number; height: number }>
): BoostPad[] {
  return configs.map((config) => createBoostPad(config));
}
