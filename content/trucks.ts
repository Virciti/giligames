/**
 * Truck definitions with stats and unlock requirements
 */

import type { Truck } from './types';

// Re-export the Truck type for convenience
export type { Truck };

export const trucks: Truck[] = [
  // Default trucks (unlocked from start)
  {
    id: 'truck-red-rocket',
    name: 'Red Rocket',
    tagline: 'Fast and fun!',
    color: '#FF6B6B',
    secondaryColor: '#CC5555',
    stats: {
      speed: 3,
      jump: 3,
      handling: 4,
    },
    unlockRequirement: { type: 'default' },
    imagePath: '/images/trucks/red-rocket.png',
  },
  {
    id: 'truck-blue-thunder',
    name: 'Blue Thunder',
    tagline: 'Ready to rumble!',
    color: '#4ECDC4',
    secondaryColor: '#3BA89F',
    stats: {
      speed: 4,
      jump: 3,
      handling: 3,
    },
    unlockRequirement: { type: 'default' },
    imagePath: '/images/trucks/blue-thunder.png',
  },

  // Star-unlockable trucks
  {
    id: 'truck-golden-crusher',
    name: 'Golden Crusher',
    tagline: 'Shine bright!',
    color: '#FFE66D',
    secondaryColor: '#CCBB55',
    stats: {
      speed: 4,
      jump: 4,
      handling: 3,
    },
    unlockRequirement: { type: 'stars', value: 10 },
    imagePath: '/images/trucks/golden-crusher.png',
  },
  {
    id: 'truck-green-machine',
    name: 'Green Machine',
    tagline: 'Go, go, GO!',
    color: '#7BC74D',
    secondaryColor: '#5FA038',
    stats: {
      speed: 5,
      jump: 3,
      handling: 3,
    },
    unlockRequirement: { type: 'stars', value: 25 },
    imagePath: '/images/trucks/green-machine.png',
  },
  {
    id: 'truck-purple-power',
    name: 'Purple Power',
    tagline: 'Jump to the stars!',
    color: '#9B5DE5',
    secondaryColor: '#7A4AB8',
    stats: {
      speed: 3,
      jump: 5,
      handling: 4,
    },
    unlockRequirement: { type: 'stars', value: 50 },
    imagePath: '/images/trucks/purple-power.png',
  },
  {
    id: 'truck-orange-blaze',
    name: 'Orange Blaze',
    tagline: 'On fire!',
    color: '#FF9F43',
    secondaryColor: '#CC7F35',
    stats: {
      speed: 5,
      jump: 4,
      handling: 4,
    },
    unlockRequirement: { type: 'stars', value: 100 },
    imagePath: '/images/trucks/orange-blaze.png',
  },

  // Achievement-unlockable truck
  {
    id: 'truck-rainbow-racer',
    name: 'Rainbow Racer',
    tagline: 'All the colors!',
    color: 'linear-gradient(90deg, #FF6B6B, #FFE66D, #7BC74D, #4ECDC4, #9B5DE5)',
    secondaryColor: '#FFFFFF',
    stats: {
      speed: 5,
      jump: 5,
      handling: 5,
    },
    unlockRequirement: { type: 'stars', value: 200 },
    imagePath: '/images/trucks/rainbow-racer.png',
  },
];

/**
 * Get a truck by its ID
 */
export function getTruckById(id: string): Truck | undefined {
  return trucks.find((t) => t.id === id);
}

/**
 * Get all default (starting) trucks
 */
export function getDefaultTrucks(): Truck[] {
  return trucks.filter((t) => t.unlockRequirement.type === 'default');
}

/**
 * Get all trucks that are unlocked with stars
 */
export function getStarUnlockableTrucks(): Truck[] {
  return trucks.filter((t) => t.unlockRequirement.type === 'stars');
}

/**
 * Check if a truck is unlocked based on current stars
 */
export function isTruckUnlocked(truck: Truck, currentStars: number): boolean {
  if (truck.unlockRequirement.type === 'default') return true;
  if (truck.unlockRequirement.type === 'stars') {
    return currentStars >= (truck.unlockRequirement.value ?? 0);
  }
  return false;
}

/**
 * Get the next truck to unlock based on current stars
 */
export function getNextUnlockableTruck(currentStars: number): Truck | undefined {
  const starTrucks = getStarUnlockableTrucks()
    .filter((t) => !isTruckUnlocked(t, currentStars))
    .sort((a, b) => (a.unlockRequirement.value ?? 0) - (b.unlockRequirement.value ?? 0));

  return starTrucks[0];
}

/**
 * Get progress towards unlocking a truck (0-100)
 */
export function getUnlockProgress(truck: Truck, currentStars: number): number {
  if (truck.unlockRequirement.type === 'default') return 100;
  if (truck.unlockRequirement.type !== 'stars') return 0;

  const required = truck.unlockRequirement.value ?? 0;
  if (required === 0) return 100;

  return Math.min(100, Math.floor((currentStars / required) * 100));
}

/**
 * Get all trucks sorted by unlock requirement
 */
export function getTrucksSortedByUnlock(): Truck[] {
  return [...trucks].sort((a, b) => {
    // Default trucks first
    if (a.unlockRequirement.type === 'default' && b.unlockRequirement.type !== 'default') return -1;
    if (a.unlockRequirement.type !== 'default' && b.unlockRequirement.type === 'default') return 1;

    // Then by star requirement
    const aStars = a.unlockRequirement.value ?? 0;
    const bStars = b.unlockRequirement.value ?? 0;
    return aStars - bStars;
  });
}

/**
 * Get star milestones for truck unlocks
 */
export function getUnlockMilestones(): number[] {
  return trucks
    .filter((t) => t.unlockRequirement.type === 'stars')
    .map((t) => t.unlockRequirement.value ?? 0)
    .sort((a, b) => a - b);
}
