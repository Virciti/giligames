/**
 * StadiumScene - Main stadium freestyle game scene
 */

import type { Scene, InputState, Camera as CameraState, Rect } from '../types';
import type { StadiumLevel } from '@/content/types';
import type { Truck } from '@/content/types';

import { Physics, createPhysics } from '../Physics';
import { Camera, createCamera } from '../Camera';
import { checkAABB } from '../Collision';

import {
  TruckEntity,
  createTruckEntity,
  StarCollectible,
  createStarCollectible,
  Obstacle,
  createObstacle,
  Platform,
  createPlatform,
  Ramp,
  createRamp,
} from '../entities';

// Scene configuration from init
export interface StadiumSceneConfig {
  level: StadiumLevel;
  truck: Truck;
  viewportWidth?: number;
  viewportHeight?: number;
  onStarCollected?: (starId: string, totalStars: number) => void;
  onObstacleCrushed?: (obstacleId: string, points: number, totalScore: number) => void;
  onChallengeComplete?: (challengeType: string) => void;
  onGameOver?: (score: number, starsCollected: number, obstaclesCrushed: number) => void;
}

// Game state
interface GameState {
  score: number;
  starsCollected: number;
  obstaclesCrushed: number;
  timeRemaining: number;
  isPaused: boolean;
  isGameOver: boolean;
  currentChallenge: number;
}

// Background layer for parallax
interface BackgroundLayer {
  color: string;
  yOffset: number;
  parallaxFactor: number;
}

export class StadiumScene implements Scene {
  public id: string = 'stadium';

  // Level data
  private level!: StadiumLevel;
  private truckConfig!: Truck;

  // Core systems
  private physics!: Physics;
  private camera!: Camera;

  // Viewport dimensions
  private viewportWidth: number = 800;
  private viewportHeight: number = 600;

  // Entities
  private truck!: TruckEntity;
  private stars: StarCollectible[] = [];
  private obstacles: Obstacle[] = [];
  private platforms: Platform[] = [];
  private ramps: Ramp[] = [];

  // World bounds
  private worldWidth: number = 1200;
  private worldHeight: number = 600;
  private groundY: number = 500;

  // Game state
  private state: GameState = {
    score: 0,
    starsCollected: 0,
    obstaclesCrushed: 0,
    timeRemaining: 60,
    isPaused: false,
    isGameOver: false,
    currentChallenge: 0,
  };

  // Background
  private backgroundLayers: BackgroundLayer[] = [];

  // Callbacks
  private onStarCollected?: (starId: string, totalStars: number) => void;
  private onObstacleCrushed?: (obstacleId: string, points: number, totalScore: number) => void;
  private onChallengeComplete?: (challengeType: string) => void;
  private onGameOver?: (score: number, starsCollected: number, obstaclesCrushed: number) => void;

  // Crowd animation
  private crowdWaveTime: number = 0;

  /**
   * Initialize the scene with configuration
   */
  init(config?: Record<string, unknown>): void {
    const sceneConfig = config as unknown as StadiumSceneConfig | undefined;

    if (!sceneConfig?.level || !sceneConfig?.truck) {
      throw new Error('StadiumScene requires level and truck configuration');
    }

    this.level = sceneConfig.level;
    this.truckConfig = sceneConfig.truck;
    this.viewportWidth = sceneConfig.viewportWidth || 800;
    this.viewportHeight = sceneConfig.viewportHeight || 600;

    // Store callbacks
    this.onStarCollected = sceneConfig.onStarCollected;
    this.onObstacleCrushed = sceneConfig.onObstacleCrushed;
    this.onChallengeComplete = sceneConfig.onChallengeComplete;
    this.onGameOver = sceneConfig.onGameOver;

    // Set world dimensions from level
    this.worldWidth = this.level.config.width;
    this.worldHeight = this.level.config.height;
    this.groundY = this.level.config.groundY;

    // Initialize physics
    this.physics = createPhysics({
      gravity: 980,
      maxVelocityX: 500,
      maxVelocityY: 800,
      groundFriction: 0.85,
      airResistance: 0.99,
    });

    // Initialize camera
    this.camera = createCamera({
      viewportWidth: this.viewportWidth,
      viewportHeight: this.viewportHeight,
      followSpeed: 0.08,
    });

    this.camera.setWorldBounds({
      x: 0,
      y: 0,
      width: this.worldWidth,
      height: this.worldHeight,
    });

    // Create entities
    this.createEntities();

    // Initialize background
    this.initBackground();

    // Reset game state
    this.resetState();

    // Center camera on truck
    this.camera.setTarget(this.truck.getCenter());
  }

