/**
 * Ramp - Angled surface that launches the truck into the air
 */

import type { Rect, Vector2D, Camera } from '../types';
import { TruckEntity } from './TruckEntity';

export interface RampConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number; // degrees, positive = sloping up to right, negative = sloping up to left
  id?: string;
  color?: string;
}

export class Ramp {
  public id: string;
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  public angle: number;
  public color: string;

  // Calculated properties
  private angleRad: number;
  private launchForce: number;
  private slopeNormal: Vector2D;

  constructor(config: RampConfig) {
    this.id = config.id || `ramp-${config.x}-${config.y}`;
    this.x = config.x;
    this.y = config.y;
    this.width = config.width;
    this.height = config.height;
    this.angle = config.angle;
    this.color = config.color || '#D4A574';

    // Calculate angle in radians
    this.angleRad = (config.angle * Math.PI) / 180;

    // Calculate launch force based on angle (steeper = more force)
    this.launchForce = 300 + Math.abs(config.angle) * 8;

    // Calculate slope normal for collision response
    // The normal points perpendicular to the ramp surface, upward
    this.slopeNormal = {
      x: Math.sin(this.angleRad),
      y: -Math.cos(this.angleRad),
    };
  }

  /**
   * Get the ramp's bounding rectangle for collision detection
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
   * Check if truck is on the ramp and apply launch force
   * Returns true if truck is on the ramp
   */
  checkAndApplyLaunch(truck: TruckEntity): boolean {
    const truckBounds = truck.getBounds();
    const rampBounds = this.getBounds();

    // Check AABB overlap first
    const overlaps =
      truckBounds.x < rampBounds.x + rampBounds.width &&
      truckBounds.x + truckBounds.width > rampBounds.x &&
      truckBounds.y + truckBounds.height > rampBounds.y &&
      truckBounds.y < rampBounds.y + rampBounds.height;

    if (!overlaps) return false;

    // Calculate truck's horizontal position relative to ramp
    const truckCenterX = truckBounds.x + truckBounds.width / 2;
    const relativeX = (truckCenterX - this.x) / this.width;

    // Check if truck is moving in the correct direction to use the ramp
    const movingCorrectly = this.angle > 0
      ? truck.body.velocity.x > 50  // Moving right on right-facing ramp
      : truck.body.velocity.x < -50; // Moving left on left-facing ramp

    // Calculate the expected Y position on the ramp slope
    let rampSurfaceY: number;
    if (this.angle > 0) {
      // Ramp slopes up to the right
      rampSurfaceY = this.y + this.height - (relativeX * this.height);
    } else {
      // Ramp slopes up to the left
      rampSurfaceY = this.y + (relativeX * this.height);
    }

    // Check if truck is near the ramp surface
    const truckBottom = truckBounds.y + truckBounds.height;
    const onRamp = truckBottom >= rampSurfaceY - 10 && truckBottom <= rampSurfaceY + 20;

    if (onRamp && movingCorrectly) {
      // Apply launch force - stronger when moving faster
      const speedFactor = Math.min(1.5, Math.abs(truck.body.velocity.x) / 200);
      const adjustedForce = this.launchForce * speedFactor;

      truck.applyLaunchForce(adjustedForce);

      // Add some horizontal boost in the direction of travel
      const horizontalBoost = Math.sign(truck.body.velocity.x) * 50;
      truck.body.velocity.x += horizontalBoost;

      return true;
    }

    return onRamp;
  }

  /**
   * Get collision surface for precise physics
   */
  getSurfaceY(x: number): number {
    const relativeX = Math.max(0, Math.min(1, (x - this.x) / this.width));

    if (this.angle > 0) {
      // Slopes up to right
      return this.y + this.height - (relativeX * this.height);
    } else {
      // Slopes up to left
      return this.y + (relativeX * this.height);
    }
  }

  /**
   * Render the ramp
   */
  render(ctx: CanvasRenderingContext2D, camera: Camera): void {
    const screenX = this.x - camera.position.x;
    const screenY = this.y - camera.position.y;

    ctx.save();

    // Draw ramp shape (triangle)
    ctx.beginPath();

    if (this.angle > 0) {
      // Slopes up to the right
      ctx.moveTo(screenX, screenY + this.height);                    // Bottom left
      ctx.lineTo(screenX + this.width, screenY);                     // Top right
      ctx.lineTo(screenX + this.width, screenY + this.height);       // Bottom right
    } else {
      // Slopes up to the left
      ctx.moveTo(screenX, screenY);                                  // Top left
      ctx.lineTo(screenX + this.width, screenY + this.height);       // Bottom right
      ctx.lineTo(screenX, screenY + this.height);                    // Bottom left
    }

    ctx.closePath();

    // Fill with gradient
    const gradient = ctx.createLinearGradient(
      screenX, screenY,
      screenX, screenY + this.height
    );
    gradient.addColorStop(0, this.color);
    gradient.addColorStop(1, this.darkenColor(this.color, 30));

    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw surface line (the actual ramp surface)
    ctx.strokeStyle = this.lightenColor(this.color, 20);
    ctx.lineWidth = 3;
    ctx.beginPath();

    if (this.angle > 0) {
      ctx.moveTo(screenX, screenY + this.height);
      ctx.lineTo(screenX + this.width, screenY);
    } else {
      ctx.moveTo(screenX, screenY);
      ctx.lineTo(screenX + this.width, screenY + this.height);
    }
    ctx.stroke();

    // Draw grip lines on surface
    this.renderGripLines(ctx, screenX, screenY);

    // Draw direction arrow
    this.renderArrow(ctx, screenX, screenY);

    ctx.restore();
  }

  /**
   * Render grip lines on the ramp surface
   */
  private renderGripLines(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 2;

    const lineCount = Math.floor(this.width / 15);

    for (let i = 1; i < lineCount; i++) {
      const progress = i / lineCount;

      let startX, startY, endX, endY;

      if (this.angle > 0) {
        startX = x + progress * this.width;
        startY = y + this.height - progress * this.height;
        endX = startX;
        endY = y + this.height;
      } else {
        startX = x + progress * this.width;
        startY = y + progress * this.height;
        endX = startX;
        endY = y + this.height;
      }

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }
  }

  /**
   * Render direction arrow on ramp
   */
  private renderArrow(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const centerX = x + this.width / 2;
    const centerY = y + this.height * 0.6;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(this.angleRad);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(0, -8);
    ctx.lineTo(0, 8);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  /**
   * Darken a hex color
   */
  private darkenColor(color: string, amount: number): string {
    const hex = color.replace('#', '');
    const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - amount);
    const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - amount);
    const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - amount);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  /**
   * Lighten a hex color
   */
  private lightenColor(color: string, amount: number): string {
    const hex = color.replace('#', '');
    const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + amount);
    const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + amount);
    const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + amount);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
}

/**
 * Create a new Ramp
 */
export function createRamp(config: RampConfig): Ramp {
  return new Ramp(config);
}
