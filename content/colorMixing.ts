/**
 * Color mixing challenge content
 * Teaches primary, secondary, and tertiary color mixing
 */

export interface ColorMixQuestion {
  id: string;
  color1: { name: string; hex: string };
  color2: { name: string; hex: string };
  result: { name: string; hex: string };
  tier: number;
}

export const colorMixQuestions: ColorMixQuestion[] = [
  // Tier 1: Primary → Secondary (basics)
  {
    id: 'mix-red-yellow',
    color1: { name: 'Red', hex: '#FF0000' },
    color2: { name: 'Yellow', hex: '#FFE600' },
    result: { name: 'Orange', hex: '#FF9F43' },
    tier: 1,
  },
  {
    id: 'mix-blue-yellow',
    color1: { name: 'Blue', hex: '#0066FF' },
    color2: { name: 'Yellow', hex: '#FFE600' },
    result: { name: 'Green', hex: '#00CC00' },
    tier: 1,
  },
  {
    id: 'mix-red-blue',
    color1: { name: 'Red', hex: '#FF0000' },
    color2: { name: 'Blue', hex: '#0066FF' },
    result: { name: 'Purple', hex: '#9B5DE5' },
    tier: 1,
  },
  // Tier 2: More secondary mixes
  {
    id: 'mix-red-white',
    color1: { name: 'Red', hex: '#FF0000' },
    color2: { name: 'White', hex: '#FFFFFF' },
    result: { name: 'Pink', hex: '#FFB6C1' },
    tier: 2,
  },
  {
    id: 'mix-blue-white',
    color1: { name: 'Blue', hex: '#0066FF' },
    color2: { name: 'White', hex: '#FFFFFF' },
    result: { name: 'Light Blue', hex: '#87CEEB' },
    tier: 2,
  },
  {
    id: 'mix-black-white',
    color1: { name: 'Black', hex: '#333333' },
    color2: { name: 'White', hex: '#FFFFFF' },
    result: { name: 'Gray', hex: '#999999' },
    tier: 2,
  },
  // Tier 3: Tertiary colors
  {
    id: 'mix-red-orange',
    color1: { name: 'Red', hex: '#FF0000' },
    color2: { name: 'Orange', hex: '#FF9F43' },
    result: { name: 'Red-Orange', hex: '#FF4500' },
    tier: 3,
  },
  {
    id: 'mix-yellow-green',
    color1: { name: 'Yellow', hex: '#FFE600' },
    color2: { name: 'Green', hex: '#00CC00' },
    result: { name: 'Yellow-Green', hex: '#9ACD32' },
    tier: 3,
  },
  {
    id: 'mix-blue-purple',
    color1: { name: 'Blue', hex: '#0066FF' },
    color2: { name: 'Purple', hex: '#9B5DE5' },
    result: { name: 'Indigo', hex: '#4B0082' },
    tier: 3,
  },
  // Tier 4: Tints and shades
  {
    id: 'mix-green-white',
    color1: { name: 'Green', hex: '#00CC00' },
    color2: { name: 'White', hex: '#FFFFFF' },
    result: { name: 'Mint', hex: '#98FB98' },
    tier: 4,
  },
  {
    id: 'mix-purple-white',
    color1: { name: 'Purple', hex: '#9B5DE5' },
    color2: { name: 'White', hex: '#FFFFFF' },
    result: { name: 'Lavender', hex: '#E6E6FA' },
    tier: 4,
  },
  {
    id: 'mix-orange-white',
    color1: { name: 'Orange', hex: '#FF9F43' },
    color2: { name: 'White', hex: '#FFFFFF' },
    result: { name: 'Peach', hex: '#FFDAB9' },
    tier: 4,
  },
  // Tier 5: Complex mixes
  {
    id: 'mix-red-green',
    color1: { name: 'Red', hex: '#FF0000' },
    color2: { name: 'Green', hex: '#00CC00' },
    result: { name: 'Brown', hex: '#8B4513' },
    tier: 5,
  },
  {
    id: 'mix-yellow-purple',
    color1: { name: 'Yellow', hex: '#FFE600' },
    color2: { name: 'Purple', hex: '#9B5DE5' },
    result: { name: 'Olive', hex: '#808000' },
    tier: 5,
  },
  {
    id: 'mix-blue-orange',
    color1: { name: 'Blue', hex: '#0066FF' },
    color2: { name: 'Orange', hex: '#FF9F43' },
    result: { name: 'Teal', hex: '#008080' },
    tier: 5,
  },
];

export function getColorMixByTier(tier: number): ColorMixQuestion[] {
  return colorMixQuestions.filter((q) => q.tier === tier);
}

export function getColorMixUpToTier(tier: number): ColorMixQuestion[] {
  return colorMixQuestions.filter((q) => q.tier <= tier);
}

/** Get wrong color answers for multiple choice */
export function getWrongColors(
  correct: { name: string; hex: string },
  count: number = 3
): Array<{ name: string; hex: string }> {
  const allColors = [
    { name: 'Red', hex: '#FF0000' },
    { name: 'Orange', hex: '#FF9F43' },
    { name: 'Yellow', hex: '#FFE600' },
    { name: 'Green', hex: '#00CC00' },
    { name: 'Blue', hex: '#0066FF' },
    { name: 'Purple', hex: '#9B5DE5' },
    { name: 'Pink', hex: '#FFB6C1' },
    { name: 'Brown', hex: '#8B4513' },
    { name: 'Gray', hex: '#999999' },
    { name: 'Light Blue', hex: '#87CEEB' },
    { name: 'Mint', hex: '#98FB98' },
    { name: 'Lavender', hex: '#E6E6FA' },
    { name: 'Peach', hex: '#FFDAB9' },
    { name: 'Teal', hex: '#008080' },
    { name: 'Indigo', hex: '#4B0082' },
  ];

  const filtered = allColors.filter((c) => c.name !== correct.name);
  const shuffled = filtered.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
