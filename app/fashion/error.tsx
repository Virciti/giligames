'use client';

import { GameErrorFallback } from '@/components/ui/GameErrorFallback';

export default function FashionError({
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
      gameName="Fashion Studio"
      gradientFrom="from-pink-900"
      gradientTo="to-purple-900"
      accentColor="border-t-pink-400"
    />
  );
}
