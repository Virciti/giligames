'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

interface DashboardTileProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  gradientClass: string;
  delay?: number;
}

export function DashboardTile({
  href,
  icon,
  label,
  gradientClass,
  delay = 0,
}: DashboardTileProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: 'spring', stiffness: 200, damping: 20 }}
    >
      <Link href={href} className="flex flex-col items-center gap-2 group">
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className={`w-20 h-20 sm:w-24 sm:h-24 rounded-[22px] ${gradientClass} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow`}
        >
          <span className="text-3xl sm:text-4xl">{icon}</span>
        </motion.div>
        <span className="text-white/90 text-sm font-medium">{label}</span>
      </Link>
    </motion.div>
  );
}
