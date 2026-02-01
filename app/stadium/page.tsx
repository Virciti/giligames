'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Loading component
function StadiumLoading() {
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-white/30 border-t-brand-yellow rounded-full animate-spin mb-4 mx-auto" />
        <p className="text-white text-2xl font-bold mb-2">Loading Stadium</p>
        <p className="text-white/60 text-sm">Preparing the arena...</p>
      </div>
    </div>
  );
}

// Dynamically import 3D game
const StadiumGame3D = dynamic(
  () => import('@/components/games3d/StadiumGame3D').then((mod) => mod.StadiumGame3D),
  {
    ssr: false,
    loading: () => <StadiumLoading />,
  }
);

function StadiumPageContent() {
  const router = useRouter();

  const handleExit = () => {
    router.push('/');
  };

  return <StadiumGame3D onExit={handleExit} />;
}

export default function StadiumPage() {
  return (
    <Suspense fallback={<StadiumLoading />}>
      <StadiumPageContent />
    </Suspense>
  );
}
