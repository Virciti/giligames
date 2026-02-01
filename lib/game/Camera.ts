/**
 * Camera - Viewport/camera for larger arenas with smooth following
 */

import type { Vector2D, Rect, CameraConfig, Camera as CameraState } from './types';
import { Vec2 } from './Physics';

// ============================================================
// Default Configuration
// ============================================================

const DEFAULT_CONFIG: CameraConfig = {
  viewportWidth: 800,
  viewportHeight: 600,
  followSpeed: 0.1,
};

// ============================================================
// Camera Class
// ============================================================

export class Camera {
  private config: CameraConfig;
  private state: CameraState;
  private target: Vector2D | null = null;
  private shakeIntensity: number = 0;
  private shakeDuration: number = 0;
  private shakeElapsed: number = 0;

  constructor(config: Partial<CameraConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = {
      position: Vec2.zero(),
      zoom: 1,
      rotation: 0,
      viewport: {
        x: 0,
        y: 0,
        width: this.config.viewportWidth,
        height: this.config.viewportHeight,
      },
    };
  }

  /**
   * Update camera state (call once per frame)
   */
  update(deltaTime: number): void {
    // Follow target if set
    if (this.target) {
      this.followTarget(deltaTime);
    }

    // Apply shake
    if (this.shakeDuration > 0) {
      this.applyShake(deltaTime);
    }

    // Update viewport based on position
    this.updateViewport();
  }

  /**
   * Set a target for the camera to follow
   */
  setTarget(target: Vector2D | null): void {
    this.target = target;
  }

  /**
   * Immediately center on a position
   */
  centerOn(position: Vector2D): void {
    this.state.position = {
      x: position.x - this.config.viewportWidth / 2,
      y: position.y - this.config.viewportHeight / 2,
    };
    this.clampToBounds();
    this.updateViewport();
  }

  /**
   * Set camera position directly
   */
  setPosition(position: Vector2D): void {
    this.state.position = Vec2.clone(position);
    this.clampToBounds();
    this.updateViewport();
  }

  /**
   * Get current camera position (top-left of viewport in world coords)
   */
  getPosition(): Readonly<Vector2D> {
    return { ...this.state.position };
  }

  /**
   * Get current viewport rectangle in world coordinates
   */
  getViewport(): Readonly<Rect> {
    return { ...this.state.viewport };
  }

  /**
   * Get camera zoom level
   */
  getZoom(): number {
    return this.state.zoom;
  }

  /**
   * Set camera zoom level
   */
  setZoom(zoom: number): void {
    this.state.zoom = Math.max(0.1, Math.min(10, zoom));
  }

  /**
   * Set world bounds (camera won't show outside these)
   */
  setWorldBounds(bounds: Rect): void {
    this.config.worldBounds = bounds;
    this.clampToBounds();
  }

  /**
   * Set follow speed (0-1, higher = more responsive)
   */
  setFollowSpeed(speed: number): void {
    this.config.followSpeed = Math.max(0, Math.min(1, speed));
  }

  /**
   * Set dead zone (area where target can move without camera following)
   */
  setDeadZone(deadZone: Rect): void {
    this.config.deadZone = deadZone;
  }

  /**
   * Start camera shake effect
   */
  shake(intensity: number, duration: number): void {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeElapsed = 0;
  }

  /**
   * Stop camera shake immediately
   */
  stopShake(): void {
    this.shakeDuration = 0;
    this.shakeIntensity = 0;
  }

  /**
   * Convert world coordinates to screen coordinates
   */
  worldToScreen(worldPos: Vector2D): Vector2D {
    return {
      x: (worldPos.x - this.state.position.x) * this.state.zoom,
      y: (worldPos.y - this.state.position.y) * this.state.zoom,
    };
  }

  /**
   * Convert screen coordinates to world coordinates
   */
  screenToWorld(screenPos: Vector2D): Vector2D {
    return {
      x: screenPos.x / this.state.zoom + this.state.position.x,
      y: screenPos.y / this.state.zoom + this.state.position.y,
    };
  }

  /**
   * Check if a rectangle is visible in the current viewport
   */
  isVisible(rect: Rect): boolean {
    const viewport = this.state.viewport;
    return (
      rect.x + rect.width > viewport.x &&
      rect.x < viewport.x + viewport.width &&
      rect.y + rect.height > viewport.y &&
      rect.y < viewport.y + viewport.height
    );
  }

