/**
 * Letter content - A-Z with phonemes and audio paths
 */

import type { Letter } from './types';

export const letters: Letter[] = [
  {
    id: 'letter-a',
    uppercase: 'A',
    lowercase: 'a',
    phoneme: 'ah',
    alternatePhonemes: ['ay'],
    audioPath: '/voices/letters/a.mp3',
    exampleWord: 'apple',
  },
  {
    id: 'letter-b',
    uppercase: 'B',
    lowercase: 'b',
    phoneme: 'buh',
    audioPath: '/voices/letters/b.mp3',
    exampleWord: 'ball',
    confusesWith: ['letter-d', 'letter-p'],
  },
  {
    id: 'letter-c',
    uppercase: 'C',
    lowercase: 'c',
    phoneme: 'kuh',
    alternatePhonemes: ['sss'],
    audioPath: '/voices/letters/c.mp3',
    exampleWord: 'cat',
  },
  {
    id: 'letter-d',
    uppercase: 'D',
    lowercase: 'd',
    phoneme: 'duh',
    audioPath: '/voices/letters/d.mp3',
    exampleWord: 'dog',
    confusesWith: ['letter-b', 'letter-p'],
  },
  {
    id: 'letter-e',
    uppercase: 'E',
    lowercase: 'e',
    phoneme: 'eh',
    alternatePhonemes: ['ee'],
    audioPath: '/voices/letters/e.mp3',
    exampleWord: 'elephant',
  },
  {
    id: 'letter-f',
    uppercase: 'F',
    lowercase: 'f',
    phoneme: 'fff',
    audioPath: '/voices/letters/f.mp3',
    exampleWord: 'fish',
  },
  {
    id: 'letter-g',
    uppercase: 'G',
    lowercase: 'g',
    phoneme: 'guh',
    alternatePhonemes: ['juh'],
    audioPath: '/voices/letters/g.mp3',
    exampleWord: 'goat',
  },
  {
    id: 'letter-h',
    uppercase: 'H',
    lowercase: 'h',
    phoneme: 'huh',
    audioPath: '/voices/letters/h.mp3',
    exampleWord: 'hat',
  },
  {
    id: 'letter-i',
    uppercase: 'I',
    lowercase: 'i',
    phoneme: 'ih',
    alternatePhonemes: ['eye'],
    audioPath: '/voices/letters/i.mp3',
    exampleWord: 'igloo',
  },
  {
    id: 'letter-j',
    uppercase: 'J',
    lowercase: 'j',
    phoneme: 'juh',
    audioPath: '/voices/letters/j.mp3',
    exampleWord: 'jump',
  },
  {
    id: 'letter-k',
    uppercase: 'K',
    lowercase: 'k',
    phoneme: 'kuh',
    audioPath: '/voices/letters/k.mp3',
    exampleWord: 'kite',
  },
  {
    id: 'letter-l',
    uppercase: 'L',
    lowercase: 'l',
    phoneme: 'lll',
    audioPath: '/voices/letters/l.mp3',
    exampleWord: 'lion',
  },
  {
    id: 'letter-m',
    uppercase: 'M',
    lowercase: 'm',
    phoneme: 'mmm',
    audioPath: '/voices/letters/m.mp3',
    exampleWord: 'mouse',
    confusesWith: ['letter-n', 'letter-w'],
  },
  {
    id: 'letter-n',
    uppercase: 'N',
    lowercase: 'n',
    phoneme: 'nnn',
    audioPath: '/voices/letters/n.mp3',
    exampleWord: 'nest',
    confusesWith: ['letter-m'],
  },
  {
    id: 'letter-o',
    uppercase: 'O',
    lowercase: 'o',
    phoneme: 'oh',
    alternatePhonemes: ['oo', 'aw'],
    audioPath: '/voices/letters/o.mp3',
    exampleWord: 'octopus',
  },
  {
    id: 'letter-p',
    uppercase: 'P',
    lowercase: 'p',
    phoneme: 'puh',
    audioPath: '/voices/letters/p.mp3',
    exampleWord: 'pig',
    confusesWith: ['letter-b', 'letter-d', 'letter-q'],
  },
  {
    id: 'letter-q',
    uppercase: 'Q',
    lowercase: 'q',
    phoneme: 'kwuh',
    audioPath: '/voices/letters/q.mp3',
    exampleWord: 'queen',
    confusesWith: ['letter-p'],
  },
  {
    id: 'letter-r',
    uppercase: 'R',
    lowercase: 'r',
    phoneme: 'rrr',
    audioPath: '/voices/letters/r.mp3',
    exampleWord: 'rainbow',
  },
  {
    id: 'letter-s',
    uppercase: 'S',
    lowercase: 's',
    phoneme: 'sss',
    audioPath: '/voices/letters/s.mp3',
    exampleWord: 'sun',
  },
  {
    id: 'letter-t',
    uppercase: 'T',
    lowercase: 't',
    phoneme: 'tuh',
    audioPath: '/voices/letters/t.mp3',
    exampleWord: 'truck',
  },
  {
    id: 'letter-u',
    uppercase: 'U',
    lowercase: 'u',
    phoneme: 'uh',
    alternatePhonemes: ['oo', 'yoo'],
    audioPath: '/voices/letters/u.mp3',
    exampleWord: 'umbrella',
  },
  {
    id: 'letter-v',
    uppercase: 'V',
    lowercase: 'v',
    phoneme: 'vvv',
    audioPath: '/voices/letters/v.mp3',
    exampleWord: 'van',
    confusesWith: ['letter-w'],
  },
  {
    id: 'letter-w',
    uppercase: 'W',
    lowercase: 'w',
    phoneme: 'wuh',
    audioPath: '/voices/letters/w.mp3',
    exampleWord: 'water',
    confusesWith: ['letter-m', 'letter-v'],
  },
  {
    id: 'letter-x',
    uppercase: 'X',
    lowercase: 'x',
    phoneme: 'ks',
    audioPath: '/voices/letters/x.mp3',
    exampleWord: 'x-ray',
  },
  {
    id: 'letter-y',
    uppercase: 'Y',
    lowercase: 'y',
    phoneme: 'yuh',
    alternatePhonemes: ['ee', 'eye'],
    audioPath: '/voices/letters/y.mp3',
    exampleWord: 'yellow',
  },
  {
    id: 'letter-z',
    uppercase: 'Z',
    lowercase: 'z',
    phoneme: 'zzz',
    audioPath: '/voices/letters/z.mp3',
    exampleWord: 'zebra',
  },
];

/**
 * Get a letter by its ID
 */
export function getLetterById(id: string): Letter | undefined {
  return letters.find((l) => l.id === id);
}

/**
 * Get a letter by its character (uppercase or lowercase)
 */
export function getLetterByChar(char: string): Letter | undefined {
  const upper = char.toUpperCase();
  return letters.find((l) => l.uppercase === upper);
}

/**
 * Get letters that are commonly confused with a given letter
 */
export function getConfusionPairs(letterId: string): Letter[] {
  const letter = getLetterById(letterId);
  if (!letter?.confusesWith) return [];
  return letter.confusesWith.map((id) => getLetterById(id)).filter(Boolean) as Letter[];
}

/**
 * Get all vowels
 */
export function getVowels(): Letter[] {
  const vowelIds = ['letter-a', 'letter-e', 'letter-i', 'letter-o', 'letter-u'];
  return letters.filter((l) => vowelIds.includes(l.id));
}

/**
 * Get all consonants
 */
export function getConsonants(): Letter[] {
  const vowelIds = ['letter-a', 'letter-e', 'letter-i', 'letter-o', 'letter-u'];
  return letters.filter((l) => !vowelIds.includes(l.id));
}
