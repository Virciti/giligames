/**
 * Core types for the GiiGames game engine
 */

// ============================================================
// Vector & Geometry Types
// ============================================================

export interface Vector2D {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Circle {
  x: number;
  y: number;
  radius: number;
}

// ============================================================
// Input Types
// ============================================================

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jump: boolean;
  pause: boolean;
  // Touch positions for mobile
  touches: Vector2D[];
}

export type InputEventType = 'keydown' | 'keyup' | 'touchstart' | 'touchend' | 'touchmove';

export interface InputConfig {
  layout: 'left' | 'right' | 'both';
  autoAccelerate: boolean;
  touchAreaSize: number; // in pixels
}

// ============================================================
// Physics Types
// ============================================================

export interface PhysicsBody {
  position: Vector2D;
  velocity: Vector2D;
  acceleration: Vector2D;
  mass: number;
  friction: number;
  restitution: number; // bounciness
  isGrounded: boolean;
}

export interface PhysicsConfig {
  gravity: number;
  maxVelocityX: number;
  maxVelocityY: number;
  groundFriction: number;
  airResistance: number;
}

// ============================================================
// Collision Types
// ============================================================

export interface CollisionResult {
  collided: boolean;
  overlap: Vector2D;
  normal: Vector2D;
}

export type ColliderType = 'aabb' | 'circle';

export interface Collider {
  type: ColliderType;
  bounds: Rect | Circle;
  isTrigger: boolean; // if true, detect but don't resolve
  layer: string; // collision layer for filtering
}

// ============================================================
// Scene Types
// ============================================================

export interface Scene {
  id: string;
  init(config?: Record<string, unknown>): void | Promise<void>;
  update(deltaTime: number, input: InputState): void;
  render(ctx: CanvasRenderingContext2D): void;
  cleanup(): void;
  onPause?(): void;
  onResume?(): void;
}

export interface SceneConfig {
  id: string;
  scene: Scene;
  preload?: string[]; // asset paths to preload
}

// ============================================================
// Camera Types
// ============================================================

export interface CameraConfig {
  viewportWidth: number;
  viewportHeight: number;
  worldBounds?: Rect;
  followSpeed: number; // 0-1, how fast camera follows target
  deadZone?: Rect; // area where target can move without camera following
}

export interface Camera {
  position: Vector2D;
  zoom: number;
  rotation: number;
  viewport: Rect;
}

// ============================================================
// Audio Types
// ============================================================

export type AudioChannel = 'music' | 'sfx' | 'voice';

export interface AudioConfig {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  voiceVolume: number;
  musicEnabled: boolean;
  sfxEnabled: boolean;
  voiceEnabled: boolean;
}

export interface SoundEffect {
  id: string;
  path: string;
  channel: AudioChannel;
  loop?: boolean;
  volume?: number;
}

// ============================================================
// Game Loop Types
// ============================================================

export interface GameLoopCallbacks {
  update: (deltaTime: number) => void;
  render: () => void;
  onFpsUpdate?: (fps: number) => void;
}

export interface GameLoopConfig {
  targetFps?: number; // default 60
  maxDeltaTime?: number; // cap delta to prevent spiral of death
}

// ============================================================
// Entity Types (for game objects)
// ============================================================

export interface Entity {
  id: string;
  position: Vector2D;
  rotation: number;
  scale: Vector2D;
  visible: boolean;
  active: boolean;
  update?(deltaTime: number, input: InputState): void;
  render?(ctx: CanvasRenderingContext2D, camera: Camera): void;
}

// ============================================================
// Event Types
// ============================================================

export type GameEventType =
  | 'STAR_EARNED'
  | 'LEVEL_COMPLETED'
  | 'LEARNING_ANSWERED'
  | 'TRUCK_UNLOCKED'
  | 'ACHIEVEMENT_EARNED'
  | 'GAME_PAUSED'
  | 'GAME_RESUMED'
  | 'PROFILE_SWITCHED';

export interface GameEvent {
  type: GameEventType;
  payload?: Record<string, unknown>;
  timestamp: number;
}

export type GameEventHandler = (event: GameEvent) => void;
