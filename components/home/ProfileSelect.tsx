'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

interface ProfileCardProps {
  name: string;
  imageSrc: string;
  onClick: () => void;
  delay?: number;
}

function ProfileCard({ name, imageSrc, onClick, delay = 0 }: ProfileCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 150, damping: 20 }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="relative overflow-hidden rounded-3xl w-full aspect-[4/3] max-w-sm bg-white/5 border-2 border-white/10 hover:border-white/30 transition-colors cursor-pointer group"
    >
      <Image
        src={imageSrc}
        alt={name}
        fill
        className="object-cover group-hover:scale-105 transition-transform duration-500"
        sizes="(max-width: 768px) 80vw, 400px"
        priority
      />
      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      {/* Name overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <h2 className="text-3xl sm:text-4xl font-bold text-white drop-shadow-lg">
          {name}
        </h2>
      </div>
    </motion.button>
  );
}

interface ProfileSelectProps {
  onSelect: (profileId: string) => void;
}

export function ProfileSelect({ onSelect }: ProfileSelectProps) {
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-slate-900 via-gray-950 to-black flex items-center justify-center px-6">
      <div className="w-full max-w-4xl">
        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-white/60 text-lg font-medium mb-8 tracking-wide"
        >
          Who&apos;s playing?
        </motion.h1>

        {/* Profile Cards */}
        <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 justify-center items-center">
          <ProfileCard
            name="Liam"
            imageSrc="/images/liam-cybertruck.jpg"
            onClick={() => onSelect('profile-liam')}
            delay={0.1}
          />
          <ProfileCard
            name="Gianna"
            imageSrc="/images/gianna-girls.jpg"
            onClick={() => onSelect('profile-gianna')}
            delay={0.2}
          />
        </div>
      </div>
    </div>
  );
}
