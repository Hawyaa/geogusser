"use client";

import { useState } from "react";
import { createProfile, recoverProfile } from "@/lib/profileService";
import { ProfileDoc } from "@/types/profile";
import Starfield from "../Starfield";

interface ProfileSetupScreenProps {
  avatarId: string;
  onDone: (profile: ProfileDoc) => void;
}

export default function ProfileSetupScreen({ avatarId, onDone }: ProfileSetupScreenProps) {
  const [mode, setMode] = useState<"new" | "recover">("new");
  const [handle, setHandle] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!handle.trim()) {
      setError("Enter a handle.");
      return;
    }
    if (!/^\d{4}$/.test(pin.trim())) {
      setError("PIN must be exactly 4 digits.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const profile =
        mode === "new"
          ? await createProfile(handle, pin, avatarId)
          : await recoverProfile(handle, pin);
      onDone(profile);
    } catch (err) {
      console.error("[ProfileSetupScreen] failed", err);
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen relative overflow-hidden bg-[#0a0a1a] flex items-center justify-center px-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_25%,rgba(124,58,237,0.18),transparent_55%)]" />
        <Starfield />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <h1 className="text-white font-black text-2xl mb-1 tracking-tight text-center">
          {mode === "new" ? "Pick a handle" : "Recover your profile"}
        </h1>
        <p className="text-gray-500 text-sm mb-6 text-center">
          {mode === "new"
            ? "This keeps your streak and stats if you come back later."
            : "Enter the handle and PIN from your other device."}
        </p>

        <div className="space-y-4 mb-5">
          <div>
            <label className="block text-gray-300 text-sm font-semibold mb-2">Handle</label>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              maxLength={20}
              placeholder="e.g. StreetSeeker"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-violet-900/40 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm font-semibold mb-2">4-digit PIN</label>
            <input
              type="text"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              maxLength={4}
              placeholder="••••"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-violet-900/40 text-white placeholder-gray-600 text-center text-2xl font-black tracking-[0.4em] focus:outline-none focus:border-violet-500 transition-colors"
            />
            <p className="text-gray-600 text-xs mt-2">
              Not a real password — just enough to recover your profile on another device.
            </p>
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-sm bg-red-950/40 border border-red-900 rounded-xl px-4 py-3 mb-4">
            {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-green-600 hover:bg-green-500 active:scale-95 text-white font-black text-lg transition-all shadow-xl shadow-green-900/40 disabled:opacity-50 disabled:active:scale-100 mb-4"
        >
          {loading ? "Saving…" : mode === "new" ? "Continue →" : "Recover profile →"}
        </button>

        <button
          onClick={() => {
            setMode((m) => (m === "new" ? "recover" : "new"));
            setError(null);
          }}
          className="w-full text-center text-gray-500 hover:text-gray-300 text-sm transition-colors"
        >
          {mode === "new" ? "I already have a profile" : "← Create a new profile instead"}
        </button>
      </div>
    </main>
  );
}
