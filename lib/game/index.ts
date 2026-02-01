/**
 * GiiGames Game Engine
 *
 * Core game engine modules for the GiiGames educational game.
 * Provides game loop, input handling, physics, collision detection,
 * camera system, scene management, and audio.
 */

// Types
export * from './types';

// Core modules
export { GameLoop, createGameLoop } from './GameLoop';
export { InputController, createInputController } from './InputController';
export { AudioBus, getAudioBus, createAudioBus } from './AudioBus';
export { Physics, createPhysics, createPhysicsBody, Vec2, DEFAULT_PHYSICS_CONFIG } from './Physics';
export {
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
} from './Collision';
export { Camera, createCamera } from './Camera';
export { SceneManager, createSceneManager, createScene } from './SceneManager';

// Entities
export * from './entities';

// Scenes
export * from './scenes';

// AI
export * from './ai';
