'use client';

import { GameErrorFallback } from '@/components/ui/GameErrorFallback';

export default function ParentError({
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
      gameName="Parent Dashboard"
      gradientFrom="from-slate-800"
      gradientTo="to-slate-900"
      accentColor="border-t-blue-400"
    />
  );
}
