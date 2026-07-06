"use client";

import { useState } from "react";
import { joinRoom, getSavedDisplayName } from "@/lib/room";

interface JoinRoomScreenProps {
  onRoomJoined: (roomId: string, playerId: string) => void;
  onBack: () => void;
}

export default function JoinRoomScreen({ onRoomJoined, onBack }: JoinRoomScreenProps) {
  const [name, setName] = useState(getSavedDisplayName());
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleJoin() {
    if (!name.trim()) {
      setError("Enter a display name first.");
      return;
    }
    if (!code.trim()) {
      setError("Enter the room code.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { roomId, playerId } = await joinRoom(code, name.trim());
      onRoomJoined(roomId, playerId);
    } catch (err) {
      console.error("[JoinRoomScreen] joinRoom failed", err);
      setError(err instanceof Error ? err.message : "Could not join room. Try again.");
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

        <h1 className="text-3xl font-black text-white mb-1 tracking-tight">Join Room</h1>
        <p className="text-gray-400 text-sm mb-8">Enter the code your host shared with you.</p>

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
            <label className="block text-gray-300 text-sm font-semibold mb-2">Room code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={6}
              placeholder="ABCD12"
              className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-white placeholder-gray-600 text-center text-2xl font-black tracking-[0.3em] uppercase focus:outline-none focus:border-green-600 transition-colors"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-950/40 border border-red-900 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          <button
            onClick={handleJoin}
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-green-600 hover:bg-green-500 active:scale-95 text-white font-black text-lg transition-all shadow-xl shadow-green-900/40 disabled:opacity-50 disabled:active:scale-100"
          >
            {loading ? "Joining…" : "Join Room →"}
          </button>
        </div>
      </div>
    </main>
  );
}
