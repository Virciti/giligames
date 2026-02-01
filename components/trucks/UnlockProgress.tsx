'use client';

import { motion } from 'framer-motion';
import { Lock, Star } from 'lucide-react';
import { getNextUnlockableTruck, getUnlockProgress } from '@/content/trucks';
import { usePlayerStore } from '@/lib/stores/player-store';

export function UnlockProgress() {
  const totalStars = usePlayerStore((s) => s.totalStars);
  const nextTruck = getNextUnlockableTruck(totalStars);

  if (!nextTruck) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
        <p className="text-white font-bold">All trucks unlocked!</p>
        <p className="text-white/60 text-sm">You&apos;re a true champion!</p>
      </div>
    );
  }

  const progress = getUnlockProgress(nextTruck, totalStars);
  const starsNeeded = (nextTruck.unlockRequirement.value ?? 0) - totalStars;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/10 backdrop-blur-sm rounded-2xl p-4"
    >
      <div className="flex items-center gap-4">
        {/* Mini truck preview */}
        <div
          className="w-16 h-16 rounded-xl flex items-center justify-center relative"
          style={{ backgroundColor: nextTruck.color + '60' }}
        >
          <Lock className="w-8 h-8 text-white/80" />
        </div>

        {/* Progress info */}
        <div className="flex-1">
          <p className="text-white font-bold">{nextTruck.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-white/80 text-sm">
              {starsNeeded} more stars to unlock
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-2 h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ backgroundColor: nextTruck.color }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default UnlockProgress;
