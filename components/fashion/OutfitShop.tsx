'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Check } from 'lucide-react';
import type { FashionScenarioId, OutfitCategory } from '@/content/types';
import { getItemsForScenario, getItemById, OUTFIT_CATEGORIES } from '@/content/fashionItems';
import { getScenarioById } from '@/content/fashionScenarios';

interface OutfitShopProps {
  scenarioId: FashionScenarioId;
  fashionPoints: number;
  purchasedItems: string[];
  equippedItems: Partial<Record<OutfitCategory, string>>;
  onPurchase: (itemId: string, cost: number) => void;
  onEquip: (category: OutfitCategory, itemId: string | null) => void;
  onGoToDressing: () => void;
  onEarnMore: () => void;
}

export function OutfitShop({
  scenarioId,
  fashionPoints,
  purchasedItems,
  equippedItems,
  onPurchase,
  onEquip,
  onGoToDressing,
  onEarnMore,
}: OutfitShopProps) {
  const [activeCategory, setActiveCategory] = useState<OutfitCategory>('top');
  const scenario = getScenarioById(scenarioId);
  const availableItems = useMemo(() => getItemsForScenario(scenarioId), [scenarioId]);
  const categoryItems = useMemo(
    () => availableItems.filter((item) => item.category === activeCategory),
    [availableItems, activeCategory]
  );
  const categoryCounts = useMemo(() => {
    const counts: Partial<Record<OutfitCategory, number>> = {};
    for (const item of availableItems) {
      counts[item.category] = (counts[item.category] ?? 0) + 1;
    }
    return counts;
  }, [availableItems]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col h-full">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-white mb-1">Outfit Shop</h2>
        <p className="text-white/70 text-sm">
          {scenario?.name} - Pick your outfit pieces!
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {OUTFIT_CATEGORIES.map((cat) => {
          const count = categoryCounts[cat.id] ?? 0;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full font-medium text-sm transition-colors ${
                activeCategory === cat.id
                  ? 'bg-white text-purple-600'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              {cat.icon} {cat.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Item Grid */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {categoryItems
            .sort((a, b) => a.tier - b.tier)
            .map((item) => {
              const owned = purchasedItems.includes(item.id);
              const equipped = Object.values(equippedItems).includes(item.id);
              const canAfford = fashionPoints >= item.cost;
              const scenarioTags = scenario?.appropriateTags ?? [];
              const isAppropriate = item.tags.some((t) => scenarioTags.includes(t));

              return (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => {
                    if (owned) {
                      // Toggle equip
                      if (equipped) {
                        onEquip(item.category, null);
                      } else {
                        onEquip(item.category, item.id);
                      }
                    } else if (canAfford) {
                      onPurchase(item.id, item.cost);
                      onEquip(item.category, item.id);
                    }
                  }}
                  disabled={!owned && !canAfford}
                  className={`relative rounded-xl p-4 text-left transition-all ${
                    equipped
                      ? 'bg-white/40 ring-2 ring-white'
                      : owned
                        ? 'bg-white/25 hover:bg-white/35'
                        : canAfford
                          ? 'bg-white/15 hover:bg-white/25'
                          : 'bg-white/5 opacity-50 cursor-not-allowed'
                  }`}
                >
                  {/* Item color swatch */}
                  <div
                    className="w-10 h-10 rounded-lg mb-2 border-2 border-white/20"
                    style={{ backgroundColor: item.primaryColor }}
                  />

                  <h4 className="text-white font-medium text-sm leading-tight">{item.name}</h4>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: item.tier }).map((_, i) => (
                        <span key={i} className="text-yellow-400 text-xs">★</span>
                      ))}
                    </div>
                    {owned ? (
                      <span className="text-green-300 text-xs font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" /> Owned
                      </span>
                    ) : (
                      <span className={`text-xs font-bold ${canAfford ? 'text-yellow-300' : 'text-white/40'}`}>
                        {item.cost} FP
                      </span>
                    )}
                  </div>

                  {isAppropriate && !owned && (
                    <div className="absolute top-2 right-2 text-xs bg-green-500/80 text-white px-1.5 py-0.5 rounded-full">
                      ✓ Match
                    </div>
                  )}

                  {equipped && (
                    <div className="absolute top-2 right-2 text-xs bg-white text-purple-600 px-1.5 py-0.5 rounded-full font-bold">
                      Worn
                    </div>
                  )}
                </motion.button>
              );
            })}
        </div>

        {categoryItems.length === 0 && (
          <div className="text-center py-12 text-white/50">
            <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No items in this category for this scenario</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-4 pt-4 border-t border-white/10">
        <button
          onClick={onEarnMore}
          className="flex-1 bg-white/20 text-white font-bold py-3 rounded-xl hover:bg-white/30 transition-colors"
        >
          Earn More Points
        </button>
        <button
          onClick={onGoToDressing}
          className="flex-1 bg-white text-purple-600 font-bold py-3 rounded-xl hover:bg-white/90 transition-colors"
        >
          Dressing Room
        </button>
      </div>
    </div>
  );
}
