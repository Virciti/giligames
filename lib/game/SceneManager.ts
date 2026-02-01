/**
 * SceneManager - Scene switching and lifecycle management
 */

import type { Scene, SceneConfig, InputState } from './types';

type SceneFactory = () => Scene;

interface SceneEntry {
  config: SceneConfig;
  factory?: SceneFactory;
  instance: Scene | null;
}

export class SceneManager {
  private scenes: Map<string, SceneEntry> = new Map();
  private currentScene: Scene | null = null;
  private currentSceneId: string | null = null;
  private isTransitioning: boolean = false;
  private pendingScene: string | null = null;
  private pendingConfig: Record<string, unknown> | undefined;

  /**
   * Register a scene with its configuration
   */
  register(config: SceneConfig): void {
    this.scenes.set(config.id, {
      config,
      instance: config.scene,
    });
  }

  /**
   * Register a scene with a factory function (lazy instantiation)
   */
  registerFactory(id: string, factory: SceneFactory, preload?: string[]): void {
    this.scenes.set(id, {
      config: { id, scene: null as unknown as Scene, preload },
      factory,
      instance: null,
    });
  }

  /**
   * Get list of registered scene IDs
   */
  getSceneIds(): string[] {
    return Array.from(this.scenes.keys());
  }

  /**
   * Check if a scene is registered
   */
  hasScene(id: string): boolean {
    return this.scenes.has(id);
  }

  /**
   * Get current scene ID
   */
  getCurrentSceneId(): string | null {
    return this.currentSceneId;
  }

  /**
   * Get current scene instance
   */
  getCurrentScene(): Scene | null {
    return this.currentScene;
  }

  /**
   * Check if currently transitioning between scenes
   */
  getIsTransitioning(): boolean {
    return this.isTransitioning;
  }

  /**
   * Switch to a different scene
   */
  async switchTo(sceneId: string, config?: Record<string, unknown>): Promise<void> {
    if (this.isTransitioning) {
      // Queue the scene switch
      this.pendingScene = sceneId;
      this.pendingConfig = config;
      return;
    }

    const entry = this.scenes.get(sceneId);
    if (!entry) {
      console.error(`Scene not found: ${sceneId}`);
      return;
    }

    this.isTransitioning = true;

    try {
      // Cleanup current scene
      if (this.currentScene) {
        this.currentScene.cleanup();
        this.currentScene = null;
        this.currentSceneId = null;
      }

      // Get or create scene instance
      let scene = entry.instance;
      if (!scene && entry.factory) {
        scene = entry.factory();
        entry.instance = scene;
      }

      if (!scene) {
        throw new Error(`Scene instance not available: ${sceneId}`);
      }

      // Initialize the new scene
      await scene.init(config);

      this.currentScene = scene;
      this.currentSceneId = sceneId;
    } catch (error) {
      console.error(`Failed to switch to scene ${sceneId}:`, error);
    } finally {
      this.isTransitioning = false;

      // Process any pending scene switch
      if (this.pendingScene) {
        const pendingId = this.pendingScene;
        const pendingConfig = this.pendingConfig;
        this.pendingScene = null;
        this.pendingConfig = undefined;
        await this.switchTo(pendingId, pendingConfig);
      }
    }
  }

  /**
   * Update the current scene
   */
  update(deltaTime: number, input: InputState): void {
    if (this.currentScene && !this.isTransitioning) {
      this.currentScene.update(deltaTime, input);
    }
  }

  /**
   * Render the current scene
   */
  render(ctx: CanvasRenderingContext2D): void {
    if (this.currentScene) {
      this.currentScene.render(ctx);
    }
  }

  /**
   * Pause the current scene
   */
  pause(): void {
    if (this.currentScene?.onPause) {
      this.currentScene.onPause();
    }
  }

  /**
   * Resume the current scene
   */
  resume(): void {
    if (this.currentScene?.onResume) {
      this.currentScene.onResume();
    }
  }

  /**
   * Cleanup current scene and clear all registrations
   */
  destroy(): void {
    if (this.currentScene) {
      this.currentScene.cleanup();
      this.currentScene = null;
      this.currentSceneId = null;
    }

    this.scenes.clear();
    this.pendingScene = null;
    this.pendingConfig = undefined;
  }

  /**
   * Preload assets for a scene
   */
  async preload(sceneId: string): Promise<void> {
    const entry = this.scenes.get(sceneId);
    if (!entry) {
      console.warn(`Scene not found for preload: ${sceneId}`);
      return;
    }

    if (entry.config.preload && entry.config.preload.length > 0) {
      // Preload logic would go here
      // This would integrate with AudioBus and an asset loader
      console.log(`Preloading assets for scene ${sceneId}:`, entry.config.preload);
    }
  }
}

/**
 * Create a new SceneManager instance
 */
export function createSceneManager(): SceneManager {
  return new SceneManager();
}

/**
 * Create a basic scene implementation
 */
export function createScene(
  id: string,
  handlers: Partial<Scene> & {
    update: (deltaTime: number, input: InputState) => void;
    render: (ctx: CanvasRenderingContext2D) => void;
  }
): Scene {
  return {
    id,
    init: handlers.init ?? (() => {}),
    update: handlers.update,
    render: handlers.render,
    cleanup: handlers.cleanup ?? (() => {}),
    onPause: handlers.onPause,
    onResume: handlers.onResume,
  };
}
