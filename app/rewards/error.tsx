'use client';

import { GameErrorFallback } from '@/components/ui/GameErrorFallback';

export default function RewardsError({
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
      gameName="Rewards"
      gradientFrom="from-amber-800"
      gradientTo="to-yellow-900"
      accentColor="border-t-yellow-400"
    />
  );
}
