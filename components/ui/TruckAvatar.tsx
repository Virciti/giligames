'use client';

import { motion } from 'framer-motion';
import { Truck } from 'lucide-react';

interface TruckAvatarProps {
  truckId: string;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  showStats?: boolean;
}

// Truck data - in a real app this would come from a data store
const TRUCK_DATA: Record<
  string,
  {
    name: string;
    color: string;
    bgColor: string;
    stats: { speed: number; jump: number; handling: number };
  }
> = {
  'red-rocket': {
    name: 'Red Rocket',
    color: '#FF6B6B',
    bgColor: 'bg-brand-red',
    stats: { speed: 4, jump: 3, handling: 5 },
  },
  'blue-thunder': {
    name: 'Blue Thunder',
    color: '#4ECDC4',
    bgColor: 'bg-brand-blue',
    stats: { speed: 5, jump: 4, handling: 3 },
  },
  'green-machine': {
    name: 'Green Machine',
    color: '#7BC74D',
    bgColor: 'bg-brand-green',
    stats: { speed: 3, jump: 5, handling: 4 },
  },
  'purple-beast': {
    name: 'Purple Beast',
    color: '#9B5DE5',
    bgColor: 'bg-brand-purple',
    stats: { speed: 4, jump: 4, handling: 4 },
  },
  'orange-crusher': {
    name: 'Orange Crusher',
    color: '#FF9F43',
    bgColor: 'bg-brand-orange',
    stats: { speed: 5, jump: 5, handling: 2 },
  },
  'yellow-lightning': {
    name: 'Yellow Lightning',
    color: '#FFE66D',
    bgColor: 'bg-brand-yellow',
    stats: { speed: 5, jump: 2, handling: 5 },
  },
};

const DEFAULT_TRUCK = {
  name: 'Mystery Truck',
  color: '#888888',
  bgColor: 'bg-gray-400',
  stats: { speed: 3, jump: 3, handling: 3 },
};

const sizeConfig = {
  sm: {
    container: 'w-16 h-16',
    icon: 'w-8 h-8',
    name: 'text-xs',
    statBar: 'h-1',
  },
  md: {
    container: 'w-24 h-24',
    icon: 'w-12 h-12',
    name: 'text-sm',
    statBar: 'h-1.5',
  },
  lg: {
    container: 'w-32 h-32',
    icon: 'w-16 h-16',
    name: 'text-base',
    statBar: 'h-2',
  },
};

// Stat bar component
function StatBar({
  label,
  value,
  maxValue = 5,
  color,
  barHeight,
}: {
  label: string;
  value: number;
  maxValue?: number;
  color: string;
  barHeight: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 w-16 text-right">{label}</span>
      <div className={`flex-1 bg-gray-200 rounded-full ${barHeight} overflow-hidden`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(value / maxValue) * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`${barHeight} rounded-full`}
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export function TruckAvatar({
  truckId,
  size = 'md',
  showName = false,
  showStats = false,
}: TruckAvatarProps) {
  const truck = TRUCK_DATA[truckId] || DEFAULT_TRUCK;
  const config = sizeConfig[size];

  return (
    <div className="flex flex-col items-center">
      {/* Truck Avatar */}
      <motion.div
        whileHover={{ scale: 1.05, rotate: 2 }}
        whileTap={{ scale: 0.95 }}
        className={`
          ${config.container} ${truck.bgColor}
          rounded-2xl flex items-center justify-center
          shadow-lg cursor-pointer
          relative overflow-hidden
        `}
      >
        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none" />

        {/* Truck icon placeholder - in production this would be an actual truck image */}
        <Truck
          className={`${config.icon} text-white drop-shadow-md`}
          strokeWidth={2}
        />

        {/* Wheel dots */}
        <div className="absolute bottom-1 left-2 w-2 h-2 bg-gray-800 rounded-full" />
        <div className="absolute bottom-1 right-2 w-2 h-2 bg-gray-800 rounded-full" />
      </motion.div>

      {/* Name plate */}
      {showName && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`
            ${config.name} font-bold text-gray-900 mt-2
            bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full
            shadow-sm
          `}
        >
          {truck.name}
        </motion.div>
      )}

      {/* Stats */}
      {showStats && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-48 mt-3 space-y-2 bg-white/60 backdrop-blur-sm p-3 rounded-xl"
        >
          <StatBar
            label="Speed"
            value={truck.stats.speed}
            color={truck.color}
            barHeight={config.statBar}
          />
          <StatBar
            label="Jump"
            value={truck.stats.jump}
            color={truck.color}
            barHeight={config.statBar}
          />
          <StatBar
            label="Handling"
            value={truck.stats.handling}
            color={truck.color}
            barHeight={config.statBar}
          />
        </motion.div>
      )}
    </div>
  );
}

// Export truck IDs for easy access
export const TRUCK_IDS = Object.keys(TRUCK_DATA);
