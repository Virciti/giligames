'use client';

import { GameErrorFallback } from '@/components/ui/GameErrorFallback';

export default function RaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <GameErrorFallback
      error={error}
      reset={reset}
      gameName="3D Race"
      gradientFrom="from-gray-900"
      gradientTo="to-gray-800"
      accentColor="border-t-red-500"
    />
  );
}
