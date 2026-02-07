/**
 * Fashion outfit items - Clothing, shoes, accessories, and hairstyles by tier
 */

import type { OutfitItem, OutfitCategory, FashionScenarioId } from './types';
import { getScenarioById } from './fashionScenarios';

export const fashionItems: OutfitItem[] = [
  // ============================================================
  // TOPS (15 items)
  // ============================================================
  // Tier 1
  { id: 'top-basic-tee', name: 'Basic T-Shirt', category: 'top', tier: 1, cost: 5, primaryColor: '#FF6B6B', tags: ['casual', 'school', 'comfortable'], svgKey: 'tshirt' },
  { id: 'top-striped-tee', name: 'Striped Tee', category: 'top', tier: 1, cost: 6, primaryColor: '#4ECDC4', secondaryColor: '#FFFFFF', tags: ['casual', 'school', 'fun'], svgKey: 'stripedTee' },
  { id: 'top-tank', name: 'Tank Top', category: 'top', tier: 1, cost: 5, primaryColor: '#FFE66D', tags: ['casual', 'beach', 'summer'], svgKey: 'tankTop' },
  // Tier 2
  { id: 'top-hoodie', name: 'Cozy Hoodie', category: 'top', tier: 2, cost: 12, primaryColor: '#9B5DE5', tags: ['casual', 'comfortable', 'cozy', 'school'], svgKey: 'hoodie' },
  { id: 'top-blouse', name: 'Pretty Blouse', category: 'top', tier: 2, cost: 14, primaryColor: '#FFB6C1', tags: ['neat', 'school', 'party'], svgKey: 'blouse' },
  { id: 'top-polo', name: 'Polo Shirt', category: 'top', tier: 2, cost: 12, primaryColor: '#4ECDC4', tags: ['school', 'neat', 'casual'], svgKey: 'polo' },
  // Tier 3
  { id: 'top-leotard', name: 'Sparkle Leotard', category: 'top', tier: 3, cost: 22, primaryColor: '#9B5DE5', tags: ['dance', 'performance', 'sparkly', 'athletic'], svgKey: 'leotard' },
  { id: 'top-sequin', name: 'Sequin Top', category: 'top', tier: 3, cost: 25, primaryColor: '#FFE66D', tags: ['sparkly', 'party', 'fancy', 'elegant'], svgKey: 'sequinTop' },
  { id: 'top-athletic', name: 'Athletic Top', category: 'top', tier: 3, cost: 20, primaryColor: '#7BC74D', tags: ['sporty', 'athletic', 'flexible', 'neat'], svgKey: 'athleticTop' },
  // Tier 4
  { id: 'top-winter-coat', name: 'Puffy Winter Coat', category: 'top', tier: 4, cost: 32, primaryColor: '#A8D8EA', tags: ['winter', 'warm', 'cozy', 'snow'], svgKey: 'winterCoat' },
  { id: 'top-pj-top', name: 'Star PJ Top', category: 'top', tier: 4, cost: 28, primaryColor: '#D4A5FF', secondaryColor: '#FFE66D', tags: ['cozy', 'sleepover', 'cute', 'comfortable'], svgKey: 'pjTop' },
  { id: 'top-rain-jacket', name: 'Rainbow Raincoat', category: 'top', tier: 4, cost: 35, primaryColor: '#FFE66D', tags: ['rain', 'waterproof', 'colorful', 'fun'], svgKey: 'rainJacket' },
  // Tier 5
  { id: 'top-superhero', name: 'Super Hero Top', category: 'top', tier: 5, cost: 45, primaryColor: '#FF4444', secondaryColor: '#FFE66D', tags: ['superhero', 'bold', 'creative', 'colorful'], svgKey: 'superheroTop' },
  { id: 'top-gown-bodice', name: 'Elegant Bodice', category: 'top', tier: 5, cost: 48, primaryColor: '#FFD700', tags: ['fancy', 'elegant', 'sparkly', 'dressy'], svgKey: 'gownBodice' },
  { id: 'top-rainbow-hoodie', name: 'Rainbow Hoodie', category: 'top', tier: 5, cost: 42, primaryColor: '#FF6B6B', secondaryColor: '#9B5DE5', tags: ['creative', 'colorful', 'fun', 'bold'], svgKey: 'rainbowHoodie' },

  // ============================================================
  // BOTTOMS (12 items)
  // ============================================================
  // Tier 1
  { id: 'bottom-jeans', name: 'Blue Jeans', category: 'bottom', tier: 1, cost: 5, primaryColor: '#4A6FA5', tags: ['casual', 'school', 'comfortable'], svgKey: 'jeans' },
  { id: 'bottom-shorts', name: 'Comfy Shorts', category: 'bottom', tier: 1, cost: 5, primaryColor: '#7BC74D', tags: ['casual', 'beach', 'summer', 'comfortable'], svgKey: 'shorts' },
  // Tier 2
  { id: 'bottom-skirt', name: 'Twirl Skirt', category: 'bottom', tier: 2, cost: 12, primaryColor: '#FF6B6B', tags: ['fun', 'party', 'school', 'colorful'], svgKey: 'skirt' },
  { id: 'bottom-leggings', name: 'Stretchy Leggings', category: 'bottom', tier: 2, cost: 10, primaryColor: '#333333', tags: ['athletic', 'flexible', 'comfortable', 'casual'], svgKey: 'leggings' },
  // Tier 3
  { id: 'bottom-tutu', name: 'Fluffy Tutu', category: 'bottom', tier: 3, cost: 22, primaryColor: '#FFB6C1', tags: ['dance', 'performance', 'sparkly', 'elegant'], svgKey: 'tutu' },
  { id: 'bottom-gym-shorts', name: 'Gym Shorts', category: 'bottom', tier: 3, cost: 18, primaryColor: '#7BC74D', tags: ['sporty', 'athletic', 'flexible', 'neat'], svgKey: 'gymShorts' },
  // Tier 4
  { id: 'bottom-snow-pants', name: 'Snow Pants', category: 'bottom', tier: 4, cost: 30, primaryColor: '#6C8EBF', tags: ['winter', 'warm', 'snow', 'cozy'], svgKey: 'snowPants' },
  { id: 'bottom-pj-pants', name: 'Cloud PJ Pants', category: 'bottom', tier: 4, cost: 28, primaryColor: '#B088F9', tags: ['cozy', 'sleepover', 'cute', 'comfortable'], svgKey: 'pjPants' },
  { id: 'bottom-rain-pants', name: 'Splash Pants', category: 'bottom', tier: 4, cost: 30, primaryColor: '#87CEEB', tags: ['rain', 'waterproof', 'fun'], svgKey: 'rainPants' },
  // Tier 5
  { id: 'bottom-sparkle-skirt', name: 'Sparkle Ball Skirt', category: 'bottom', tier: 5, cost: 48, primaryColor: '#FFD700', tags: ['fancy', 'elegant', 'sparkly', 'dressy'], svgKey: 'sparkleSkirt' },
  { id: 'bottom-hero-pants', name: 'Hero Pants', category: 'bottom', tier: 5, cost: 40, primaryColor: '#0066FF', tags: ['superhero', 'bold', 'colorful'], svgKey: 'heroPants' },
  { id: 'bottom-flare-pants', name: 'Disco Flares', category: 'bottom', tier: 5, cost: 42, primaryColor: '#9B5DE5', tags: ['party', 'fun', 'colorful', 'creative'], svgKey: 'flarePants' },

  // ============================================================
  // DRESSES (10 items)
  // ============================================================
  // Tier 1
  { id: 'dress-sundress', name: 'Simple Sundress', category: 'dress', tier: 1, cost: 8, primaryColor: '#FFE66D', tags: ['casual', 'summer', 'fun', 'comfortable'], svgKey: 'sundress' },
  // Tier 2
  { id: 'dress-party', name: 'Party Dress', category: 'dress', tier: 2, cost: 15, primaryColor: '#FF6B6B', tags: ['party', 'fun', 'colorful'], svgKey: 'partyDress' },
  { id: 'dress-school', name: 'School Jumper', category: 'dress', tier: 2, cost: 14, primaryColor: '#4ECDC4', tags: ['school', 'neat', 'casual'], svgKey: 'schoolJumper' },
  // Tier 3
  { id: 'dress-ballet-tutu', name: 'Ballet Tutu Dress', category: 'dress', tier: 3, cost: 25, primaryColor: '#FFB6C1', tags: ['dance', 'performance', 'elegant', 'sparkly'], svgKey: 'balletDress' },
  { id: 'dress-gymnast', name: 'Gymnast Unitard', category: 'dress', tier: 3, cost: 22, primaryColor: '#9B5DE5', tags: ['sporty', 'athletic', 'flexible', 'performance'], svgKey: 'unitard' },
  // Tier 4
  { id: 'dress-pj-onesie', name: 'Unicorn Onesie', category: 'dress', tier: 4, cost: 35, primaryColor: '#D4A5FF', secondaryColor: '#FFB6C1', tags: ['cozy', 'sleepover', 'cute', 'fun'], svgKey: 'onesie' },
  { id: 'dress-cocktail', name: 'Fancy Dress', category: 'dress', tier: 4, cost: 38, primaryColor: '#CC0000', tags: ['fancy', 'elegant', 'dressy', 'party'], svgKey: 'fancyDress' },
  // Tier 5
  { id: 'dress-princess', name: 'Princess Gown', category: 'dress', tier: 5, cost: 55, primaryColor: '#D4A5FF', secondaryColor: '#FFD700', tags: ['fancy', 'elegant', 'sparkly', 'dressy', 'performance'], svgKey: 'princessGown' },
  { id: 'dress-superhero', name: 'Hero Suit', category: 'dress', tier: 5, cost: 50, primaryColor: '#FF4444', secondaryColor: '#0066FF', tags: ['superhero', 'bold', 'creative', 'colorful'], svgKey: 'heroSuit' },
  { id: 'dress-rainbow', name: 'Rainbow Gala Dress', category: 'dress', tier: 5, cost: 52, primaryColor: '#FF6B6B', secondaryColor: '#FFE66D', tags: ['party', 'colorful', 'sparkly', 'fun', 'creative'], svgKey: 'rainbowDress' },

  // ============================================================
  // SHOES (12 items)
  // ============================================================
  // Tier 1
  { id: 'shoes-sneakers', name: 'Comfy Sneakers', category: 'shoes', tier: 1, cost: 5, primaryColor: '#FFFFFF', secondaryColor: '#FFB6C1', tags: ['casual', 'school', 'comfortable', 'sporty'], svgKey: 'sneakers' },
  { id: 'shoes-sandals', name: 'Flip Flops', category: 'shoes', tier: 1, cost: 5, primaryColor: '#4ECDC4', tags: ['beach', 'summer', 'casual'], svgKey: 'sandals' },
  // Tier 2
  { id: 'shoes-mary-janes', name: 'Mary Janes', category: 'shoes', tier: 2, cost: 12, primaryColor: '#333333', tags: ['school', 'neat', 'party'], svgKey: 'maryJanes' },
  { id: 'shoes-hi-tops', name: 'Hi-Top Sneakers', category: 'shoes', tier: 2, cost: 14, primaryColor: '#FF6B6B', tags: ['casual', 'fun', 'colorful', 'sporty'], svgKey: 'hiTops' },
  // Tier 3
  { id: 'shoes-ballet', name: 'Ballet Slippers', category: 'shoes', tier: 3, cost: 22, primaryColor: '#FFB6C1', tags: ['dance', 'performance', 'elegant'], svgKey: 'balletSlippers' },
  { id: 'shoes-gym', name: 'Gym Shoes', category: 'shoes', tier: 3, cost: 18, primaryColor: '#FFFFFF', secondaryColor: '#7BC74D', tags: ['sporty', 'athletic', 'flexible'], svgKey: 'gymShoes' },
  // Tier 4
  { id: 'shoes-boots', name: 'Fuzzy Snow Boots', category: 'shoes', tier: 4, cost: 32, primaryColor: '#8B4513', secondaryColor: '#FFFFFF', tags: ['winter', 'warm', 'cozy', 'snow'], svgKey: 'snowBoots' },
  { id: 'shoes-slippers', name: 'Bunny Slippers', category: 'shoes', tier: 4, cost: 28, primaryColor: '#FFB6C1', tags: ['cozy', 'sleepover', 'cute'], svgKey: 'bunnySlippers' },
  { id: 'shoes-rain-boots', name: 'Rainbow Rain Boots', category: 'shoes', tier: 4, cost: 30, primaryColor: '#FFE66D', secondaryColor: '#FF6B6B', tags: ['rain', 'waterproof', 'fun', 'colorful'], svgKey: 'rainBoots' },
  // Tier 5
  { id: 'shoes-sparkle-heels', name: 'Glass Slippers', category: 'shoes', tier: 5, cost: 45, primaryColor: '#C0C0C0', secondaryColor: '#FFD700', tags: ['fancy', 'elegant', 'sparkly', 'dressy'], svgKey: 'glassSlippers' },
  { id: 'shoes-hero-boots', name: 'Hero Power Boots', category: 'shoes', tier: 5, cost: 42, primaryColor: '#FF4444', tags: ['superhero', 'bold', 'colorful'], svgKey: 'heroBoots' },
  { id: 'shoes-platform', name: 'Star Platform Shoes', category: 'shoes', tier: 5, cost: 40, primaryColor: '#9B5DE5', secondaryColor: '#FFE66D', tags: ['party', 'creative', 'fun', 'colorful'], svgKey: 'platformShoes' },

  // ============================================================
  // ACCESSORIES (14 items)
  // ============================================================
  // Tier 1
  { id: 'acc-hair-bow', name: 'Hair Bow', category: 'accessory', tier: 1, cost: 5, primaryColor: '#FF6B6B', tags: ['casual', 'school', 'party', 'cute'], svgKey: 'hairBow' },
  { id: 'acc-headband', name: 'Simple Headband', category: 'accessory', tier: 1, cost: 5, primaryColor: '#4ECDC4', tags: ['casual', 'school', 'neat'], svgKey: 'headband' },
  // Tier 2
  { id: 'acc-sunglasses', name: 'Heart Sunglasses', category: 'accessory', tier: 2, cost: 12, primaryColor: '#FF69B4', tags: ['beach', 'summer', 'sun', 'fun'], svgKey: 'sunglasses' },
  { id: 'acc-backpack', name: 'Star Backpack', category: 'accessory', tier: 2, cost: 14, primaryColor: '#9B5DE5', tags: ['school', 'casual', 'fun'], svgKey: 'backpack' },
  // Tier 3
  { id: 'acc-dance-ribbon', name: 'Dance Ribbon', category: 'accessory', tier: 3, cost: 20, primaryColor: '#FFB6C1', tags: ['dance', 'performance', 'elegant', 'sparkly'], svgKey: 'danceRibbon' },
  { id: 'acc-wristband', name: 'Sport Wristbands', category: 'accessory', tier: 3, cost: 18, primaryColor: '#7BC74D', tags: ['sporty', 'athletic', 'neat'], svgKey: 'wristbands' },
  { id: 'acc-necklace', name: 'Flower Necklace', category: 'accessory', tier: 3, cost: 22, primaryColor: '#FFE66D', tags: ['party', 'fun', 'colorful'], svgKey: 'necklace' },
  // Tier 4
  { id: 'acc-scarf', name: 'Cozy Scarf', category: 'accessory', tier: 4, cost: 28, primaryColor: '#FF6B6B', secondaryColor: '#FFFFFF', tags: ['winter', 'warm', 'cozy', 'snow'], svgKey: 'scarf' },
  { id: 'acc-sleep-mask', name: 'Star Sleep Mask', category: 'accessory', tier: 4, cost: 25, primaryColor: '#D4A5FF', tags: ['sleepover', 'cute', 'cozy'], svgKey: 'sleepMask' },
  { id: 'acc-umbrella', name: 'Rainbow Umbrella', category: 'accessory', tier: 4, cost: 30, primaryColor: '#FF6B6B', secondaryColor: '#FFE66D', tags: ['rain', 'waterproof', 'colorful', 'fun'], svgKey: 'umbrella' },
  { id: 'acc-earrings', name: 'Sparkle Earrings', category: 'accessory', tier: 4, cost: 32, primaryColor: '#FFD700', tags: ['fancy', 'elegant', 'sparkly', 'dressy'], svgKey: 'earrings' },
  // Tier 5
  { id: 'acc-tiara', name: 'Diamond Tiara', category: 'accessory', tier: 5, cost: 48, primaryColor: '#FFD700', secondaryColor: '#C0C0C0', tags: ['fancy', 'elegant', 'sparkly', 'dressy', 'performance'], svgKey: 'tiara' },
  { id: 'acc-cape', name: 'Superhero Cape', category: 'accessory', tier: 5, cost: 45, primaryColor: '#FF4444', tags: ['superhero', 'bold', 'creative', 'colorful'], svgKey: 'cape' },
  { id: 'acc-magic-wand', name: 'Magic Wand', category: 'accessory', tier: 5, cost: 42, primaryColor: '#9B5DE5', secondaryColor: '#FFE66D', tags: ['creative', 'sparkly', 'fun', 'party'], svgKey: 'magicWand' },

  // ============================================================
  // HAIRSTYLES (10 items)
  // ============================================================
  // Tier 1
  { id: 'hair-ponytail', name: 'Ponytail', category: 'hairstyle', tier: 1, cost: 5, primaryColor: '#8B4513', tags: ['casual', 'school', 'sporty', 'neat', 'athletic'], svgKey: 'ponytail' },
  { id: 'hair-pigtails', name: 'Pigtails', category: 'hairstyle', tier: 1, cost: 6, primaryColor: '#D2691E', tags: ['casual', 'school', 'cute', 'fun'], svgKey: 'pigtails' },
  // Tier 2
  { id: 'hair-braids', name: 'Double Braids', category: 'hairstyle', tier: 2, cost: 12, primaryColor: '#8B4513', tags: ['casual', 'school', 'neat', 'cute'], svgKey: 'braids' },
  { id: 'hair-bob', name: 'Cute Bob', category: 'hairstyle', tier: 2, cost: 14, primaryColor: '#333333', tags: ['neat', 'casual', 'party', 'school'], svgKey: 'bob' },
  // Tier 3
  { id: 'hair-ballet-bun', name: 'Ballet Bun', category: 'hairstyle', tier: 3, cost: 20, primaryColor: '#8B4513', tags: ['dance', 'performance', 'elegant', 'neat', 'athletic'], svgKey: 'balletBun' },
  { id: 'hair-wavy', name: 'Beach Waves', category: 'hairstyle', tier: 3, cost: 22, primaryColor: '#D2691E', tags: ['beach', 'summer', 'casual', 'fun'], svgKey: 'beachWaves' },
  // Tier 4
  { id: 'hair-curls', name: 'Glamour Curls', category: 'hairstyle', tier: 4, cost: 32, primaryColor: '#333333', tags: ['fancy', 'elegant', 'party', 'dressy'], svgKey: 'glamourCurls' },
  { id: 'hair-messy-bun', name: 'Messy Bun', category: 'hairstyle', tier: 4, cost: 28, primaryColor: '#8B4513', tags: ['cozy', 'sleepover', 'cute', 'casual', 'comfortable'], svgKey: 'messyBun' },
  // Tier 5
  { id: 'hair-rainbow', name: 'Rainbow Cascade', category: 'hairstyle', tier: 5, cost: 45, primaryColor: '#FF6B6B', secondaryColor: '#9B5DE5', tags: ['creative', 'colorful', 'bold', 'superhero', 'fun', 'party'], svgKey: 'rainbowHair' },
  { id: 'hair-princess-updo', name: 'Princess Updo', category: 'hairstyle', tier: 5, cost: 48, primaryColor: '#FFD700', tags: ['fancy', 'elegant', 'sparkly', 'dressy', 'performance'], svgKey: 'princessUpdo' },
];

