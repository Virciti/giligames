'use client';

import { useRouter } from 'next/navigation';

interface GameErrorFallbackProps {
  error: Error & { digest?: string };
  reset: () => void;
  gameName?: string;
  gradientFrom?: string;
  gradientTo?: string;
  accentColor?: string;
}

export function GameErrorFallback({
  error,
  reset,
  gameName = 'Game',
  gradientFrom = 'from-gray-900',
  gradientTo = 'to-gray-800',
  accentColor = 'border-t-white',
}: GameErrorFallbackProps) {
  const router = useRouter();

  return (
    <div
      className={`fixed inset-0 bg-gradient-to-b ${gradientFrom} ${gradientTo} flex items-center justify-center p-6`}
    >
      <div className="text-center max-w-md">
        <div
          className={`w-20 h-20 border-4 border-white/20 ${accentColor} rounded-full mx-auto mb-6 flex items-center justify-center`}
        >
          <span className="text-3xl">⚠️</span>
        </div>

        <h2 className="text-white text-2xl font-bold mb-2">
          Oops! Something went wrong
        </h2>
        <p className="text-white/70 text-sm mb-6">
          {gameName} ran into a problem. Don&apos;t worry — your progress is safe!
        </p>

        {process.env.NODE_ENV === 'development' && (
          <details className="mb-6 text-left bg-black/30 rounded-xl p-4">
            <summary className="text-white/60 text-xs cursor-pointer">
              Error details
            </summary>
            <pre className="text-red-300 text-xs mt-2 whitespace-pre-wrap break-words">
              {error.message}
            </pre>
          </details>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="w-full py-4 bg-white/20 hover:bg-white/30 text-white text-lg font-bold rounded-2xl transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => router.push('/')}
            className="w-full py-3 bg-white/10 hover:bg-white/20 text-white/80 text-sm font-medium rounded-2xl transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