  /**
   * Create all game entities from level data
   */
  private createEntities(): void {
    // Create truck at starting position
    const startX = 100;
    const startY = this.groundY - 60;

    this.truck = createTruckEntity({
      x: startX,
      y: startY,
      truck: this.truckConfig,
    });

    // Create platforms
    this.platforms = this.level.config.platforms.map((p, i) =>
      createPlatform({
        x: p.x,
        y: p.y,
        width: p.width,
        height: p.height,
        id: `platform-${i}`,
        style: i % 2 === 0 ? 'metal' : 'dirt',
      })
    );

    // Create ramps
    this.ramps = this.level.config.ramps.map((r, i) =>
      createRamp({
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.height,
        angle: r.angle,
        id: `ramp-${i}`,
      })
    );

    // Create stars
    this.stars = this.level.config.starPositions.map((s, i) =>
      createStarCollectible({
        x: s.x,
        y: s.y,
        id: `star-${i}`,
      })
    );

    // Create obstacles
    this.obstacles = this.level.config.obstacles.map((o, i) =>
      createObstacle({
        x: o.x,
        y: o.y - (o.type === 'box' ? 40 : 44), // Adjust Y to sit on ground
        type: o.type,
        id: `obstacle-${i}`,
      })
    );
  }

  /**
   * Initialize background layers
   */
  private initBackground(): void {
    this.backgroundLayers = [
      { color: '#1a1a2e', yOffset: 0, parallaxFactor: 0.1 },      // Sky
      { color: '#16213e', yOffset: 0.3, parallaxFactor: 0.3 },    // Distant stands
      { color: '#0f3460', yOffset: 0.5, parallaxFactor: 0.5 },    // Mid stands
      { color: '#533483', yOffset: 0.7, parallaxFactor: 0.7 },    // Near stands
    ];
  }

  /**
   * Reset game state
   */
  private resetState(): void {
    const challenge = this.level.config.challenges[0];

    this.state = {
      score: 0,
      starsCollected: 0,
      obstaclesCrushed: 0,
      timeRemaining: challenge?.timeLimit || 60,
      isPaused: false,
      isGameOver: false,
      currentChallenge: 0,
    };
  }

  /**
   * Update the scene
   */
  update(deltaTime: number, input: InputState): void {
    if (this.state.isPaused || this.state.isGameOver) {
      return;
    }

    // Handle pause input
    if (input.pause) {
      this.state.isPaused = true;
      return;
    }

    // Update timer
    this.state.timeRemaining -= deltaTime;
    if (this.state.timeRemaining <= 0) {
      this.endGame();
      return;
    }

    // Update truck
    this.truck.applyInput(input, deltaTime);
    this.truck.applyPhysics(this.physics, deltaTime);

    // Handle collisions
    this.handleCollisions();

    // Update entities
    this.updateEntities(deltaTime);

    // Update camera
    this.camera.setTarget(this.truck.getCenter());
    this.camera.update(deltaTime);

    // Update crowd animation
    this.crowdWaveTime += deltaTime;

    // Check challenge completion
    this.checkChallengeCompletion();
  }

