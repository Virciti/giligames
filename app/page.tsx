'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Star, Trophy, Settings } from 'lucide-react';
import { TruckShowcase, TruckCarousel, UnlockProgress } from '@/components/trucks';
import { usePlayerStore, useActiveProfile } from '@/lib/stores/player-store';

export default function Home() {
  const totalStars = usePlayerStore((s) => s.totalStars);
  const activeProfile = useActiveProfile();
  const playerName = activeProfile?.name;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header with Stars and Settings */}
      <div className="flex justify-between items-center mb-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2"
        >
          <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
          <span className="text-xl font-bold text-white">{totalStars}</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold text-white drop-shadow-lg">
            GiiGames
          </h1>
          {playerName && (
            <p className="text-white/80 text-sm">Welcome, {playerName}!</p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Link
            href="/settings"
            className="p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors block"
            aria-label="Settings"
          >
            <Settings className="w-6 h-6 text-white" />
          </Link>
        </motion.div>
      </div>

      {/* Truck Showcase */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <TruckShowcase size="lg" showStats={true} />
      </motion.div>

      {/* Truck Carousel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <TruckCarousel />
      </motion.div>

      {/* Unlock Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-8"
      >
        <UnlockProgress />
      </motion.div>

      {/* Game Mode Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
      >
        <Link
          href="/stadium"
          className="group bg-gradient-to-br from-brand-yellow to-yellow-600 text-gray-900 rounded-2xl p-6 text-center font-bold text-xl shadow-lg hover:scale-105 transition-transform min-h-[120px] flex flex-col items-center justify-center"
        >
          <motion.span
            className="text-4xl mb-2 block"
            whileHover={{ scale: 1.2, rotate: 10 }}
          >
            🏟️
          </motion.span>
          Stadium
          <span className="text-sm font-normal text-gray-700 mt-1">
            Freestyle Stunts
          </span>
        </Link>

        <Link
          href="/race"
          className="group bg-gradient-to-br from-brand-green to-green-700 text-white rounded-2xl p-6 text-center font-bold text-xl shadow-lg hover:scale-105 transition-transform min-h-[120px] flex flex-col items-center justify-center"
        >
          <motion.span
            className="text-4xl mb-2 block"
            whileHover={{ scale: 1.2, rotate: -10 }}
          >
            🏁
          </motion.span>
          Race
          <span className="text-sm font-normal text-white/80 mt-1">
            Compete & Win
          </span>
        </Link>

        <Link
          href="/learn"
          className="group bg-gradient-to-br from-brand-purple to-purple-800 text-white rounded-2xl p-6 text-center font-bold text-xl shadow-lg hover:scale-105 transition-transform min-h-[120px] flex flex-col items-center justify-center"
        >
          <motion.span
            className="text-4xl mb-2 block"
            whileHover={{ scale: 1.2, rotate: 10 }}
          >
            📚
          </motion.span>
          Learn
          <span className="text-sm font-normal text-white/80 mt-1">
            Fun Learning Games
          </span>
        </Link>
      </motion.div>

      {/* Achievements Quick View */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Link
          href="/rewards"
          className="flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-2xl p-4 hover:bg-white/20 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-400" />
            <div>
              <p className="text-white font-bold">Rewards & Trophies</p>
              <p className="text-white/60 text-sm">See your achievements</p>
            </div>
          </div>
          <div className="text-white/60">→</div>
        </Link>
      </motion.div>
    </div>
  );
}
