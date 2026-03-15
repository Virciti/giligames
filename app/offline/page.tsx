'use client';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md mx-auto text-center px-6">
        <div className="text-6xl mb-6">🏗️</div>
        <h1 className="text-3xl font-bold text-white mb-4">
          You&apos;re Offline!
        </h1>
        <p className="text-white/80 text-lg mb-8">
          It looks like you lost your internet connection. Don&apos;t worry — reconnect and your games will be right where you left them!
        </p>
        <button
          onClick={() => typeof window !== 'undefined' && window.location.reload()}
          className="bg-white text-purple-600 font-bold py-3 px-8 rounded-2xl text-lg hover:bg-white/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
