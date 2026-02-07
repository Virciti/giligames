'use client';

import type { OutfitItem } from '@/content/types';
import { outfitParts } from './outfitParts';

interface OutfitLayerProps {
  item: OutfitItem | undefined;
  layer: 'back' | 'front';
}

export function OutfitLayer({ item, layer }: OutfitLayerProps) {
  if (!item) return null;

  const partFn = outfitParts[item.svgKey];
  if (!partFn) return null;

  return partFn(item.primaryColor, item.secondaryColor, layer);
}