  /**
   * Check if a point is visible in the current viewport
   */
  isPointVisible(point: Vector2D): boolean {
    const viewport = this.state.viewport;
    return (
      point.x >= viewport.x &&
      point.x <= viewport.x + viewport.width &&
      point.y >= viewport.y &&
      point.y <= viewport.y + viewport.height
    );
  }

  /**
   * Apply camera transform to a canvas context
   */
  applyTransform(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // Apply zoom
    ctx.scale(this.state.zoom, this.state.zoom);

    // Apply translation (negative because we're moving the world, not the camera)
    ctx.translate(-this.state.position.x, -this.state.position.y);

    // Apply rotation around center of viewport
    if (this.state.rotation !== 0) {
      const centerX = this.state.position.x + this.config.viewportWidth / 2;
      const centerY = this.state.position.y + this.config.viewportHeight / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate(this.state.rotation);
      ctx.translate(-centerX, -centerY);
    }
  }

  /**
   * Restore canvas context after applying camera transform
   */
  restoreTransform(ctx: CanvasRenderingContext2D): void {
    ctx.restore();
  }

  /**
   * Get camera state for external use
   */
  getState(): Readonly<CameraState> {
    return {
      position: { ...this.state.position },
      zoom: this.state.zoom,
      rotation: this.state.rotation,
      viewport: { ...this.state.viewport },
    };
  }

  // ============================================================
  // Private Methods
  // ============================================================

  private followTarget(deltaTime: number): void {
    if (!this.target) return;

    // Calculate target camera position (center on target)
    const targetPos = {
      x: this.target.x - this.config.viewportWidth / 2,
      y: this.target.y - this.config.viewportHeight / 2,
    };

    // Check dead zone
    if (this.config.deadZone) {
      const deadZone = this.config.deadZone;
      const centerX = this.state.position.x + this.config.viewportWidth / 2;
      const centerY = this.state.position.y + this.config.viewportHeight / 2;

      // Only follow if target is outside dead zone
      if (
        this.target.x >= centerX - deadZone.width / 2 &&
        this.target.x <= centerX + deadZone.width / 2 &&
        this.target.y >= centerY - deadZone.height / 2 &&
        this.target.y <= centerY + deadZone.height / 2
      ) {
        return; // Target is within dead zone, don't follow
      }
    }

    // Smooth follow using lerp
    const speed = 1 - Math.pow(1 - this.config.followSpeed, deltaTime * 60);
    this.state.position = Vec2.lerp(this.state.position, targetPos, speed);

    this.clampToBounds();
  }

  private applyShake(deltaTime: number): void {
    this.shakeElapsed += deltaTime;

    if (this.shakeElapsed >= this.shakeDuration) {
      this.stopShake();
      return;
    }

    // Decay shake intensity over time
    const progress = this.shakeElapsed / this.shakeDuration;
    const currentIntensity = this.shakeIntensity * (1 - progress);

    // Apply random offset
    this.state.position.x += (Math.random() - 0.5) * 2 * currentIntensity;
    this.state.position.y += (Math.random() - 0.5) * 2 * currentIntensity;
  }

  private clampToBounds(): void {
    if (!this.config.worldBounds) return;

    const bounds = this.config.worldBounds;
    const viewWidth = this.config.viewportWidth / this.state.zoom;
    const viewHeight = this.config.viewportHeight / this.state.zoom;

    // Clamp position so viewport stays within world bounds
    this.state.position.x = Math.max(
      bounds.x,
      Math.min(bounds.x + bounds.width - viewWidth, this.state.position.x)
    );
    this.state.position.y = Math.max(
      bounds.y,
      Math.min(bounds.y + bounds.height - viewHeight, this.state.position.y)
    );
  }

  private updateViewport(): void {
    this.state.viewport = {
      x: this.state.position.x,
      y: this.state.position.y,
      width: this.config.viewportWidth / this.state.zoom,
      height: this.config.viewportHeight / this.state.zoom,
    };
  }
}

/**
 * Create a new Camera instance
 */
export function createCamera(config?: Partial<CameraConfig>): Camera {
  return new Camera(config);
}
