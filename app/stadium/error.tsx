'use client';

import { GameErrorFallback } from '@/components/ui/GameErrorFallback';

export default function StadiumError({
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
      gameName="Stadium"
      gradientFrom="from-gray-900"
      gradientTo="to-gray-800"
      accentColor="border-t-yellow-500"
    />
  );
}