// ============================================================
// Helper Functions
// ============================================================

export function getItemById(id: string): OutfitItem | undefined {
  return fashionItems.find((i) => i.id === id);
}

export function getItemsByCategory(category: OutfitCategory): OutfitItem[] {
  return fashionItems.filter((i) => i.category === category);
}

export function getItemsByTier(tier: number): OutfitItem[] {
  return fashionItems.filter((i) => i.tier === tier);
}

export function getItemsUpToTier(tier: number): OutfitItem[] {
  return fashionItems.filter((i) => i.tier <= tier);
}

export function getItemsByBudget(maxCost: number): OutfitItem[] {
  return fashionItems.filter((i) => i.cost <= maxCost);
}

export function getItemsForScenario(scenarioId: FashionScenarioId): OutfitItem[] {
  const scenario = getScenarioById(scenarioId);
  if (!scenario) return [];
  return fashionItems.filter(
    (item) =>
      item.tier <= scenario.tier &&
      item.tags.some((tag) => scenario.appropriateTags.includes(tag))
  );
}

export function getItemsSortedByCost(category?: OutfitCategory): OutfitItem[] {
  const items = category
    ? fashionItems.filter((i) => i.category === category)
    : [...fashionItems];
  return items.sort((a, b) => a.cost - b.cost);
}

export const OUTFIT_CATEGORIES: { id: OutfitCategory; name: string; icon: string }[] = [
  { id: 'top', name: 'Tops', icon: '👕' },
  { id: 'bottom', name: 'Bottoms', icon: '👖' },
  { id: 'dress', name: 'Dresses', icon: '👗' },
  { id: 'shoes', name: 'Shoes', icon: '👟' },
  { id: 'accessory', name: 'Accessories', icon: '✨' },
  { id: 'hairstyle', name: 'Hair', icon: '💇' },
];
