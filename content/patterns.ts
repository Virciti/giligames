/**
 * Pattern matching challenge content
 * Visual pattern sequences for pattern recognition
 */

export type PatternShape = 'circle' | 'square' | 'triangle' | 'star' | 'diamond' | 'heart';
export type PatternColor = string; // hex color

export interface PatternElement {
  shape: PatternShape;
  color: PatternColor;
}

export interface PatternQuestion {
  id: string;
  /** The full sequence including the answer */
  sequence: PatternElement[];
  /** Index of the element that's hidden (the question) */
  hiddenIndex: number;
  /** Wrong answer options */
  wrongOptions: PatternElement[];
  tier: number;
}

const COLORS = {
  red: '#FF6B6B',
  blue: '#4ECDC4',
  yellow: '#FFE66D',
  purple: '#9B5DE5',
  green: '#7BC74D',
  orange: '#FF9F43',
  pink: '#FFB6C1',
};

const SHAPES: PatternShape[] = ['circle', 'square', 'triangle', 'star', 'diamond', 'heart'];

function el(shape: PatternShape, color: string): PatternElement {
  return { shape, color };
}

export const patternQuestions: PatternQuestion[] = [
  // Tier 1: Simple ABAB patterns (color only, same shape)
  {
    id: 'pattern-1-1',
    sequence: [
      el('circle', COLORS.red), el('circle', COLORS.blue),
      el('circle', COLORS.red), el('circle', COLORS.blue),
      el('circle', COLORS.red), el('circle', COLORS.blue),
    ],
    hiddenIndex: 5,
    wrongOptions: [el('circle', COLORS.yellow), el('circle', COLORS.green), el('circle', COLORS.purple)],
    tier: 1,
  },
  {
    id: 'pattern-1-2',
    sequence: [
      el('square', COLORS.yellow), el('square', COLORS.purple),
      el('square', COLORS.yellow), el('square', COLORS.purple),
      el('square', COLORS.yellow), el('square', COLORS.purple),
    ],
    hiddenIndex: 5,
    wrongOptions: [el('square', COLORS.red), el('square', COLORS.blue), el('square', COLORS.green)],
    tier: 1,
  },
  {
    id: 'pattern-1-3',
    sequence: [
      el('star', COLORS.green), el('star', COLORS.orange),
      el('star', COLORS.green), el('star', COLORS.orange),
      el('star', COLORS.green), el('star', COLORS.orange),
    ],
    hiddenIndex: 4,
    wrongOptions: [el('star', COLORS.red), el('star', COLORS.blue), el('star', COLORS.purple)],
    tier: 1,
  },
  // Tier 2: ABAB patterns (shape alternating)
  {
    id: 'pattern-2-1',
    sequence: [
      el('circle', COLORS.red), el('square', COLORS.red),
      el('circle', COLORS.red), el('square', COLORS.red),
      el('circle', COLORS.red), el('square', COLORS.red),
    ],
    hiddenIndex: 5,
    wrongOptions: [el('triangle', COLORS.red), el('star', COLORS.red), el('diamond', COLORS.red)],
    tier: 2,
  },
  {
    id: 'pattern-2-2',
    sequence: [
      el('triangle', COLORS.blue), el('heart', COLORS.pink),
      el('triangle', COLORS.blue), el('heart', COLORS.pink),
      el('triangle', COLORS.blue), el('heart', COLORS.pink),
    ],
    hiddenIndex: 4,
    wrongOptions: [el('square', COLORS.blue), el('circle', COLORS.blue), el('star', COLORS.blue)],
    tier: 2,
  },
  // Tier 2: ABC patterns
  {
    id: 'pattern-2-3',
    sequence: [
      el('circle', COLORS.red), el('circle', COLORS.blue), el('circle', COLORS.yellow),
      el('circle', COLORS.red), el('circle', COLORS.blue), el('circle', COLORS.yellow),
    ],
    hiddenIndex: 5,
    wrongOptions: [el('circle', COLORS.green), el('circle', COLORS.purple), el('circle', COLORS.orange)],
    tier: 2,
  },
  // Tier 3: AABB patterns
  {
    id: 'pattern-3-1',
    sequence: [
      el('star', COLORS.yellow), el('star', COLORS.yellow),
      el('diamond', COLORS.purple), el('diamond', COLORS.purple),
      el('star', COLORS.yellow), el('star', COLORS.yellow),
    ],
    hiddenIndex: 4,
    wrongOptions: [el('diamond', COLORS.purple), el('heart', COLORS.yellow), el('circle', COLORS.yellow)],
    tier: 3,
  },
  {
    id: 'pattern-3-2',
    sequence: [
      el('heart', COLORS.pink), el('heart', COLORS.pink),
      el('star', COLORS.green), el('star', COLORS.green),
      el('heart', COLORS.pink), el('heart', COLORS.pink),
    ],
    hiddenIndex: 5,
    wrongOptions: [el('star', COLORS.green), el('heart', COLORS.green), el('circle', COLORS.pink)],
    tier: 3,
  },
  // Tier 3: Shape AND color change
  {
    id: 'pattern-3-3',
    sequence: [
      el('circle', COLORS.red), el('square', COLORS.blue), el('triangle', COLORS.green),
      el('circle', COLORS.red), el('square', COLORS.blue), el('triangle', COLORS.green),
    ],
    hiddenIndex: 5,
    wrongOptions: [el('circle', COLORS.green), el('square', COLORS.green), el('triangle', COLORS.blue)],
    tier: 3,
  },
  // Tier 4: ABBA patterns
  {
    id: 'pattern-4-1',
    sequence: [
      el('circle', COLORS.red), el('square', COLORS.blue),
      el('square', COLORS.blue), el('circle', COLORS.red),
      el('circle', COLORS.red), el('square', COLORS.blue),
    ],
    hiddenIndex: 3,
    wrongOptions: [el('square', COLORS.red), el('circle', COLORS.blue), el('triangle', COLORS.red)],
    tier: 4,
  },
  {
    id: 'pattern-4-2',
    sequence: [
      el('star', COLORS.yellow), el('heart', COLORS.pink),
      el('heart', COLORS.pink), el('star', COLORS.yellow),
      el('star', COLORS.yellow), el('heart', COLORS.pink),
    ],
    hiddenIndex: 4,
    wrongOptions: [el('heart', COLORS.pink), el('star', COLORS.pink), el('heart', COLORS.yellow)],
    tier: 4,
  },
  // Tier 4: ABAC patterns
  {
    id: 'pattern-4-3',
    sequence: [
      el('diamond', COLORS.purple), el('circle', COLORS.orange),
      el('diamond', COLORS.purple), el('star', COLORS.green),
      el('diamond', COLORS.purple), el('circle', COLORS.orange),
    ],
    hiddenIndex: 4,
    wrongOptions: [el('circle', COLORS.purple), el('star', COLORS.purple), el('circle', COLORS.green)],
    tier: 4,
  },
  // Tier 5: Complex growing patterns
  {
    id: 'pattern-5-1',
    sequence: [
      el('circle', COLORS.red), el('circle', COLORS.blue), el('circle', COLORS.green),
      el('square', COLORS.red), el('square', COLORS.blue), el('square', COLORS.green),
    ],
    hiddenIndex: 5,
    wrongOptions: [el('square', COLORS.red), el('circle', COLORS.green), el('triangle', COLORS.green)],
    tier: 5,
  },
  {
    id: 'pattern-5-2',
    sequence: [
      el('star', COLORS.yellow), el('star', COLORS.orange), el('star', COLORS.red),
      el('heart', COLORS.yellow), el('heart', COLORS.orange), el('heart', COLORS.red),
    ],
    hiddenIndex: 4,
    wrongOptions: [el('heart', COLORS.red), el('star', COLORS.orange), el('heart', COLORS.yellow)],
    tier: 5,
  },
  // Tier 5: Mixed complex pattern
  {
    id: 'pattern-5-3',
    sequence: [
      el('triangle', COLORS.red), el('triangle', COLORS.red),
      el('circle', COLORS.blue),
      el('triangle', COLORS.red), el('triangle', COLORS.red),
      el('circle', COLORS.blue),
    ],
    hiddenIndex: 2,
    wrongOptions: [el('triangle', COLORS.blue), el('circle', COLORS.red), el('square', COLORS.blue)],
    tier: 5,
  },
];

export function getPatternsByTier(tier: number): PatternQuestion[] {
  return patternQuestions.filter((q) => q.tier === tier);
}

export function getPatternsUpToTier(tier: number): PatternQuestion[] {
  return patternQuestions.filter((q) => q.tier <= tier);
}

export { SHAPES as PATTERN_SHAPES, COLORS as PATTERN_COLORS };
