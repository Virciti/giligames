'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, Trophy, Lock, Truck, Target, Zap, BookOpen, Award } from 'lucide-react';
import { usePlayerStore } from '@/lib/stores/player-store';
import { trucks, isTruckUnlocked } from '@/content/trucks';

// Achievement definitions
const achievementDefinitions = [
  {
    id: 'first-star',
    name: 'First Star',
    description: 'Earn your first star',
    icon: Star,
    requirement: 1,
    type: 'stars' as const,
  },
  {
    id: 'star-collector-10',
    name: 'Star Collector',
    description: 'Earn 10 stars',
    icon: Star,
    requirement: 10,
    type: 'stars' as const,
  },
  {
    id: 'star-collector-25',
    name: 'Star Hunter',
    description: 'Earn 25 stars',
    icon: Star,
    requirement: 25,
    type: 'stars' as const,
  },
  {
    id: 'star-collector-50',
    name: 'Star Champion',
    description: 'Earn 50 stars',
    icon: Trophy,
    requirement: 50,
    type: 'stars' as const,
  },
  {
    id: 'star-collector-100',
    name: 'Star Legend',
    description: 'Earn 100 stars',
    icon: Trophy,
    requirement: 100,
    type: 'stars' as const,
  },
  {
    id: 'first-truck',
    name: 'New Wheels',
    description: 'Unlock your first new truck',
    icon: Truck,
    requirement: 1,
    type: 'trucks' as const,
  },
  {
    id: 'truck-collector',
    name: 'Truck Collector',
    description: 'Unlock 3 trucks',
    icon: Truck,
    requirement: 3,
    type: 'trucks' as const,
  },
  {
    id: 'all-trucks',
    name: 'Full Garage',
    description: 'Unlock all trucks',
    icon: Truck,
    requirement: 6,
    type: 'trucks' as const,
  },
  {
    id: 'number-master',
    name: 'Number Master',
    description: 'Complete 10 number games',
    icon: Target,
    requirement: 10,
    type: 'games' as const,
  },
  {
    id: 'letter-master',
    name: 'Letter Legend',
    description: 'Complete 10 letter games',
    icon: BookOpen,
    requirement: 10,
    type: 'games' as const,
  },
  {
    id: 'math-whiz',
    name: 'Math Whiz',
    description: 'Complete 10 math games',
    icon: Zap,
    requirement: 10,
    type: 'games' as const,
  },
  {
    id: 'word-wizard',
    name: 'Word Wizard',
    description: 'Complete 10 word games',
    icon: Award,
    requirement: 10,
    type: 'games' as const,
  },
];

// Milestones for truck unlocks
const starMilestones = [
  { stars: 0, label: 'Start', color: '#4CAF50' },
  { stars: 10, label: '10 Stars', color: '#FF9800' },
  { stars: 25, label: '25 Stars', color: '#2196F3' },
  { stars: 50, label: '50 Stars', color: '#9C27B0' },
  { stars: 100, label: '100 Stars', color: '#F44336' },
  { stars: 200, label: '200 Stars', color: '#FFD700' },
];

