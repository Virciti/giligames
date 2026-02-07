'use client';

import { Suspense, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

function FashionLoading() {
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-pink-400 via-purple-400 to-brand-purple flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-white/30 border-t-pink-200 rounded-full animate-spin mb-4 mx-auto" />
        <p className="text-white text-2xl font-bold mb-2">Fashion Studio</p>
        <p className="text-white/60 text-sm">Preparing your outfits...</p>
      </div>
    </div>
  );
}

const FashionDesignGame = dynamic(
  () => import('@/components/fashion/FashionDesignGame').then((mod) => mod.FashionDesignGame),
  {
    ssr: false,
    loading: () => <FashionLoading />,
  }
);

function FashionPageContent() {
  const router = useRouter();

  const handleExit = useCallback(() => {
    router.push('/');
  }, [router]);

  return <FashionDesignGame onExit={handleExit} />;
}

export default function FashionPage() {
  return (
    <Suspense fallback={<FashionLoading />}>
      <FashionPageContent />
    </Suspense>
  );
}
