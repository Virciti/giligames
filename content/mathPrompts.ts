/**
 * Math prompts - Addition and subtraction problems by difficulty tier
 */

import type { MathPrompt, MathOperation } from './types';

// Re-export types for convenience
export type { MathPrompt, MathOperation };

/**
 * Generate math prompts for a given operation and tier
 */
function generatePrompts(
  operation: MathOperation,
  tier: number,
  maxOperand1: number,
  maxOperand2: number,
  minOperand1: number = 1,
  minOperand2: number = 0
): MathPrompt[] {
  const prompts: MathPrompt[] = [];

  for (let a = minOperand1; a <= maxOperand1; a++) {
    for (let b = minOperand2; b <= maxOperand2; b++) {
      if (operation === 'subtraction' && a < b) continue; // No negative results

      const answer = operation === 'addition' ? a + b : a - b;
      const id = `math-${operation}-${a}-${b}`;

      prompts.push({
        id,
        operation,
        operand1: a,
        operand2: b,
        answer,
        tier,
        audioPath: `/voices/math/${operation}/${a}-${b}.mp3`,
      });
    }
  }

  return prompts;
}

// Tier 1: +0, +1 facts (sums 0-5)
const tier1Addition = generatePrompts('addition', 1, 4, 1, 0, 0);

// Tier 2: +2 facts and more +1 (sums 2-10)
const tier2Addition = generatePrompts('addition', 2, 8, 2, 1, 1);

// Tier 3: Doubles (2+2, 3+3, 4+4, 5+5)
const tier3Addition: MathPrompt[] = [
  { id: 'math-addition-2-2', operation: 'addition', operand1: 2, operand2: 2, answer: 4, tier: 3, audioPath: '/voices/math/addition/2-2.mp3' },
  { id: 'math-addition-3-3', operation: 'addition', operand1: 3, operand2: 3, answer: 6, tier: 3, audioPath: '/voices/math/addition/3-3.mp3' },
  { id: 'math-addition-4-4', operation: 'addition', operand1: 4, operand2: 4, answer: 8, tier: 3, audioPath: '/voices/math/addition/4-4.mp3' },
  { id: 'math-addition-5-5', operation: 'addition', operand1: 5, operand2: 5, answer: 10, tier: 3, audioPath: '/voices/math/addition/5-5.mp3' },
];

// Tier 4: Near doubles and +3 facts
const tier4Addition = generatePrompts('addition', 4, 7, 4, 2, 2);

// Tier 5: Larger sums (up to 10+10)
const tier5Addition = generatePrompts('addition', 5, 10, 10, 5, 5);

// Subtraction Tiers
// Tier 1: -0, -1 facts
const tier1Subtraction = generatePrompts('subtraction', 1, 5, 1, 1, 0);

// Tier 2: -2 facts
const tier2Subtraction = generatePrompts('subtraction', 2, 8, 2, 2, 1);

// Tier 3: Subtracting from doubles
const tier3Subtraction: MathPrompt[] = [
  { id: 'math-subtraction-4-2', operation: 'subtraction', operand1: 4, operand2: 2, answer: 2, tier: 3, audioPath: '/voices/math/subtraction/4-2.mp3' },
  { id: 'math-subtraction-6-3', operation: 'subtraction', operand1: 6, operand2: 3, answer: 3, tier: 3, audioPath: '/voices/math/subtraction/6-3.mp3' },
  { id: 'math-subtraction-8-4', operation: 'subtraction', operand1: 8, operand2: 4, answer: 4, tier: 3, audioPath: '/voices/math/subtraction/8-4.mp3' },
  { id: 'math-subtraction-10-5', operation: 'subtraction', operand1: 10, operand2: 5, answer: 5, tier: 3, audioPath: '/voices/math/subtraction/10-5.mp3' },
];

// Tier 4: Mixed subtraction up to 10
const tier4Subtraction = generatePrompts('subtraction', 4, 10, 5, 5, 2);

// Tier 5: Larger subtraction (up to 20)
const tier5Subtraction = generatePrompts('subtraction', 5, 20, 10, 10, 5);

// Combine all prompts
export const mathPrompts: MathPrompt[] = [
  ...tier1Addition,
  ...tier2Addition,
  ...tier3Addition,
  ...tier4Addition,
  ...tier5Addition,
  ...tier1Subtraction,
  ...tier2Subtraction,
  ...tier3Subtraction,
  ...tier4Subtraction,
  ...tier5Subtraction,
];

// Remove duplicates based on ID
const uniquePrompts = new Map<string, MathPrompt>();
mathPrompts.forEach((p) => uniquePrompts.set(p.id, p));
export const allMathPrompts: MathPrompt[] = Array.from(uniquePrompts.values());

/**
 * Get a math prompt by its ID
 */
export function getMathPromptById(id: string): MathPrompt | undefined {
  return allMathPrompts.find((p) => p.id === id);
}

/**
 * Get all prompts for a specific operation
 */
export function getPromptsByOperation(operation: MathOperation): MathPrompt[] {
  return allMathPrompts.filter((p) => p.operation === operation);
}

/**
 * Get all prompts in a specific tier
 */
export function getPromptsByTier(tier: number): MathPrompt[] {
  return allMathPrompts.filter((p) => p.tier === tier);
}

/**
 * Get prompts by operation and tier
 */
export function getPromptsByOperationAndTier(operation: MathOperation, tier: number): MathPrompt[] {
  return allMathPrompts.filter((p) => p.operation === operation && p.tier === tier);
}

/**
 * Get prompts up to and including a given tier
 */
export function getPromptsUpToTier(tier: number, operation?: MathOperation): MathPrompt[] {
  return allMathPrompts.filter(
    (p) => p.tier <= tier && (operation === undefined || p.operation === operation)
  );
}

/**
 * Generate number bond pairs (pairs that add up to a target)
 */
export function getNumberBonds(target: number): Array<{ a: number; b: number }> {
  const bonds: Array<{ a: number; b: number }> = [];
  for (let a = 0; a <= target; a++) {
    bonds.push({ a, b: target - a });
  }
  return bonds;
}

/**
 * Get wrong answers for a math prompt (for multiple choice)
 */
export function getWrongAnswers(prompt: MathPrompt, count: number = 3): number[] {
  const correct = prompt.answer;
  const wrongs: Set<number> = new Set();

  // Add nearby numbers (common mistakes)
  const nearby = [correct - 1, correct + 1, correct - 2, correct + 2];
  nearby.forEach((n) => {
    if (n >= 0 && n !== correct) wrongs.add(n);
  });

  // Add random numbers if we need more
  while (wrongs.size < count) {
    const random = Math.floor(Math.random() * (correct + 5)) + 1;
    if (random !== correct && random >= 0) wrongs.add(random);
  }

  return Array.from(wrongs).slice(0, count);
}

/**
 * Format a math prompt as a string (e.g., "3 + 2 = ?")
 */
export function formatPrompt(prompt: MathPrompt): string {
  const symbol = prompt.operation === 'addition' ? '+' : '-';
  return `${prompt.operand1} ${symbol} ${prompt.operand2} = ?`;
}

/**
 * Format a math prompt with the answer (e.g., "3 + 2 = 5")
 */
export function formatPromptWithAnswer(prompt: MathPrompt): string {
  const symbol = prompt.operation === 'addition' ? '+' : '-';
  return `${prompt.operand1} ${symbol} ${prompt.operand2} = ${prompt.answer}`;
}
