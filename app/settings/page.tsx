import Link from "next/link";

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white drop-shadow-lg mb-2">
          Settings
        </h1>
      </div>

      <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-6 mb-8">
        {/* Sound Settings */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Sound</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center bg-white/10 rounded-xl p-4">
              <span className="text-white">Sound Effects</span>
              <div className="w-12 h-7 bg-brand-green rounded-full relative">
                <div className="absolute right-1 top-1 w-5 h-5 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="flex justify-between items-center bg-white/10 rounded-xl p-4">
              <span className="text-white">Music</span>
              <div className="w-12 h-7 bg-brand-green rounded-full relative">
                <div className="absolute right-1 top-1 w-5 h-5 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="flex justify-between items-center bg-white/10 rounded-xl p-4">
              <span className="text-white">Voice Prompts</span>
              <div className="w-12 h-7 bg-brand-green rounded-full relative">
                <div className="absolute right-1 top-1 w-5 h-5 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Control Settings */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Controls</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center bg-white/10 rounded-xl p-4">
              <span className="text-white">Control Layout</span>
              <span className="text-white/70">Right</span>
            </div>
            <div className="flex justify-between items-center bg-white/10 rounded-xl p-4">
              <span className="text-white">Auto-Accelerate</span>
              <div className="w-12 h-7 bg-gray-500 rounded-full relative">
                <div className="absolute left-1 top-1 w-5 h-5 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="flex justify-between items-center bg-white/10 rounded-xl p-4">
              <span className="text-white">Assist Mode</span>
              <div className="w-12 h-7 bg-gray-500 rounded-full relative">
                <div className="absolute left-1 top-1 w-5 h-5 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Accessibility */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Accessibility</h2>
          <div className="flex justify-between items-center bg-white/10 rounded-xl p-4">
            <span className="text-white">Reduced Motion</span>
            <div className="w-12 h-7 bg-gray-500 rounded-full relative">
              <div className="absolute left-1 top-1 w-5 h-5 bg-white rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Parent Area */}
        <div>
          <Link
            href="/parent"
            className="block bg-brand-purple text-white rounded-xl p-4 text-center font-bold"
          >
            Parent Dashboard
          </Link>
          <p className="text-center text-white/50 text-sm mt-2">
            Requires parent verification
          </p>
        </div>
      </div>

      {/* Development Notice */}
      <div className="p-4 bg-white/10 rounded-xl text-center text-white/70 text-sm mb-8">
        <p>Settings functionality coming from WS-2 (Phase 2)</p>
      </div>

      <div className="text-center">
        <Link
          href="/"
          className="inline-block bg-brand-orange text-white rounded-2xl px-8 py-4 font-bold text-xl shadow-lg hover:scale-105 transition-transform"
        >
          Back to Garage
        </Link>
      </div>
    </div>
  );
}
