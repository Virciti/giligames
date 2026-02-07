'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePlayerStore } from '@/lib/stores/player-store';
import { ProfileSelect } from '@/components/home/ProfileSelect';
import { Dashboard } from '@/components/home/Dashboard';

export default function Home() {
  const activeProfileId = usePlayerStore((s) => s.activeProfileId);
  const profiles = usePlayerStore((s) => s.profiles);
  const switchProfile = usePlayerStore((s) => s.switchProfile);
  const ensureProfiles = usePlayerStore((s) => s.ensureProfiles);

  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<'profile-select' | 'dashboard'>(
    'profile-select'
  );

  // Mark as mounted after hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Ensure hardcoded profiles exist (migration safety)
  useEffect(() => {
    if (mounted) {
      ensureProfiles();
    }
  }, [mounted, ensureProfiles]);

  // After hydration, if a valid profile is already active, go to dashboard
  useEffect(() => {
    if (mounted && profiles.some((p) => p.id === activeProfileId)) {
      setView('dashboard');
    }
  }, [mounted, activeProfileId, profiles]);

  const handleProfileSelect = (profileId: string) => {
    switchProfile(profileId);
    setView('dashboard');
  };

  const handleSwitchProfile = () => {
    setView('profile-select');
  };

  // Show nothing during SSR to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-slate-900 via-gray-950 to-black" />
    );
  }

  return (
    <AnimatePresence mode="wait">
      {view === 'profile-select' ? (
        <motion.div
          key="profile-select"
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
        >
          <ProfileSelect onSelect={handleProfileSelect} />
        </motion.div>
      ) : (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Dashboard onSwitchProfile={handleSwitchProfile} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
