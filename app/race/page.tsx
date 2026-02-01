'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Loading component defined FIRST before dynamic import uses it
function RaceLoading() {
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-white/30 border-t-brand-red rounded-full animate-spin mb-4 mx-auto" />
        <p className="text-white text-2xl font-bold mb-2">Loading 3D Race</p>
        <p className="text-white/60 text-sm">Preparing your monster truck...</p>
      </div>
    </div>
  );
}

// Dynamically import 3D game to avoid SSR issues with Three.js
const RaceGame3D = dynamic(
  () => import('@/components/games3d/RaceGame3D').then((mod) => mod.RaceGame3D),
  {
    ssr: false,
    loading: () => <RaceLoading />,
  }
);

function RacePageContent() {
  const router = useRouter();

  const handleExit = () => {
    router.push('/');
  };

  return <RaceGame3D onExit={handleExit} />;
}

export default function RacePage() {
  return (
    <Suspense fallback={<RaceLoading />}>
      <RacePageContent />
    </Suspense>
  );
}
