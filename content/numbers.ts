/**
 * Number content - 1-20 with words and audio paths
 */

import type { NumberContent } from './types';

export const numbers: NumberContent[] = [
  {
    id: 'number-1',
    value: 1,
    word: 'one',
    audioPath: '/voices/numbers/1.mp3',
    quantity: 'one truck',
  },
  {
    id: 'number-2',
    value: 2,
    word: 'two',
    audioPath: '/voices/numbers/2.mp3',
    quantity: 'two trucks',
  },
  {
    id: 'number-3',
    value: 3,
    word: 'three',
    audioPath: '/voices/numbers/3.mp3',
    quantity: 'three trucks',
  },
  {
    id: 'number-4',
    value: 4,
    word: 'four',
    audioPath: '/voices/numbers/4.mp3',
    quantity: 'four trucks',
  },
  {
    id: 'number-5',
    value: 5,
    word: 'five',
    audioPath: '/voices/numbers/5.mp3',
    quantity: 'five trucks',
  },
  {
    id: 'number-6',
    value: 6,
    word: 'six',
    audioPath: '/voices/numbers/6.mp3',
    quantity: 'six trucks',
    confusesWith: ['number-9'],
  },
  {
    id: 'number-7',
    value: 7,
    word: 'seven',
    audioPath: '/voices/numbers/7.mp3',
    quantity: 'seven trucks',
  },
  {
    id: 'number-8',
    value: 8,
    word: 'eight',
    audioPath: '/voices/numbers/8.mp3',
    quantity: 'eight trucks',
  },
  {
    id: 'number-9',
    value: 9,
    word: 'nine',
    audioPath: '/voices/numbers/9.mp3',
    quantity: 'nine trucks',
    confusesWith: ['number-6'],
  },
  {
    id: 'number-10',
    value: 10,
    word: 'ten',
    audioPath: '/voices/numbers/10.mp3',
    quantity: 'ten trucks',
  },
  {
    id: 'number-11',
    value: 11,
    word: 'eleven',
    audioPath: '/voices/numbers/11.mp3',
    quantity: 'eleven trucks',
  },
  {
    id: 'number-12',
    value: 12,
    word: 'twelve',
    audioPath: '/voices/numbers/12.mp3',
    quantity: 'twelve trucks',
    confusesWith: ['number-21'],
  },
  {
    id: 'number-13',
    value: 13,
    word: 'thirteen',
    audioPath: '/voices/numbers/13.mp3',
    quantity: 'thirteen trucks',
    confusesWith: ['number-30'],
  },
  {
    id: 'number-14',
    value: 14,
    word: 'fourteen',
    audioPath: '/voices/numbers/14.mp3',
    quantity: 'fourteen trucks',
    confusesWith: ['number-40'],
  },
  {
    id: 'number-15',
    value: 15,
    word: 'fifteen',
    audioPath: '/voices/numbers/15.mp3',
    quantity: 'fifteen trucks',
    confusesWith: ['number-50'],
  },
  {
    id: 'number-16',
    value: 16,
    word: 'sixteen',
    audioPath: '/voices/numbers/16.mp3',
    quantity: 'sixteen trucks',
    confusesWith: ['number-60'],
  },
  {
    id: 'number-17',
    value: 17,
    word: 'seventeen',
    audioPath: '/voices/numbers/17.mp3',
    quantity: 'seventeen trucks',
    confusesWith: ['number-70'],
  },
  {
    id: 'number-18',
    value: 18,
    word: 'eighteen',
    audioPath: '/voices/numbers/18.mp3',
    quantity: 'eighteen trucks',
    confusesWith: ['number-80'],
  },
  {
    id: 'number-19',
    value: 19,
    word: 'nineteen',
    audioPath: '/voices/numbers/19.mp3',
    quantity: 'nineteen trucks',
    confusesWith: ['number-90'],
  },
  {
    id: 'number-20',
    value: 20,
    word: 'twenty',
    audioPath: '/voices/numbers/20.mp3',
    quantity: 'twenty trucks',
  },
];

/**
 * Get a number by its ID
 */
export function getNumberById(id: string): NumberContent | undefined {
  return numbers.find((n) => n.id === id);
}

/**
 * Get a number by its value
 */
export function getNumberByValue(value: number): NumberContent | undefined {
  return numbers.find((n) => n.value === value);
}

/**
 * Get numbers within a range (inclusive)
 */
export function getNumbersInRange(min: number, max: number): NumberContent[] {
  return numbers.filter((n) => n.value >= min && n.value <= max);
}

/**
 * Get numbers commonly confused with a given number
 */
export function getConfusionPairs(numberId: string): NumberContent[] {
  const number = getNumberById(numberId);
  if (!number?.confusesWith) return [];
  return number.confusesWith.map((id) => getNumberById(id)).filter(Boolean) as NumberContent[];
}

/**
 * Get single-digit numbers (1-9)
 */
export function getSingleDigitNumbers(): NumberContent[] {
  return numbers.filter((n) => n.value <= 9);
}

/**
 * Get teen numbers (11-19)
 */
export function getTeenNumbers(): NumberContent[] {
  return numbers.filter((n) => n.value >= 11 && n.value <= 19);
}
