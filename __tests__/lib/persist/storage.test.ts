import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  load,
  saveImmediate,
  reset,
  exportData,
  importData,
  addStars,
  getStars,
  isStorageAvailable,
} from '@/lib/persist/storage';
import { createDefaultSaveData, type SaveData } from '@/lib/persist/schema';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get store() {
      return store;
    },
  };
})();

describe('Storage', () => {
  beforeEach(() => {
    // Reset localStorage mock
    localStorageMock.clear();
    vi.clearAllMocks();

    // Mock window.localStorage
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    // Mock window
    Object.defineProperty(global, 'window', {
      value: { localStorage: localStorageMock },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('load', () => {
    it('should return default data when no save exists', () => {
      const data = load();
      expect(data.player.totalStars).toBe(0);
      expect(data.player.profiles.length).toBe(1);
    });

    it('should load existing save data', () => {
      const saveData: SaveData = {
        ...createDefaultSaveData(),
        player: {
          ...createDefaultSaveData().player,
          totalStars: 100,
        },
      };
      localStorageMock.setItem('giigames-save', JSON.stringify(saveData));

      const data = load();
      expect(data.player.totalStars).toBe(100);
    });

    it('should return defaults on corrupted data', () => {
      localStorageMock.setItem('giigames-save', 'not valid json');

      const data = load();
      expect(data.player.totalStars).toBe(0);
    });
  });

  describe('saveImmediate', () => {
    it('should save valid data to localStorage', () => {
      const saveData = createDefaultSaveData();
      saveData.player.totalStars = 50;

      const result = saveImmediate(saveData);

      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalled();

      // Verify the saved data
      const saved = JSON.parse(localStorageMock.store['giigames-save']);
      expect(saved.player.totalStars).toBe(50);
    });

    it('should create backup before saving', () => {
      const oldData = createDefaultSaveData();
      oldData.player.totalStars = 25;
      localStorageMock.setItem('giigames-save', JSON.stringify(oldData));

      const newData = createDefaultSaveData();
      newData.player.totalStars = 50;
      saveImmediate(newData);

      const backup = JSON.parse(localStorageMock.store['giigames-save-backup']);
      expect(backup.player.totalStars).toBe(25);
    });
  });

  describe('reset', () => {
    it('should clear storage and return defaults', () => {
      const saveData = createDefaultSaveData();
      saveData.player.totalStars = 100;
      localStorageMock.setItem('giigames-save', JSON.stringify(saveData));

      const data = reset();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('giigames-save');
      expect(data.player.totalStars).toBe(0);
    });
  });

  describe('exportData', () => {
    it('should export data as JSON string', () => {
      const saveData = createDefaultSaveData();
      saveData.player.totalStars = 75;
      localStorageMock.setItem('giigames-save', JSON.stringify(saveData));

      const exported = exportData();
      const parsed = JSON.parse(exported);

      expect(parsed.player.totalStars).toBe(75);
    });
  });

  describe('importData', () => {
    it('should import valid JSON data', () => {
      const saveData = createDefaultSaveData();
      saveData.player.totalStars = 200;
      const jsonString = JSON.stringify(saveData);

      const result = importData(jsonString);

      expect(result).not.toBeNull();
      expect(result?.player.totalStars).toBe(200);
    });

    it('should reject invalid JSON', () => {
      const result = importData('not valid json');
      expect(result).toBeNull();
    });

    it('should reject invalid data structure', () => {
      const result = importData('{"invalid": "data"}');
      expect(result).toBeNull();
    });
  });

  describe('addStars', () => {
    it('should add stars to current total', () => {
      const saveData = createDefaultSaveData();
      saveData.player.totalStars = 10;
      localStorageMock.setItem('giigames-save', JSON.stringify(saveData));

      const newTotal = addStars(5);

      expect(newTotal).toBe(15);
    });
  });

  describe('getStars', () => {
    it('should return current star count', () => {
      const saveData = createDefaultSaveData();
      saveData.player.totalStars = 42;
      localStorageMock.setItem('giigames-save', JSON.stringify(saveData));

      expect(getStars()).toBe(42);
    });
  });

  describe('isStorageAvailable', () => {
    it('should return true when localStorage is available', () => {
      expect(isStorageAvailable()).toBe(true);
    });
  });
});
