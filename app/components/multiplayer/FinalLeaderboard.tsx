"use client";

import { PlayerDoc } from "@/types/game";

interface FinalLeaderboardProps {
  players: PlayerDoc[];
  onExit: () => void;
}

const MEDALS = ["🥇", "🥈", "🥉"];

export default function FinalLeaderboard({ players, onExit }: FinalLeaderboardProps) {
  const ranked = [...players].sort((a, b) => b.totalScore - a.totalScore);

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🏆</div>
          <h1 className="text-3xl font-black text-white mb-1">Final Results</h1>
          <p className="text-gray-500 text-sm">Game over — great playing!</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6">
          <div className="space-y-3">
            {ranked.map((p, i) => (
              <div
                key={p.playerId}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
                  i === 0 ? "bg-yellow-950/30 border border-yellow-900/50" : "bg-gray-950/50"
                }`}
              >
                <span className="text-2xl w-8 text-center">
                  {MEDALS[i] ?? `${i + 1}.`}
                </span>
                <span className="text-gray-200 font-semibold flex-1">{p.displayName}</span>
                <span className="text-white font-black">{p.totalScore.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onExit}
          className="w-full py-4 rounded-2xl bg-green-600 hover:bg-green-500 active:scale-95 text-white font-black text-lg transition-all shadow-xl shadow-green-900/40"
        >
          Back to Home →
        </button>
      </div>
    </main>
  );
}