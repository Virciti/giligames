'use client';

import { motion } from 'framer-motion';
import { DashboardTile } from './DashboardTile';
import { useActiveProfile, usePlayerStore } from '@/lib/stores/player-store';

const DASHBOARD_TILES = [
  {
    href: '/stadium',
    icon: '🏟️',
    label: 'Stadium',
    gradientClass: 'bg-gradient-to-br from-yellow-400 to-orange-500',
  },
  {
    href: '/race',
    icon: '🏁',
    label: 'Race',
    gradientClass: 'bg-gradient-to-br from-green-400 to-green-700',
  },
  {
    href: '/learn',
    icon: '📚',
    label: 'Learn',
    gradientClass: 'bg-gradient-to-br from-purple-500 to-purple-800',
  },
  {
    href: '/fashion',
    icon: '👗',
    label: 'Fashion',
    gradientClass: 'bg-gradient-to-br from-pink-400 to-purple-600',
  },
  {
    href: '/rewards',
    icon: '🏆',
    label: 'Rewards',
    gradientClass: 'bg-gradient-to-br from-yellow-500 to-orange-600',
  },
  {
    href: '/settings',
    icon: '⚙️',
    label: 'Settings',
    gradientClass: 'bg-gradient-to-br from-gray-500 to-gray-700',
  },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

interface DashboardProps {
  onSwitchProfile: () => void;
}

export function Dashboard({ onSwitchProfile }: DashboardProps) {
  const activeProfile = useActiveProfile();
  const totalStars = usePlayerStore((s) => s.totalStars);
  const greeting = getGreeting();

  return (
    <div
      className="fixed inset-0 overflow-auto"
      style={{
        background: `linear-gradient(to bottom,
          #0f0f1a 0%,
          #1a1a2e 30%,
          #2d1b4e 48%,
          #4a2c5e 52%,
          #1a1a2e 60%,
          #0f0f1a 100%
        )`,
      }}
    >
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
        {/* Star counter badge - top right */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="absolute top-6 right-6 flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5"
        >
          <span className="text-yellow-400">★</span>
          <span className="text-white/80 text-sm font-medium">
            {totalStars}
          </span>
        </motion.div>

        {/* Profile switch button - top left */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          onClick={onSwitchProfile}
          className="absolute top-6 left-6 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 text-white/60 text-sm hover:bg-white/20 transition-colors"
        >
          Switch
        </motion.button>

        {/* Greeting */}
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl sm:text-4xl font-bold text-white mb-12 text-center"
        >
          {greeting}, {activeProfile?.name ?? 'Player'}.
        </motion.h1>

        {/* App Icon Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-10 max-w-md sm:max-w-lg mx-auto">
          {DASHBOARD_TILES.map((tile, i) => (
            <DashboardTile
              key={tile.href}
              href={tile.href}
              icon={tile.icon}
              label={tile.label}
              gradientClass={tile.gradientClass}
              delay={0.15 + i * 0.06}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
