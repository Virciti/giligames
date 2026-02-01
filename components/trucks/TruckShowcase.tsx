'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Truck } from 'lucide-react';
import { getTruckById } from '@/content/trucks';
import { usePlayerStore } from '@/lib/stores/player-store';

interface TruckShowcaseProps {
  truckId?: string;
  showStats?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

function StatBar({
  label,
  value,
  maxValue = 5,
  color,
}: {
  label: string;
  value: number;
  maxValue?: number;
  color: string;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-white/70 w-20 text-right">{label}</span>
      <div className="flex-1 flex gap-1">
        {Array.from({ length: maxValue }).map((_, i) => (
          <motion.div
            key={i}
            initial={shouldReduceMotion ? {} : { scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className={`
              h-4 flex-1 rounded-full
              ${i < value ? '' : 'bg-white/20'}
            `}
            style={{ backgroundColor: i < value ? color : undefined }}
          />
        ))}
      </div>
    </div>
  );
}

const sizeConfig = {
  sm: { container: 'w-32 h-32', icon: 'w-20 h-20' },
  md: { container: 'w-48 h-48', icon: 'w-28 h-28' },
  lg: { container: 'w-64 h-64', icon: 'w-40 h-40' },
};

export function TruckShowcase({
  truckId,
  showStats = true,
  size = 'lg',
}: TruckShowcaseProps) {
  const selectedTruck = usePlayerStore((s) => s.selectedTruck);
  const shouldReduceMotion = useReducedMotion();

  const truck = getTruckById(truckId || selectedTruck);
  if (!truck) return null;

  const config = sizeConfig[size];

  return (
    <div className="flex flex-col items-center">
      {/* Truck Display */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className={`
          ${config.container}
          rounded-3xl
          flex items-center justify-center
          shadow-2xl
          relative overflow-hidden
        `}
        style={{ backgroundColor: truck.color }}
      >
        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none" />

        {/* Idle bounce animation */}
        <motion.div
          animate={shouldReduceMotion ? {} : {
            y: [0, -8, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Truck
            className={`${config.icon} text-white drop-shadow-lg`}
            strokeWidth={1.5}
          />
        </motion.div>

        {/* Exhaust puffs animation */}
        {!shouldReduceMotion && (
          <div className="absolute bottom-4 left-4">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, opacity: 0.6, x: 0, y: 0 }}
                animate={{
                  scale: [0, 1, 1.5],
                  opacity: [0.6, 0.4, 0],
                  x: [-5 - i * 5],
                  y: [-10 - i * 10],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.4,
                  ease: 'easeOut',
                }}
                className="absolute w-4 h-4 bg-white/40 rounded-full"
              />
            ))}
          </div>
        )}

        {/* Wheel dots */}
        <div className="absolute bottom-3 left-1/4 w-4 h-4 bg-gray-800 rounded-full border-2 border-gray-600" />
        <div className="absolute bottom-3 right-1/4 w-4 h-4 bg-gray-800 rounded-full border-2 border-gray-600" />
      </motion.div>

      {/* Name and tagline */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center mt-4"
      >
        <h2 className="text-2xl font-bold text-white">{truck.name}</h2>
        <p className="text-white/70">{truck.tagline}</p>
      </motion.div>

      {/* Stats */}
      {showStats && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-xs mt-4 space-y-2 bg-white/10 backdrop-blur-sm p-4 rounded-2xl"
        >
          <StatBar
            label="Speed"
            value={truck.stats.speed}
            color={truck.color}
          />
          <StatBar
            label="Jump"
            value={truck.stats.jump}
            color={truck.color}
          />
          <StatBar
            label="Handling"
            value={truck.stats.handling}
            color={truck.color}
          />
        </motion.div>
      )}
    </div>
  );
}

export default TruckShowcase;