export default function RewardsPage() {
  const totalStars = usePlayerStore((s) => s.totalStars);
  const unlockedTrucks = usePlayerStore((s) => s.unlockedTrucks);
  const achievements = usePlayerStore((s) => s.achievements);
  const totalPlayTime = usePlayerStore((s) => s.totalPlayTime);
  const currentStreak = usePlayerStore((s) => s.currentStreak);

  // Check if an achievement is earned
  const isAchievementEarned = (achievementId: string) => {
    return achievements.some((a) => a.id === achievementId);
  };

  // Check if achievement requirements are met
  const checkAchievementProgress = (achievement: typeof achievementDefinitions[0]) => {
    const type = achievement.type;
    if (type === 'stars') {
      return { current: totalStars, target: achievement.requirement };
    } else if (type === 'trucks') {
      return { current: unlockedTrucks.length, target: achievement.requirement };
    } else if (type === 'games') {
      // Simplified - would need to track game completions
      return { current: 0, target: achievement.requirement };
    }
    return { current: 0, target: 0 };
  };

  // Format play time
  const formatPlayTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Calculate milestone progress
  const currentMilestoneIndex = starMilestones.findIndex((m) => m.stars > totalStars);
  const nextMilestone = starMilestones[currentMilestoneIndex] || starMilestones[starMilestones.length - 1];
  const prevMilestone = starMilestones[Math.max(0, currentMilestoneIndex - 1)];
  const milestoneProgress =
    currentMilestoneIndex === -1
      ? 100
      : ((totalStars - prevMilestone.stars) / (nextMilestone.stars - prevMilestone.stars)) * 100;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/"
          className="p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
          aria-label="Back to garage"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </Link>

        <div className="text-center">
          <h1 className="text-3xl font-bold text-white drop-shadow-lg">
            Rewards & Trophies
          </h1>
          <p className="text-white/80 text-sm">Your amazing achievements!</p>
        </div>

        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
          <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
          <span className="text-lg font-bold text-white">{totalStars}</span>
        </div>
      </div>

      {/* Star Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-3xl p-6 mb-6 shadow-xl"
      >
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Star className="w-6 h-6 fill-white" />
          Star Progress
        </h2>

        {/* Progress bar with milestones */}
        <div className="relative mb-4">
          <div className="h-4 bg-white/30 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (totalStars / 200) * 100)}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-white rounded-full"
            />
          </div>

          {/* Milestone markers */}
          <div className="flex justify-between mt-2">
            {starMilestones.map((milestone) => (
              <div
                key={milestone.stars}
                className={`text-center ${
                  totalStars >= milestone.stars ? 'text-white' : 'text-white/50'
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                    totalStars >= milestone.stars ? 'bg-white' : 'bg-white/30'
                  }`}
                />
                <span className="text-xs">{milestone.stars}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/90 text-center">
          {currentMilestoneIndex === -1
            ? 'All milestones reached! Amazing!'
            : `${nextMilestone.stars - totalStars} more stars to ${nextMilestone.label}`}
        </p>
      </motion.div>

      {/* Truck Collection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-brand-blue to-cyan-700 rounded-3xl p-6 mb-6 shadow-xl"
      >
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Truck className="w-6 h-6" />
          Truck Collection ({unlockedTrucks.length}/{trucks.length})
        </h2>

        <div className="grid grid-cols-3 gap-3">
          {trucks.map((truck, index) => {
            const unlocked = isTruckUnlocked(truck, totalStars);

            return (
              <motion.div
                key={truck.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`
                  relative p-3 rounded-xl text-center
                  ${unlocked ? 'bg-white/25' : 'bg-black/30'}
                `}
              >
                {!unlocked && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-xl z-10">
                    <Lock className="w-6 h-6 text-white/80" />
                    <span className="text-xs text-white/80 mt-1">
                      {truck.unlockRequirement.value} Stars
                    </span>
                  </div>
                )}

                <div
                  className="w-12 h-12 mx-auto rounded-lg flex items-center justify-center mb-2"
                  style={{ backgroundColor: unlocked ? truck.color : '#666' }}
                >
                  <Truck className="w-8 h-8 text-white" />
                </div>
                <span className="text-xs font-bold text-white">{truck.name}</span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Achievements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-brand-purple to-purple-800 rounded-3xl p-6 mb-6 shadow-xl"
      >
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-400" />
          Achievements ({achievements.length}/{achievementDefinitions.length})
        </h2>

        <div className="grid grid-cols-2 gap-3">
          {achievementDefinitions.map((achievement, index) => {
            const earned = isAchievementEarned(achievement.id);
            const progress = checkAchievementProgress(achievement);
            const Icon = achievement.icon;

            return (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
                className={`
                  relative p-3 rounded-xl
                  ${earned ? 'bg-yellow-500/30 ring-2 ring-yellow-400' : 'bg-white/10'}
                `}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`
                      w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                      ${earned ? 'bg-yellow-400' : 'bg-white/20'}
                    `}
                  >
                    <Icon
                      className={`w-6 h-6 ${earned ? 'text-yellow-900' : 'text-white/60'}`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-bold text-sm truncate ${
                        earned ? 'text-yellow-300' : 'text-white/70'
                      }`}
                    >
                      {achievement.name}
                    </p>
                    <p className="text-xs text-white/50 truncate">
                      {achievement.description}
                    </p>
                    {!earned && (
                      <div className="mt-1">
                        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-white/50 rounded-full"
                            style={{
                              width: `${Math.min(100, (progress.current / progress.target) * 100)}%`,
                            }}
                          />
                        </div>
                        <p className="text-xs text-white/40 mt-0.5">
                          {progress.current}/{progress.target}
                        </p>
                      </div>
                    )}
                  </div>

                  {earned && (
                    <div className="text-yellow-400">
                      <Trophy className="w-5 h-5 fill-yellow-400" />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Stats Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white/10 backdrop-blur-sm rounded-2xl p-4"
      >
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-3xl font-bold text-yellow-400">{totalStars}</p>
            <p className="text-white/60 text-sm">Total Stars</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white">{formatPlayTime(totalPlayTime)}</p>
            <p className="text-white/60 text-sm">Play Time</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-brand-green">{currentStreak}</p>
            <p className="text-white/60 text-sm">Day Streak</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