  /**
   * Handle all collisions
   */
  private handleCollisions(): void {
    const truckBounds = this.truck.getBounds();

    // Ground collision
    if (this.truck.body.position.y + this.truck.height >= this.groundY) {
      this.physics.landOnGround(this.truck.body, this.truck.height, this.groundY);
    } else {
      // Check if still grounded (might have walked off platform)
      if (this.truck.body.isGrounded) {
        this.truck.body.isGrounded = false;
      }
    }

    // Side boundaries
    if (this.truck.body.position.x < 0) {
      this.truck.body.position.x = 0;
      this.truck.body.velocity.x = Math.abs(this.truck.body.velocity.x) * 0.3;
    }
    if (this.truck.body.position.x + this.truck.width > this.worldWidth) {
      this.truck.body.position.x = this.worldWidth - this.truck.width;
      this.truck.body.velocity.x = -Math.abs(this.truck.body.velocity.x) * 0.3;
    }

    // Platform collisions
    for (const platform of this.platforms) {
      const platformBounds = platform.getBounds();

      if (checkAABB(truckBounds, platformBounds)) {
        // Resolve collision
        this.physics.resolveStaticCollision(
          this.truck.body,
          truckBounds,
          platformBounds
        );
      }
    }

    // Ramp interactions
    for (const ramp of this.ramps) {
      ramp.checkAndApplyLaunch(this.truck);
    }

    // Star collection
    for (const star of this.stars) {
      if (!star.collected && star.checkCollection(truckBounds)) {
        this.collectStar(star);
      }
    }

    // Obstacle crushing
    for (const obstacle of this.obstacles) {
      if (!obstacle.crushed && obstacle.checkCrush(truckBounds, this.truck.body.velocity)) {
        this.crushObstacle(obstacle);
      }
    }
  }

  /**
   * Update all entities
   */
  private updateEntities(deltaTime: number): void {
    // Update stars
    for (const star of this.stars) {
      star.update(deltaTime);
    }

    // Update obstacles
    for (const obstacle of this.obstacles) {
      obstacle.update(deltaTime);
    }
  }

  /**
   * Collect a star
   */
  private collectStar(star: StarCollectible): void {
    this.state.starsCollected++;
    this.state.score += 500;

    this.onStarCollected?.(star.id, this.state.starsCollected);

    // Camera shake on collection
    this.camera.shake(3, 0.15);
  }

  /**
   * Crush an obstacle
   */
  private crushObstacle(obstacle: Obstacle): void {
    this.state.obstaclesCrushed++;
    this.state.score += obstacle.points;

    this.onObstacleCrushed?.(obstacle.id, obstacle.points, this.state.score);

    // Camera shake on crush
    this.camera.shake(5, 0.2);
  }

  /**
   * Check if current challenge is complete
   */
  private checkChallengeCompletion(): void {
    const challenge = this.level.config.challenges[this.state.currentChallenge];
    if (!challenge) return;

    let completed = false;

    switch (challenge.type) {
      case 'collect':
        completed = this.state.starsCollected >= challenge.target;
        break;
      case 'crush':
        completed = this.state.obstaclesCrushed >= challenge.target;
        break;
    }

    if (completed) {
      this.onChallengeComplete?.(challenge.type);
      this.state.currentChallenge++;

      // Bonus time for completing challenge
      this.state.timeRemaining += 15;
    }
  }

  /**
   * End the game
   */
  private endGame(): void {
    this.state.isGameOver = true;
    this.state.timeRemaining = 0;

    this.onGameOver?.(
      this.state.score,
      this.state.starsCollected,
      this.state.obstaclesCrushed
    );
  }

  /**
   * Render the scene
   */
  render(ctx: CanvasRenderingContext2D): void {
    const cameraState = this.camera.getState();

    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, this.viewportWidth, this.viewportHeight);

    // Render background with parallax
    this.renderBackground(ctx, cameraState);

    // Render stadium crowd
    this.renderCrowd(ctx, cameraState);

    // Apply camera transform for world-space rendering
    this.camera.applyTransform(ctx);

    // Render platforms
    for (const platform of this.platforms) {
      platform.render(ctx, cameraState);
    }

    // Render ramps
    for (const ramp of this.ramps) {
      ramp.render(ctx, cameraState);
    }

    // Render ground
    this.renderGround(ctx, cameraState);

    // Render obstacles
    for (const obstacle of this.obstacles) {
      obstacle.render(ctx, cameraState);
    }

    // Render stars
    for (const star of this.stars) {
      star.render(ctx, cameraState);
    }

