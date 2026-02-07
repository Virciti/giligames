'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { FashionScenarioId, OutfitCategory, OutfitItem } from '@/content/types';
import { getItemById, OUTFIT_CATEGORIES } from '@/content/fashionItems';
import { getScenarioById } from '@/content/fashionScenarios';
import { CharacterSVG } from './character/CharacterSVG';

interface DressingRoomProps {
  scenarioId: FashionScenarioId;
  purchasedItems: string[];
  equippedItems: Partial<Record<OutfitCategory, string>>;
  onEquip: (category: OutfitCategory, itemId: string | null) => void;
  onStartShow: () => void;
  onBackToShop: () => void;
}

export function DressingRoom({
  scenarioId,
  purchasedItems,
  equippedItems,
  onEquip,
  onStartShow,
  onBackToShop,
}: DressingRoomProps) {
  const scenario = getScenarioById(scenarioId);

  // Pre-resolve all purchased items once, then group by category
  const ownedByCategory = useMemo(() => {
    const map: Partial<Record<OutfitCategory, OutfitItem[]>> = {};
    for (const id of purchasedItems) {
      const item = getItemById(id);
      if (item) {
        (map[item.category] ??= []).push(item);
      }
    }
    return map;
  }, [purchasedItems]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col h-full">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-white mb-1">Dressing Room</h2>
        <p className="text-white/70 text-sm">{scenario?.name}</p>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-auto">
        {/* Character Display */}
        <div className="flex-1 flex items-center justify-center bg-white/10 rounded-2xl p-4 min-h-[300px]">
          <CharacterSVG equippedItems={equippedItems} />
        </div>

        {/* Outfit Slots */}
        <div className="w-full md:w-64 space-y-2">
          <h3 className="text-white font-medium text-sm mb-2">Outfit Slots</h3>
          {OUTFIT_CATEGORIES.map((cat) => {
            const equippedId = equippedItems[cat.id];
            const equippedItem = equippedId ? getItemById(equippedId) : null;
            const ownedInCategory = ownedByCategory[cat.id] ?? [];

            return (
              <div key={cat.id} className="bg-white/10 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white text-sm">
                    {cat.icon} {cat.name}
                  </span>
                  {equippedItem && (
                    <button
                      onClick={() => onEquip(cat.id, null)}
                      className="text-white/50 hover:text-white text-xs"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {equippedItem ? (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded border border-white/20"
                      style={{ backgroundColor: equippedItem.primaryColor }}
                    />
                    <span className="text-white text-xs">{equippedItem.name}</span>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-white/20 rounded-lg py-2 text-center">
                    <span className="text-white/30 text-xs">Empty</span>
                  </div>
                )}

                {/* Quick swap buttons */}
                {ownedInCategory.length > 1 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {ownedInCategory.map((item) =>
                      item ? (
                        <button
                          key={item.id}
                          onClick={() => onEquip(cat.id, item.id)}
                          className={`w-6 h-6 rounded border-2 transition-colors ${
                            equippedId === item.id
                              ? 'border-white'
                              : 'border-white/20 hover:border-white/50'
                          }`}
                          style={{ backgroundColor: item.primaryColor }}
                          title={item.name}
                        />
                      ) : null
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-4 pt-4 border-t border-white/10">
        <button
          onClick={onBackToShop}
          className="flex-1 bg-white/20 text-white font-bold py-3 rounded-xl hover:bg-white/30 transition-colors"
        >
          Back to Shop
        </button>
        <button
          onClick={onStartShow}
          className="flex-1 bg-white text-purple-600 font-bold py-3 rounded-xl hover:bg-white/90 transition-colors"
        >
          Fashion Show!
        </button>
      </div>
    </div>
  );
}
