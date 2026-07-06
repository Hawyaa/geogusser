"use client";

import { useState } from "react";
import { createRoom, getSavedDisplayName } from "@/lib/room";

interface CreateRoomScreenProps {
  onRoomCreated: (roomId: string, playerId: string) => void;
  onBack: () => void;
}

const ROUND_OPTIONS = [3, 5, 8, 10];
const DURATION_OPTIONS = [30, 60, 90, 120];

export default function CreateRoomScreen({ onRoomCreated, onBack }: CreateRoomScreenProps) {
  const [name, setName] = useState(getSavedDisplayName());
  const [totalRounds, setTotalRounds] = useState(5);
  const [roundDurationSeconds, setRoundDurationSeconds] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!name.trim()) {
      setError("Enter a display name first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { roomId, playerId } = await createRoom({
        hostDisplayName: name.trim(),
        totalRounds,
        roundDurationSeconds,
      });
      onRoomCreated(roomId, playerId);
    } catch (err) {
      console.error("[CreateRoomScreen] createRoom failed", err);
      setError(err instanceof Error ? err.message : "Could not create room. Try again.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <button
          onClick={onBack}
          className="text-gray-500 hover:text-gray-300 text-sm mb-6 transition-colors"
        >
          ← Back
        </button>

        <h1 className="text-3xl font-black text-white mb-1 tracking-tight">Create Room</h1>
        <p className="text-gray-400 text-sm mb-8">Set up a game and invite friends with a room code.</p>

        <div className="space-y-6">
          <div>
            <label className="block text-gray-300 text-sm font-semibold mb-2">Your name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={24}
              placeholder="Enter your display name"
              className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-white placeholder-gray-600 focus:outline-none focus:border-green-600 transition-colors"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-semibold mb-2">Rounds</label>
            <div className="grid grid-cols-4 gap-2">
              {ROUND_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => setTotalRounds(n)}
                  className={`py-3 rounded-xl font-bold text-sm transition-all ${
                    totalRounds === n
                      ? "bg-green-600 text-white"
                      : "bg-gray-900 border border-gray-800 text-gray-400 hover:border-gray-700"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-semibold mb-2">Time per round</label>
            <div className="grid grid-cols-4 gap-2">
              {DURATION_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setRoundDurationSeconds(s)}
                  className={`py-3 rounded-xl font-bold text-sm transition-all ${
                    roundDurationSeconds === s
                      ? "bg-green-600 text-white"
                      : "bg-gray-900 border border-gray-800 text-gray-400 hover:border-gray-700"
                  }`}
                >
                  {s}s
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-950/40 border border-red-900 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-green-600 hover:bg-green-500 active:scale-95 text-white font-black text-lg transition-all shadow-xl shadow-green-900/40 disabled:opacity-50 disabled:active:scale-100"
          >
            {loading ? "Creating…" : "Create Room →"}
          </button>
        </div>
      </div>
    </main>
  );
}
