'use client';

import { GameErrorFallback } from '@/components/ui/GameErrorFallback';

export default function LearnError({
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
      gameName="Learning Zone"
      gradientFrom="from-sky-900"
      gradientTo="to-blue-900"
      accentColor="border-t-sky-400"
    />
  );
}
