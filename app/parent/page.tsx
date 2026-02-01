import Link from "next/link";

export default function ParentPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white drop-shadow-lg mb-2">
          Parent Dashboard
        </h1>
        <p className="text-white/70">Monitor your child&apos;s learning progress</p>
      </div>

      {/* Parent Gate Placeholder */}
      <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-8 mb-8 text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold text-white mb-4">Parent Verification</h2>
        <p className="text-white/70 mb-6">
          To access the parent dashboard, please complete one of the following:
        </p>

        <div className="space-y-4">
          {/* Hold Button Method */}
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-white font-bold mb-2">Option 1: Hold Button</p>
            <button className="bg-brand-blue text-white px-8 py-4 rounded-xl font-bold text-lg">
              Hold for 3 seconds
            </button>
          </div>

          <div className="text-white/50">OR</div>

          {/* Math Problem Method */}
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-white font-bold mb-2">Option 2: Solve</p>
            <p className="text-2xl text-white mb-3">7 + 3 = ?</p>
            <input
              type="number"
              className="bg-white/20 text-white text-center text-2xl w-24 p-2 rounded-xl"
              placeholder="?"
            />
          </div>
        </div>
      </div>

      {/* Dashboard Preview (would show after gate) */}
      <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 mb-8 opacity-50">
        <h3 className="text-xl font-bold text-white mb-4">Learning Progress</h3>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/10 rounded-xl p-4">
            <div className="text-sm text-white/70">Letters Mastery</div>
            <div className="text-2xl font-bold text-white">0/26</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <div className="text-sm text-white/70">Numbers Mastery</div>
            <div className="text-2xl font-bold text-white">0/20</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <div className="text-sm text-white/70">Total Play Time</div>
            <div className="text-2xl font-bold text-white">0 min</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <div className="text-sm text-white/70">Current Streak</div>
            <div className="text-2xl font-bold text-white">0 days</div>
          </div>
        </div>

        <h3 className="text-xl font-bold text-white mb-4">Needs Practice</h3>
        <div className="bg-white/10 rounded-xl p-4 text-white/70 text-center">
          No data yet - start learning to see recommendations!
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-4 mb-8">
        <button className="w-full bg-white/20 text-white rounded-xl p-4 font-bold">
          Manage Profiles
        </button>
        <button className="w-full bg-white/20 text-white rounded-xl p-4 font-bold">
          Export Progress Data
        </button>
        <button className="w-full bg-brand-red/50 text-white rounded-xl p-4 font-bold">
          Reset All Progress
        </button>
      </div>

      {/* Privacy Notice */}
      <div className="bg-brand-green/30 rounded-xl p-4 text-center text-white/80 text-sm mb-8">
        <p className="font-bold mb-1">Privacy First</p>
        <p>No accounts, no tracking, no data leaves your device.</p>
        <p>All progress is stored locally only.</p>
      </div>

      {/* Development Notice */}
      <div className="p-4 bg-white/10 rounded-xl text-center text-white/70 text-sm mb-8">
        <p>Parent dashboard coming from WS-5 (Phase 9)</p>
      </div>

      <div className="text-center">
        <Link
          href="/settings"
          className="inline-block bg-brand-orange text-white rounded-2xl px-8 py-4 font-bold text-xl shadow-lg hover:scale-105 transition-transform"
        >
          Back to Settings
        </Link>
      </div>
    </div>
  );
}
