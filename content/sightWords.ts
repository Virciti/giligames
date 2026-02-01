/**
 * Sight words - Age-appropriate sight word lists by tier
 * Based on Dolch and Fry word lists for early readers
 */

import type { SightWord } from './types';

export const sightWords: SightWord[] = [
  // Tier 1 - Pre-K / Most Common (20 words)
  { id: 'word-the', word: 'the', tier: 1, audioPath: '/voices/words/the.mp3', category: 'dolch' },
  { id: 'word-and', word: 'and', tier: 1, audioPath: '/voices/words/and.mp3', category: 'dolch' },
  { id: 'word-a', word: 'a', tier: 1, audioPath: '/voices/words/a.mp3', category: 'dolch' },
  { id: 'word-to', word: 'to', tier: 1, audioPath: '/voices/words/to.mp3', category: 'dolch' },
  { id: 'word-is', word: 'is', tier: 1, audioPath: '/voices/words/is.mp3', category: 'dolch' },
  { id: 'word-it', word: 'it', tier: 1, audioPath: '/voices/words/it.mp3', category: 'dolch' },
  { id: 'word-in', word: 'in', tier: 1, audioPath: '/voices/words/in.mp3', category: 'dolch' },
  { id: 'word-you', word: 'you', tier: 1, audioPath: '/voices/words/you.mp3', category: 'dolch' },
  { id: 'word-i', word: 'I', tier: 1, audioPath: '/voices/words/i.mp3', category: 'dolch' },
  { id: 'word-can', word: 'can', tier: 1, audioPath: '/voices/words/can.mp3', category: 'dolch' },
  { id: 'word-we', word: 'we', tier: 1, audioPath: '/voices/words/we.mp3', category: 'dolch' },
  { id: 'word-see', word: 'see', tier: 1, audioPath: '/voices/words/see.mp3', category: 'dolch' },
  { id: 'word-me', word: 'me', tier: 1, audioPath: '/voices/words/me.mp3', category: 'dolch' },
  { id: 'word-go', word: 'go', tier: 1, audioPath: '/voices/words/go.mp3', category: 'dolch' },
  { id: 'word-my', word: 'my', tier: 1, audioPath: '/voices/words/my.mp3', category: 'dolch' },
  { id: 'word-like', word: 'like', tier: 1, audioPath: '/voices/words/like.mp3', category: 'dolch' },
  { id: 'word-up', word: 'up', tier: 1, audioPath: '/voices/words/up.mp3', category: 'dolch' },
  { id: 'word-big', word: 'big', tier: 1, audioPath: '/voices/words/big.mp3', category: 'dolch' },
  { id: 'word-no', word: 'no', tier: 1, audioPath: '/voices/words/no.mp3', category: 'dolch' },
  { id: 'word-yes', word: 'yes', tier: 1, audioPath: '/voices/words/yes.mp3', category: 'dolch' },

  // Tier 2 - Kindergarten (20 words)
  { id: 'word-he', word: 'he', tier: 2, audioPath: '/voices/words/he.mp3', category: 'dolch' },
  { id: 'word-she', word: 'she', tier: 2, audioPath: '/voices/words/she.mp3', category: 'dolch' },
  { id: 'word-for', word: 'for', tier: 2, audioPath: '/voices/words/for.mp3', category: 'dolch' },
  { id: 'word-are', word: 'are', tier: 2, audioPath: '/voices/words/are.mp3', category: 'dolch' },
  { id: 'word-was', word: 'was', tier: 2, audioPath: '/voices/words/was.mp3', category: 'dolch' },
  { id: 'word-have', word: 'have', tier: 2, audioPath: '/voices/words/have.mp3', category: 'dolch' },
  { id: 'word-with', word: 'with', tier: 2, audioPath: '/voices/words/with.mp3', category: 'dolch' },
  { id: 'word-his', word: 'his', tier: 2, audioPath: '/voices/words/his.mp3', category: 'dolch' },
  { id: 'word-they', word: 'they', tier: 2, audioPath: '/voices/words/they.mp3', category: 'dolch' },
  { id: 'word-at', word: 'at', tier: 2, audioPath: '/voices/words/at.mp3', category: 'dolch' },
  { id: 'word-be', word: 'be', tier: 2, audioPath: '/voices/words/be.mp3', category: 'dolch' },
  { id: 'word-this', word: 'this', tier: 2, audioPath: '/voices/words/this.mp3', category: 'dolch' },
  { id: 'word-from', word: 'from', tier: 2, audioPath: '/voices/words/from.mp3', category: 'dolch' },
  { id: 'word-not', word: 'not', tier: 2, audioPath: '/voices/words/not.mp3', category: 'dolch' },
  { id: 'word-but', word: 'but', tier: 2, audioPath: '/voices/words/but.mp3', category: 'dolch' },
  { id: 'word-all', word: 'all', tier: 2, audioPath: '/voices/words/all.mp3', category: 'dolch' },
  { id: 'word-come', word: 'come', tier: 2, audioPath: '/voices/words/come.mp3', category: 'dolch' },
  { id: 'word-look', word: 'look', tier: 2, audioPath: '/voices/words/look.mp3', category: 'dolch' },
  { id: 'word-said', word: 'said', tier: 2, audioPath: '/voices/words/said.mp3', category: 'dolch' },
  { id: 'word-here', word: 'here', tier: 2, audioPath: '/voices/words/here.mp3', category: 'dolch' },

  // Tier 3 - First Grade Part 1 (20 words)
  { id: 'word-there', word: 'there', tier: 3, audioPath: '/voices/words/there.mp3', category: 'dolch' },
  { id: 'word-then', word: 'then', tier: 3, audioPath: '/voices/words/then.mp3', category: 'dolch' },
  { id: 'word-when', word: 'when', tier: 3, audioPath: '/voices/words/when.mp3', category: 'dolch' },
  { id: 'word-what', word: 'what', tier: 3, audioPath: '/voices/words/what.mp3', category: 'dolch' },
  { id: 'word-where', word: 'where', tier: 3, audioPath: '/voices/words/where.mp3', category: 'dolch' },
  { id: 'word-who', word: 'who', tier: 3, audioPath: '/voices/words/who.mp3', category: 'dolch' },
  { id: 'word-how', word: 'how', tier: 3, audioPath: '/voices/words/how.mp3', category: 'dolch' },
  { id: 'word-make', word: 'make', tier: 3, audioPath: '/voices/words/make.mp3', category: 'dolch' },
  { id: 'word-just', word: 'just', tier: 3, audioPath: '/voices/words/just.mp3', category: 'dolch' },
  { id: 'word-know', word: 'know', tier: 3, audioPath: '/voices/words/know.mp3', category: 'dolch' },
  { id: 'word-take', word: 'take', tier: 3, audioPath: '/voices/words/take.mp3', category: 'dolch' },
  { id: 'word-little', word: 'little', tier: 3, audioPath: '/voices/words/little.mp3', category: 'dolch' },
  { id: 'word-good', word: 'good', tier: 3, audioPath: '/voices/words/good.mp3', category: 'dolch' },
  { id: 'word-very', word: 'very', tier: 3, audioPath: '/voices/words/very.mp3', category: 'dolch' },
  { id: 'word-after', word: 'after', tier: 3, audioPath: '/voices/words/after.mp3', category: 'dolch' },
  { id: 'word-new', word: 'new', tier: 3, audioPath: '/voices/words/new.mp3', category: 'dolch' },
  { id: 'word-our', word: 'our', tier: 3, audioPath: '/voices/words/our.mp3', category: 'dolch' },
  { id: 'word-work', word: 'work', tier: 3, audioPath: '/voices/words/work.mp3', category: 'dolch' },
  { id: 'word-first', word: 'first', tier: 3, audioPath: '/voices/words/first.mp3', category: 'dolch' },
  { id: 'word-time', word: 'time', tier: 3, audioPath: '/voices/words/time.mp3', category: 'dolch' },

  // Tier 4 - First Grade Part 2 (15 words)
  { id: 'word-think', word: 'think', tier: 4, audioPath: '/voices/words/think.mp3', category: 'dolch' },
  { id: 'word-also', word: 'also', tier: 4, audioPath: '/voices/words/also.mp3', category: 'fry' },
  { id: 'word-around', word: 'around', tier: 4, audioPath: '/voices/words/around.mp3', category: 'dolch' },
  { id: 'word-another', word: 'another', tier: 4, audioPath: '/voices/words/another.mp3', category: 'fry' },
  { id: 'word-because', word: 'because', tier: 4, audioPath: '/voices/words/because.mp3', category: 'dolch' },
  { id: 'word-before', word: 'before', tier: 4, audioPath: '/voices/words/before.mp3', category: 'dolch' },
  { id: 'word-could', word: 'could', tier: 4, audioPath: '/voices/words/could.mp3', category: 'dolch' },
  { id: 'word-would', word: 'would', tier: 4, audioPath: '/voices/words/would.mp3', category: 'dolch' },
  { id: 'word-should', word: 'should', tier: 4, audioPath: '/voices/words/should.mp3', category: 'fry' },
  { id: 'word-every', word: 'every', tier: 4, audioPath: '/voices/words/every.mp3', category: 'dolch' },
  { id: 'word-found', word: 'found', tier: 4, audioPath: '/voices/words/found.mp3', category: 'fry' },
  { id: 'word-friend', word: 'friend', tier: 4, audioPath: '/voices/words/friend.mp3', category: 'fry' },
  { id: 'word-people', word: 'people', tier: 4, audioPath: '/voices/words/people.mp3', category: 'fry' },
  { id: 'word-right', word: 'right', tier: 4, audioPath: '/voices/words/right.mp3', category: 'fry' },
  { id: 'word-want', word: 'want', tier: 4, audioPath: '/voices/words/want.mp3', category: 'dolch' },

  // Tier 5 - Advanced (15 words)
  { id: 'word-different', word: 'different', tier: 5, audioPath: '/voices/words/different.mp3', category: 'fry' },
  { id: 'word-something', word: 'something', tier: 5, audioPath: '/voices/words/something.mp3', category: 'fry' },
  { id: 'word-through', word: 'through', tier: 5, audioPath: '/voices/words/through.mp3', category: 'fry' },
  { id: 'word-together', word: 'together', tier: 5, audioPath: '/voices/words/together.mp3', category: 'dolch' },
  { id: 'word-important', word: 'important', tier: 5, audioPath: '/voices/words/important.mp3', category: 'fry' },
  { id: 'word-children', word: 'children', tier: 5, audioPath: '/voices/words/children.mp3', category: 'fry' },
  { id: 'word-without', word: 'without', tier: 5, audioPath: '/voices/words/without.mp3', category: 'fry' },
  { id: 'word-always', word: 'always', tier: 5, audioPath: '/voices/words/always.mp3', category: 'dolch' },
  { id: 'word-again', word: 'again', tier: 5, audioPath: '/voices/words/again.mp3', category: 'dolch' },
  { id: 'word-between', word: 'between', tier: 5, audioPath: '/voices/words/between.mp3', category: 'fry' },
  { id: 'word-country', word: 'country', tier: 5, audioPath: '/voices/words/country.mp3', category: 'fry' },
  { id: 'word-school', word: 'school', tier: 5, audioPath: '/voices/words/school.mp3', category: 'fry' },
  { id: 'word-while', word: 'while', tier: 5, audioPath: '/voices/words/while.mp3', category: 'fry' },
  { id: 'word-these', word: 'these', tier: 5, audioPath: '/voices/words/these.mp3', category: 'fry' },
  { id: 'word-those', word: 'those', tier: 5, audioPath: '/voices/words/those.mp3', category: 'fry' },
];

/**
 * Get a sight word by its ID
 */
export function getSightWordById(id: string): SightWord | undefined {
  return sightWords.find((w) => w.id === id);
}

/**
 * Get a sight word by the word itself
 */
export function getSightWordByWord(word: string): SightWord | undefined {
  return sightWords.find((w) => w.word.toLowerCase() === word.toLowerCase());
}

/**
 * Get all words in a specific tier
 */
export function getWordsByTier(tier: number): SightWord[] {
  return sightWords.filter((w) => w.tier === tier);
}

/**
 * Get words by category (dolch, fry)
 */
export function getWordsByCategory(category: string): SightWord[] {
  return sightWords.filter((w) => w.category === category);
}

/**
 * Get words up to and including a given tier
 */
export function getWordsUpToTier(tier: number): SightWord[] {
  return sightWords.filter((w) => w.tier <= tier);
}

/**
 * Find rhyming words (simple implementation)
 */
export function getRhymingWords(word: string): SightWord[] {
  const ending = word.slice(-2).toLowerCase();
  return sightWords.filter(
    (w) => w.word.toLowerCase() !== word.toLowerCase() && w.word.toLowerCase().endsWith(ending)
  );
}
