'use client';

import { GameErrorFallback } from '@/components/ui/GameErrorFallback';

export default function SettingsError({
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
      gameName="Settings"
      gradientFrom="from-gray-800"
      gradientTo="to-gray-900"
      accentColor="border-t-gray-400"
    />
  );
}
