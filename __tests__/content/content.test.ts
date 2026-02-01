import { describe, it, expect } from 'vitest';
import {
  letters,
  getLetterById,
  getLetterByChar,
  getVowels,
  getConsonants,
} from '@/content/letters';
import {
  numbers,
  getNumberById,
  getNumberByValue,
  getSingleDigitNumbers,
  getTeenNumbers,
} from '@/content/numbers';
import {
  trucks,
  getTruckById,
  getDefaultTrucks,
  isTruckUnlocked,
  getNextUnlockableTruck,
} from '@/content/trucks';
import {
  levels,
  getLevelById,
  getLevelsByMode,
  getUnlockedLevels,
} from '@/content/levels';
import {
  sightWords,
  getSightWordById,
  getWordsByTier,
} from '@/content/sightWords';
import {
  mathPrompts,
  getMathPromptById,
  getPromptsByOperation,
  getNumberBonds,
  formatPrompt,
} from '@/content/mathPrompts';

describe('Letters Content', () => {
  it('should have 26 letters', () => {
    expect(letters.length).toBe(26);
  });

  it('should have unique IDs', () => {
    const ids = letters.map((l) => l.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(26);
  });

  it('should find letter by ID', () => {
    const letterA = getLetterById('letter-a');
    expect(letterA?.uppercase).toBe('A');
    expect(letterA?.lowercase).toBe('a');
  });

  it('should find letter by character', () => {
    const letter = getLetterByChar('B');
    expect(letter?.id).toBe('letter-b');
  });

  it('should have 5 vowels', () => {
    const vowels = getVowels();
    expect(vowels.length).toBe(5);
    expect(vowels.map((v) => v.uppercase).sort()).toEqual(['A', 'E', 'I', 'O', 'U']);
  });

  it('should have 21 consonants', () => {
    const consonants = getConsonants();
    expect(consonants.length).toBe(21);
  });

  it('should have phonemes for all letters', () => {
    for (const letter of letters) {
      expect(letter.phoneme).toBeTruthy();
      expect(letter.audioPath).toBeTruthy();
    }
  });
});

describe('Numbers Content', () => {
  it('should have 20 numbers (1-20)', () => {
    expect(numbers.length).toBe(20);
  });

  it('should have unique IDs', () => {
    const ids = numbers.map((n) => n.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(20);
  });

  it('should find number by ID', () => {
    const number5 = getNumberById('number-5');
    expect(number5?.value).toBe(5);
    expect(number5?.word).toBe('five');
  });

  it('should find number by value', () => {
    const number = getNumberByValue(7);
    expect(number?.word).toBe('seven');
  });

  it('should have 9 single-digit numbers', () => {
    const singleDigit = getSingleDigitNumbers();
    expect(singleDigit.length).toBe(9);
    expect(singleDigit.every((n) => n.value <= 9)).toBe(true);
  });

  it('should have 9 teen numbers (11-19)', () => {
    const teens = getTeenNumbers();
    expect(teens.length).toBe(9);
    expect(teens.every((n) => n.value >= 11 && n.value <= 19)).toBe(true);
  });
});

describe('Trucks Content', () => {
  it('should have at least 6 trucks', () => {
    expect(trucks.length).toBeGreaterThanOrEqual(6);
  });

  it('should have at least 2 default trucks', () => {
    const defaultTrucks = getDefaultTrucks();
    expect(defaultTrucks.length).toBeGreaterThanOrEqual(2);
  });

  it('should find truck by ID', () => {
    const truck = getTruckById('truck-red-rocket');
    expect(truck?.name).toBe('Red Rocket');
  });

  it('should have valid stats (1-5 range)', () => {
    for (const truck of trucks) {
      expect(truck.stats.speed).toBeGreaterThanOrEqual(1);
      expect(truck.stats.speed).toBeLessThanOrEqual(5);
      expect(truck.stats.jump).toBeGreaterThanOrEqual(1);
      expect(truck.stats.jump).toBeLessThanOrEqual(5);
      expect(truck.stats.handling).toBeGreaterThanOrEqual(1);
      expect(truck.stats.handling).toBeLessThanOrEqual(5);
    }
  });

  it('should correctly check if truck is unlocked', () => {
    const defaultTruck = getTruckById('truck-red-rocket')!;
    const lockedTruck = trucks.find((t) => t.unlockRequirement.type === 'stars')!;

    expect(isTruckUnlocked(defaultTruck, 0)).toBe(true);
    expect(isTruckUnlocked(lockedTruck, 0)).toBe(false);
    expect(isTruckUnlocked(lockedTruck, 1000)).toBe(true);
  });

  it('should get next unlockable truck', () => {
    const next = getNextUnlockableTruck(0);
    expect(next).toBeDefined();
    expect(next?.unlockRequirement.type).toBe('stars');
  });
});

describe('Levels Content', () => {
  it('should have levels for each mode', () => {
    expect(getLevelsByMode('stadium').length).toBeGreaterThan(0);
    expect(getLevelsByMode('race').length).toBeGreaterThan(0);
    expect(getLevelsByMode('learn').length).toBeGreaterThan(0);
  });

  it('should find level by ID', () => {
    const level = getLevelById('stadium-beginner');
    expect(level?.name).toBe('Beginner Arena');
    expect(level?.mode).toBe('stadium');
  });

  it('should have at least one free level per mode', () => {
    const modes = ['stadium', 'race', 'learn'] as const;
    for (const mode of modes) {
      const freeLevels = getLevelsByMode(mode).filter((l) => l.unlockStars === 0);
      expect(freeLevels.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('should get unlocked levels based on stars', () => {
    const withZeroStars = getUnlockedLevels(0);
    const withManyStars = getUnlockedLevels(1000);

    expect(withManyStars.length).toBeGreaterThanOrEqual(withZeroStars.length);
  });
});

describe('Sight Words Content', () => {
  it('should have sight words in multiple tiers', () => {
    expect(getWordsByTier(1).length).toBeGreaterThan(0);
    expect(getWordsByTier(2).length).toBeGreaterThan(0);
    expect(getWordsByTier(3).length).toBeGreaterThan(0);
  });

  it('should find word by ID', () => {
    const word = getSightWordById('word-the');
    expect(word?.word).toBe('the');
    expect(word?.tier).toBe(1);
  });

  it('should have audio paths for all words', () => {
    for (const word of sightWords) {
      expect(word.audioPath).toBeTruthy();
    }
  });
});

describe('Math Prompts Content', () => {
  it('should have both addition and subtraction prompts', () => {
    const addition = getPromptsByOperation('addition');
    const subtraction = getPromptsByOperation('subtraction');

    expect(addition.length).toBeGreaterThan(0);
    expect(subtraction.length).toBeGreaterThan(0);
  });

  it('should find prompt by ID', () => {
    const prompt = getMathPromptById('math-addition-2-2');
    if (prompt) {
      expect(prompt.operand1).toBe(2);
      expect(prompt.operand2).toBe(2);
      expect(prompt.answer).toBe(4);
    }
  });

  it('should have correct answers', () => {
    for (const prompt of mathPrompts) {
      if (prompt.operation === 'addition') {
        expect(prompt.answer).toBe(prompt.operand1 + prompt.operand2);
      } else {
        expect(prompt.answer).toBe(prompt.operand1 - prompt.operand2);
      }
    }
  });

  it('should generate number bonds', () => {
    const bonds = getNumberBonds(10);
    expect(bonds.length).toBe(11); // 0+10, 1+9, ..., 10+0
    expect(bonds.every((b) => b.a + b.b === 10)).toBe(true);
  });

  it('should format prompts correctly', () => {
    const addition = { id: 'test', operation: 'addition' as const, operand1: 3, operand2: 2, answer: 5, tier: 1, audioPath: '' };
    const subtraction = { id: 'test', operation: 'subtraction' as const, operand1: 5, operand2: 2, answer: 3, tier: 1, audioPath: '' };

    expect(formatPrompt(addition)).toBe('3 + 2 = ?');
    expect(formatPrompt(subtraction)).toBe('5 - 2 = ?');
  });
});
