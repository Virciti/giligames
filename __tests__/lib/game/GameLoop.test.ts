import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GameLoop, createGameLoop } from '@/lib/game/GameLoop';

describe('GameLoop', () => {
  let mockUpdate: ReturnType<typeof vi.fn>;
  let mockRender: ReturnType<typeof vi.fn>;
  let mockOnFpsUpdate: ReturnType<typeof vi.fn>;
  let gameLoop: GameLoop;
  let rafCallback: FrameRequestCallback | null = null;
  let rafId = 0;

  beforeEach(() => {
    mockUpdate = vi.fn();
    mockRender = vi.fn();
    mockOnFpsUpdate = vi.fn();

    // Mock requestAnimationFrame
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallback = cb;
      return ++rafId;
    });

    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

    // Mock performance.now
    vi.spyOn(performance, 'now').mockReturnValue(0);

    gameLoop = new GameLoop(
      { update: mockUpdate, render: mockRender, onFpsUpdate: mockOnFpsUpdate },
      { targetFps: 60 }
    );
  });

  afterEach(() => {
    gameLoop.stop();
    vi.restoreAllMocks();
  });

  describe('start', () => {
    it('should start the game loop', () => {
      gameLoop.start();
      expect(gameLoop.getIsRunning()).toBe(true);
      expect(window.requestAnimationFrame).toHaveBeenCalled();
    });

    it('should not start if already running', () => {
      gameLoop.start();
      const callCount = (window.requestAnimationFrame as ReturnType<typeof vi.fn>).mock.calls.length;
      gameLoop.start();
      expect((window.requestAnimationFrame as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callCount);
    });
  });

  describe('stop', () => {
    it('should stop the game loop', () => {
      gameLoop.start();
      gameLoop.stop();
      expect(gameLoop.getIsRunning()).toBe(false);
      expect(window.cancelAnimationFrame).toHaveBeenCalled();
    });
  });

  describe('pause/resume', () => {
    it('should pause the game loop', () => {
      gameLoop.start();
      gameLoop.pause();
      expect(gameLoop.getIsPaused()).toBe(true);
    });

    it('should resume the game loop', () => {
      gameLoop.start();
      gameLoop.pause();
      gameLoop.resume();
      expect(gameLoop.getIsPaused()).toBe(false);
    });

    it('should not pause if not running', () => {
      gameLoop.pause();
      expect(gameLoop.getIsPaused()).toBe(false);
    });

    it('should not resume if not paused', () => {
      gameLoop.start();
      const initialState = gameLoop.getIsPaused();
      gameLoop.resume();
      expect(gameLoop.getIsPaused()).toBe(initialState);
    });
  });

  describe('tick', () => {
    it('should call update and render on each frame', () => {
      gameLoop.start();

      // Simulate 16ms passing (roughly 60fps)
      vi.spyOn(performance, 'now').mockReturnValue(16);
      rafCallback?.(16);

      expect(mockUpdate).toHaveBeenCalled();
      expect(mockRender).toHaveBeenCalled();
    });

    it('should pass delta time to update', () => {
      gameLoop.start();

      // Simulate 16ms passing
      vi.spyOn(performance, 'now').mockReturnValue(16);
      rafCallback?.(16);

      expect(mockUpdate).toHaveBeenCalledWith(expect.closeTo(0.016, 0.001));
    });

    it('should still render when paused but not update', () => {
      gameLoop.start();
      gameLoop.pause();

      // Clear mocks after pause to check only the paused tick
      mockUpdate.mockClear();
      mockRender.mockClear();

      vi.spyOn(performance, 'now').mockReturnValue(16);
      rafCallback?.(16);

      expect(mockUpdate).not.toHaveBeenCalled();
      expect(mockRender).toHaveBeenCalled();
    });

    it('should clamp delta time to maxDeltaTime', () => {
      gameLoop = new GameLoop(
        { update: mockUpdate, render: mockRender },
        { maxDeltaTime: 0.05 }
      );
      gameLoop.start();

      // Simulate 200ms passing (way too long)
      vi.spyOn(performance, 'now').mockReturnValue(200);
      rafCallback?.(200);

      expect(mockUpdate).toHaveBeenCalledWith(0.05);
    });
  });
});

describe('createGameLoop', () => {
  it('should create a GameLoop instance', () => {
    const loop = createGameLoop(
      () => {},
      () => {}
    );
    expect(loop).toBeInstanceOf(GameLoop);
  });
});
