/**
 * Fashion scenarios - Dress-up scenarios with category weights and tag matching
 */

import type { FashionScenario, FashionScenarioId } from './types';

export const fashionScenarios: FashionScenario[] = [
  {
    id: 'school-day',
    name: 'School Day',
    description: 'Look smart and ready to learn!',
    tier: 1,
    unlockStars: 0,
    bgGradient: ['#4ECDC4', '#2A9D8F'],
    icon: '🎒',
    categoryWeights: [
      { category: 'top', weight: 4, required: true },
      { category: 'bottom', weight: 4, required: true },
      { category: 'shoes', weight: 3, required: true },
      { category: 'accessory', weight: 2, required: false },
      { category: 'hairstyle', weight: 2, required: false },
    ],
    appropriateTags: ['casual', 'school', 'neat', 'comfortable'],
    baseFashionPoints: 60,
  },
  {
    id: 'birthday-party',
    name: 'Birthday Party',
    description: 'Time to celebrate in style!',
    tier: 1,
    unlockStars: 0,
    bgGradient: ['#FF6B6B', '#E85D75'],
    icon: '🎂',
    categoryWeights: [
      { category: 'dress', weight: 5, required: false },
      { category: 'top', weight: 4, required: false },
      { category: 'bottom', weight: 3, required: false },
      { category: 'shoes', weight: 3, required: true },
      { category: 'accessory', weight: 4, required: false },
      { category: 'hairstyle', weight: 3, required: false },
    ],
    appropriateTags: ['party', 'fun', 'sparkly', 'colorful'],
    baseFashionPoints: 60,
  },
  {
    id: 'dance-recital',
    name: 'Dance Recital',
    description: 'Shine on stage!',
    tier: 2,
    unlockStars: 8,
    bgGradient: ['#9B5DE5', '#7B2FF7'],
    icon: '💃',
    categoryWeights: [
      { category: 'dress', weight: 5, required: false },
      { category: 'top', weight: 4, required: false },
      { category: 'bottom', weight: 4, required: false },
      { category: 'shoes', weight: 5, required: true },
      { category: 'accessory', weight: 3, required: false },
      { category: 'hairstyle', weight: 4, required: true },
    ],
    appropriateTags: ['dance', 'elegant', 'sparkly', 'performance'],
    baseFashionPoints: 80,
  },
  {
    id: 'beach-day',
    name: 'Beach Day',
    description: 'Sun, sand, and fun!',
    tier: 2,
    unlockStars: 12,
    bgGradient: ['#FFE66D', '#FF9F43'],
    icon: '🏖️',
    categoryWeights: [
      { category: 'top', weight: 3, required: true },
      { category: 'bottom', weight: 3, required: true },
      { category: 'shoes', weight: 4, required: true },
      { category: 'accessory', weight: 5, required: false },
      { category: 'hairstyle', weight: 3, required: false },
    ],
    appropriateTags: ['beach', 'summer', 'casual', 'sun'],
    baseFashionPoints: 80,
  },
  {
    id: 'gymnastics-meet',
    name: 'Gymnastics Meet',
    description: 'Flip and tumble in style!',
    tier: 3,
    unlockStars: 20,
    bgGradient: ['#7BC74D', '#4CAF50'],
    icon: '🤸',
    categoryWeights: [
      { category: 'dress', weight: 5, required: false },
      { category: 'top', weight: 4, required: false },
      { category: 'bottom', weight: 4, required: false },
      { category: 'shoes', weight: 3, required: true },
      { category: 'accessory', weight: 4, required: false },
      { category: 'hairstyle', weight: 5, required: true },
    ],
    appropriateTags: ['sporty', 'athletic', 'flexible', 'neat'],
    baseFashionPoints: 100,
  },
  {
    id: 'winter-wonderland',
    name: 'Winter Wonderland',
    description: 'Stay warm and look cool!',
    tier: 3,
    unlockStars: 30,
    bgGradient: ['#A8D8EA', '#6C8EBF'],
    icon: '❄️',
    categoryWeights: [
      { category: 'top', weight: 5, required: true },
      { category: 'bottom', weight: 4, required: true },
      { category: 'shoes', weight: 5, required: true },
      { category: 'accessory', weight: 5, required: true },
      { category: 'hairstyle', weight: 2, required: false },
    ],
    appropriateTags: ['winter', 'warm', 'cozy', 'snow'],
    baseFashionPoints: 100,
  },
  {
    id: 'pajama-party',
    name: 'Pajama Party',
    description: 'Comfy and cute sleepover vibes!',
    tier: 4,
    unlockStars: 45,
    bgGradient: ['#D4A5FF', '#B088F9'],
    icon: '🌙',
    categoryWeights: [
      { category: 'top', weight: 5, required: true },
      { category: 'bottom', weight: 5, required: true },
      { category: 'shoes', weight: 3, required: false },
      { category: 'accessory', weight: 4, required: false },
      { category: 'hairstyle', weight: 3, required: false },
    ],
    appropriateTags: ['cozy', 'sleepover', 'cute', 'comfortable'],
    baseFashionPoints: 120,
  },
  {
    id: 'fancy-dinner',
    name: 'Fancy Dinner',
    description: 'Dress to impress!',
    tier: 4,
    unlockStars: 55,
    bgGradient: ['#FFD700', '#B8860B'],
    icon: '🍽️',
    categoryWeights: [
      { category: 'dress', weight: 5, required: false },
      { category: 'top', weight: 4, required: false },
      { category: 'bottom', weight: 4, required: false },
      { category: 'shoes', weight: 5, required: true },
      { category: 'accessory', weight: 5, required: true },
      { category: 'hairstyle', weight: 4, required: true },
    ],
    appropriateTags: ['fancy', 'elegant', 'sparkly', 'dressy'],
    baseFashionPoints: 120,
  },
  {
    id: 'rainy-day',
    name: 'Rainy Day',
    description: 'Splash through puddles in style!',
    tier: 5,
    unlockStars: 70,
    bgGradient: ['#87CEEB', '#4A7C9B'],
    icon: '🌧️',
    categoryWeights: [
      { category: 'top', weight: 5, required: true },
      { category: 'bottom', weight: 4, required: true },
      { category: 'shoes', weight: 5, required: true },
      { category: 'accessory', weight: 5, required: true },
      { category: 'hairstyle', weight: 2, required: false },
    ],
    appropriateTags: ['rain', 'waterproof', 'fun', 'colorful'],
    baseFashionPoints: 140,
  },
  {
    id: 'superhero-day',
    name: 'Superhero Day',
    description: 'Create your own super outfit!',
    tier: 5,
    unlockStars: 90,
    bgGradient: ['#FF4444', '#CC0000'],
    icon: '🦸',
    categoryWeights: [
      { category: 'top', weight: 5, required: true },
      { category: 'bottom', weight: 4, required: true },
      { category: 'shoes', weight: 4, required: true },
      { category: 'accessory', weight: 5, required: true },
      { category: 'hairstyle', weight: 3, required: false },
    ],
    appropriateTags: ['superhero', 'bold', 'colorful', 'creative'],
    baseFashionPoints: 140,
  },
];

export function getScenarioById(id: FashionScenarioId): FashionScenario | undefined {
  return fashionScenarios.find((s) => s.id === id);
}

export function getScenariosByTier(tier: number): FashionScenario[] {
  return fashionScenarios.filter((s) => s.tier === tier);
}

export function getUnlockedScenarios(currentStars: number): FashionScenario[] {
  return fashionScenarios.filter((s) => s.unlockStars <= currentStars);
}

export function getNextUnlockableScenario(currentStars: number): FashionScenario | undefined {
  return fashionScenarios
    .filter((s) => s.unlockStars > currentStars)
    .sort((a, b) => a.unlockStars - b.unlockStars)[0];
}
