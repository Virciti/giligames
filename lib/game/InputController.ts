/**
 * InputController - Unified touch + keyboard input abstraction
 */

import type { InputState, InputConfig, Vector2D } from './types';

const DEFAULT_CONFIG: InputConfig = {
  layout: 'right',
  autoAccelerate: false,
  touchAreaSize: 64,
};

export class InputController {
  private config: InputConfig;
  private state: InputState;
  private keyMap: Map<string, keyof InputState> = new Map();
  private boundHandlers: {
    keydown: (e: KeyboardEvent) => void;
    keyup: (e: KeyboardEvent) => void;
    touchstart: (e: TouchEvent) => void;
    touchend: (e: TouchEvent) => void;
    touchmove: (e: TouchEvent) => void;
  };
  private canvas: HTMLCanvasElement | null = null;

  constructor(config: Partial<InputConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = this.createInitialState();

    // Set up key mappings
    this.keyMap.set('ArrowLeft', 'left');
    this.keyMap.set('KeyA', 'left');
    this.keyMap.set('ArrowRight', 'right');
    this.keyMap.set('KeyD', 'right');
    this.keyMap.set('ArrowUp', 'up');
    this.keyMap.set('KeyW', 'up');
    this.keyMap.set('ArrowDown', 'down');
    this.keyMap.set('KeyS', 'down');
    this.keyMap.set('Space', 'jump');
    this.keyMap.set('Escape', 'pause');
    this.keyMap.set('KeyP', 'pause');

    // Bind event handlers
    this.boundHandlers = {
      keydown: this.handleKeyDown.bind(this),
      keyup: this.handleKeyUp.bind(this),
      touchstart: this.handleTouchStart.bind(this),
      touchend: this.handleTouchEnd.bind(this),
      touchmove: this.handleTouchMove.bind(this),
    };
  }

  private createInitialState(): InputState {
    return {
      left: false,
      right: false,
      up: false,
      down: false,
      jump: false,
      pause: false,
      touches: [],
    };
  }

  /**
   * Attach input listeners to the window and optionally a canvas
   */
  attach(canvas?: HTMLCanvasElement): void {
    this.canvas = canvas ?? null;

    // Keyboard events on window
    window.addEventListener('keydown', this.boundHandlers.keydown);
    window.addEventListener('keyup', this.boundHandlers.keyup);

    // Touch events on canvas or window
    const touchTarget = this.canvas ?? window;
    touchTarget.addEventListener('touchstart', this.boundHandlers.touchstart as EventListener, { passive: false });
    touchTarget.addEventListener('touchend', this.boundHandlers.touchend as EventListener);
    touchTarget.addEventListener('touchmove', this.boundHandlers.touchmove as EventListener, { passive: false });
  }

  /**
   * Remove all input listeners
   */
  detach(): void {
    window.removeEventListener('keydown', this.boundHandlers.keydown);
    window.removeEventListener('keyup', this.boundHandlers.keyup);

    const touchTarget = this.canvas ?? window;
    touchTarget.removeEventListener('touchstart', this.boundHandlers.touchstart as EventListener);
    touchTarget.removeEventListener('touchend', this.boundHandlers.touchend as EventListener);
    touchTarget.removeEventListener('touchmove', this.boundHandlers.touchmove as EventListener);

    this.canvas = null;
  }

  /**
   * Get current input state (read-only copy)
   */
  getState(): Readonly<InputState> {
    return { ...this.state, touches: [...this.state.touches] };
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<InputConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<InputConfig> {
    return { ...this.config };
  }

  /**
   * Reset all input state
   */
  reset(): void {
    this.state = this.createInitialState();
  }

  /**
   * Check if any directional input is active
   */
  hasDirectionalInput(): boolean {
    return this.state.left || this.state.right || this.state.up || this.state.down;
  }

  // ============================================================
  // Event Handlers
  // ============================================================

  private handleKeyDown(e: KeyboardEvent): void {
    const key = this.keyMap.get(e.code);
    if (key && key !== 'touches') {
      e.preventDefault();
      (this.state[key] as boolean) = true;
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    const key = this.keyMap.get(e.code);
    if (key && key !== 'touches') {
      (this.state[key] as boolean) = false;
    }
  }

  private handleTouchStart(e: TouchEvent): void {
    e.preventDefault();
    this.updateTouches(e.touches);
    this.updateStateFromTouches();
  }

  private handleTouchEnd(e: TouchEvent): void {
    this.updateTouches(e.touches);
    this.updateStateFromTouches();
  }

  private handleTouchMove(e: TouchEvent): void {
    e.preventDefault();
    this.updateTouches(e.touches);
    this.updateStateFromTouches();
  }

  private updateTouches(touchList: TouchList): void {
    this.state.touches = [];
    for (let i = 0; i < touchList.length; i++) {
      const touch = touchList[i];
      this.state.touches.push({
        x: touch.clientX,
        y: touch.clientY,
      });
    }
  }

  private updateStateFromTouches(): void {
    if (!this.canvas) return;

    const rect = this.canvas.getBoundingClientRect();
    const canvasWidth = rect.width;
    const canvasHeight = rect.height;
    const touchSize = this.config.touchAreaSize;

    // Reset touch-derived states
    this.state.left = false;
    this.state.right = false;
    this.state.jump = false;

    // Auto-accelerate means we always move forward
    if (this.config.autoAccelerate) {
      this.state.right = true;
    }

    for (const touch of this.state.touches) {
      const relX = touch.x - rect.left;
      const relY = touch.y - rect.top;

      // Determine touch zones based on layout
      if (this.config.layout === 'left') {
        // Left side: movement controls, Right side: jump
        if (relX < canvasWidth / 2) {
          if (relX < canvasWidth / 4) {
            this.state.left = true;
          } else {
            this.state.right = true;
          }
        } else {
          this.state.jump = true;
        }
      } else if (this.config.layout === 'right') {
        // Right side: movement controls, Left side: jump
        if (relX > canvasWidth / 2) {
          if (relX > canvasWidth * 0.75) {
            this.state.right = true;
          } else {
            this.state.left = true;
          }
        } else {
          this.state.jump = true;
        }
      } else {
        // Both sides: bottom corners for movement, anywhere else for jump
        const bottomZone = relY > canvasHeight - touchSize * 2;
        if (bottomZone) {
          if (relX < touchSize * 2) {
            this.state.left = true;
          } else if (relX > canvasWidth - touchSize * 2) {
            this.state.right = true;
          }
        } else {
          this.state.jump = true;
        }
      }
    }
  }
}

/**
 * Create an input controller with default settings
 */
export function createInputController(config?: Partial<InputConfig>): InputController {
  return new InputController(config);
}
