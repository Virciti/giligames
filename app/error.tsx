'use client';

import { GameErrorFallback } from '@/components/ui/GameErrorFallback';

export default function RootError({
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
      gameName="GiiGames"
      gradientFrom="from-sky-800"
      gradientTo="to-sky-900"
      accentColor="border-t-white"
    />
  );
}