    // Render truck
    this.truck.render(ctx, cameraState);

    // Restore transform
    this.camera.restoreTransform(ctx);

    // Render HUD (screen-space)
    this.renderHUD(ctx);

    // Render pause overlay if paused
    if (this.state.isPaused) {
      this.renderPauseOverlay(ctx);
    }

    // Render game over overlay
    if (this.state.isGameOver) {
      this.renderGameOverOverlay(ctx);
    }
  }

  /**
   * Render background layers with parallax
   */
  private renderBackground(ctx: CanvasRenderingContext2D, camera: CameraState): void {
    const totalHeight = this.viewportHeight;

    for (let i = 0; i < this.backgroundLayers.length; i++) {
      const layer = this.backgroundLayers[i];
      const layerHeight = totalHeight * (1 - layer.yOffset);
      const yStart = layer.yOffset * totalHeight;

      // Parallax offset
      const parallaxX = camera.position.x * layer.parallaxFactor;

      ctx.fillStyle = layer.color;
      ctx.fillRect(-parallaxX * 0.1, yStart, this.viewportWidth + 100, layerHeight);
    }
  }

  /**
   * Render stadium crowd
   */
  private renderCrowd(ctx: CanvasRenderingContext2D, camera: CameraState): void {
    const crowdY = this.viewportHeight * 0.15;
    const crowdHeight = this.viewportHeight * 0.25;

    // Draw crowd silhouettes
    ctx.fillStyle = '#2d2d4a';

    for (let x = 0; x < this.viewportWidth + 40; x += 20) {
      const wave = Math.sin((x + this.crowdWaveTime * 100) * 0.05) * 5;
      const personHeight = 15 + Math.random() * 5;

      ctx.beginPath();
      ctx.arc(x, crowdY + crowdHeight - wave, 6, 0, Math.PI, true);
      ctx.rect(x - 4, crowdY + crowdHeight - wave, 8, personHeight);
      ctx.fill();
    }

    // Stadium lights
    this.renderStadiumLights(ctx);
  }

  /**
   * Render stadium lights
   */
  private renderStadiumLights(ctx: CanvasRenderingContext2D): void {
    const lightPositions = [
      this.viewportWidth * 0.15,
      this.viewportWidth * 0.5,
      this.viewportWidth * 0.85,
    ];

    for (const lx of lightPositions) {
      // Light post
      ctx.fillStyle = '#333';
      ctx.fillRect(lx - 3, 0, 6, 80);

      // Light fixture
      ctx.fillStyle = '#555';
      ctx.fillRect(lx - 15, 75, 30, 10);

      // Light glow
      const gradient = ctx.createRadialGradient(lx, 85, 0, lx, 85, 150);
      gradient.addColorStop(0, 'rgba(255, 255, 200, 0.3)');
      gradient.addColorStop(0.5, 'rgba(255, 255, 200, 0.1)');
      gradient.addColorStop(1, 'rgba(255, 255, 200, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(lx, 85, 150, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * Render the ground
   */
  private renderGround(ctx: CanvasRenderingContext2D, camera: CameraState): void {
    const groundScreenY = this.groundY - camera.position.y;

    // Main dirt
    const gradient = ctx.createLinearGradient(
      0, groundScreenY,
      0, groundScreenY + (this.worldHeight - this.groundY)
    );
    gradient.addColorStop(0, '#8B6914');
    gradient.addColorStop(0.3, '#6B4914');
    gradient.addColorStop(1, '#4B2914');

    ctx.fillStyle = gradient;
    ctx.fillRect(
      -camera.position.x,
      groundScreenY,
      this.worldWidth,
      this.worldHeight - this.groundY
    );

    // Dirt texture lines
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 2;

    for (let i = 0; i < 20; i++) {
      const lineX = (i * 100) - (camera.position.x % 100);
      ctx.beginPath();
      ctx.moveTo(lineX, groundScreenY);
      ctx.lineTo(lineX + 50, groundScreenY + 100);
      ctx.stroke();
    }

    // Top edge highlight
    ctx.fillStyle = '#9B7924';
    ctx.fillRect(-camera.position.x, groundScreenY, this.worldWidth, 3);
  }

  /**
   * Render the HUD
   */
  private renderHUD(ctx: CanvasRenderingContext2D): void {
    // Score background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(10, 10, 150, 80);

    // Score text
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(`Score: ${this.state.score}`, 20, 40);

    // Stars collected
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '18px sans-serif';
    ctx.fillText(`Stars: ${this.state.starsCollected}`, 20, 65);

    // Obstacles crushed
    ctx.fillText(`Crushed: ${this.state.obstaclesCrushed}`, 20, 85);

    // Timer
    const timerWidth = 120;
    const timerX = this.viewportWidth - timerWidth - 20;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(timerX, 10, timerWidth, 40);

    // Timer color based on time remaining
    const timeRatio = this.state.timeRemaining / 60;
    if (timeRatio > 0.5) {
      ctx.fillStyle = '#4CAF50';
    } else if (timeRatio > 0.25) {
      ctx.fillStyle = '#FFC107';
    } else {
      ctx.fillStyle = '#F44336';
    }

    ctx.font = 'bold 24px sans-serif';
    const timeText = Math.ceil(this.state.timeRemaining).toString();
    ctx.fillText(timeText, timerX + 20, 38);

    // Challenge indicator
    const challenge = this.level.config.challenges[this.state.currentChallenge];
    if (challenge) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(this.viewportWidth / 2 - 100, 10, 200, 30);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';

      let progress: number;
      let challengeText: string;

      if (challenge.type === 'collect') {
        progress = this.state.starsCollected;
        challengeText = `Collect ${progress}/${challenge.target} stars`;
      } else {
        progress = this.state.obstaclesCrushed;
        challengeText = `Crush ${progress}/${challenge.target} obstacles`;
      }

      ctx.fillText(challengeText, this.viewportWidth / 2, 30);
      ctx.textAlign = 'left';
    }
  }

  /**
   * Render pause overlay
   */
  private renderPauseOverlay(ctx: CanvasRenderingContext2D): void {
    // Dim background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.viewportWidth, this.viewportHeight);

    // Pause text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', this.viewportWidth / 2, this.viewportHeight / 2);

    ctx.font = '20px sans-serif';
    ctx.fillText('Press P or ESC to resume', this.viewportWidth / 2, this.viewportHeight / 2 + 40);

    ctx.textAlign = 'left';
  }

  /**
   * Render game over overlay
   */
  private renderGameOverOverlay(ctx: CanvasRenderingContext2D): void {
    // Dim background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, this.viewportWidth, this.viewportHeight);

    // Game over text
    ctx.fillStyle = '#FF6B6B';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TIME UP!', this.viewportWidth / 2, this.viewportHeight / 2 - 60);

    // Final score
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText(`Final Score: ${this.state.score}`, this.viewportWidth / 2, this.viewportHeight / 2);

    // Stats
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '24px sans-serif';
    ctx.fillText(
      `Stars: ${this.state.starsCollected} | Crushed: ${this.state.obstaclesCrushed}`,
      this.viewportWidth / 2,
      this.viewportHeight / 2 + 40
    );

    ctx.textAlign = 'left';
  }

  /**
   * Pause the scene
   */
  onPause(): void {
    this.state.isPaused = true;
  }

  /**
   * Resume the scene
   */
  onResume(): void {
    this.state.isPaused = false;
  }

  /**
   * Cleanup the scene
   */
  cleanup(): void {
    // Reset all entities
    this.stars = [];
    this.obstacles = [];
    this.platforms = [];
    this.ramps = [];
  }

  /**
   * Get current game state
   */
  getState(): Readonly<GameState> {
    return { ...this.state };
  }

  /**
   * Restart the level
   */
  restart(): void {
    // Reset entities
    this.createEntities();

    // Reset state
    this.resetState();

    // Reset camera
    this.camera.centerOn(this.truck.getCenter());
    this.camera.setTarget(this.truck.getCenter());
  }
}

/**
 * Create a new StadiumScene
 */
export function createStadiumScene(): StadiumScene {
  return new StadiumScene();
}
