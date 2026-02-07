'use client';

import { motion } from 'framer-motion';
import { Lock, Star } from 'lucide-react';
import type { FashionScenarioId } from '@/content/types';
import { fashionScenarios } from '@/content/fashionScenarios';
import { usePlayerStore } from '@/lib/stores/player-store';

interface ScenarioSelectProps {
  onSelect: (id: FashionScenarioId) => void;
}

export function ScenarioSelect({ onSelect }: ScenarioSelectProps) {
  const totalStars = usePlayerStore((s) => s.totalStars);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Choose Your Scenario</h2>
        <p className="text-white/70">Where are you getting dressed for?</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {fashionScenarios.map((scenario, index) => {
          const isLocked = totalStars < scenario.unlockStars;

          return (
            <motion.button
              key={scenario.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => !isLocked && onSelect(scenario.id)}
              disabled={isLocked}
              className={`relative rounded-2xl p-5 text-left transition-transform min-h-[140px] flex flex-col justify-between ${
                isLocked
                  ? 'bg-white/10 cursor-not-allowed'
                  : 'hover:scale-105 cursor-pointer shadow-lg'
              }`}
              style={
                !isLocked
                  ? {
                      background: `linear-gradient(135deg, ${scenario.bgGradient[0]}, ${scenario.bgGradient[1]})`,
                    }
                  : undefined
              }
            >
              <div>
                <span className="text-3xl mb-2 block">{scenario.icon}</span>
                <h3 className={`font-bold text-lg ${isLocked ? 'text-white/40' : 'text-white'}`}>
                  {scenario.name}
                </h3>
                <p className={`text-sm mt-1 ${isLocked ? 'text-white/20' : 'text-white/80'}`}>
                  {scenario.description}
                </p>
              </div>

              {isLocked && (
                <div className="flex items-center gap-1 mt-2 text-white/40">
                  <Lock className="w-4 h-4" />
                  <Star className="w-3 h-3 fill-current" />
                  <span className="text-xs font-medium">{scenario.unlockStars}</span>
                </div>
              )}

              {!isLocked && (
                <div className="flex items-center gap-1 mt-2 text-white/60">
                  <span className="text-xs">Tier {scenario.tier}</span>
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
