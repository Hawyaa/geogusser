"use client";

import { useState } from "react";
import { AVATARS, getAvatarById } from "@/lib/avatars";
import AvatarIcon from "./AvatarIcon";
import { saveAvatarChoice } from "@/lib/profile";
import Starfield from "../Starfield";

interface AvatarPickerProps {
  initialAvatarId?: string;
  onSaved: (avatarId: string) => void;
  onBack?: () => void;
}

export default function AvatarPicker({ initialAvatarId, onSaved, onBack }: AvatarPickerProps) {
  const [selectedId, setSelectedId] = useState(initialAvatarId ?? AVATARS[0].id);
  const [saving, setSaving] = useState(false);
  const selected = getAvatarById(selectedId);

  async function handleSave() {
    setSaving(true);
    try {
      await saveAvatarChoice(selectedId);
      onSaved(selectedId);
    } catch (err) {
      console.error("[AvatarPicker] save failed", err);
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen relative overflow-hidden bg-[#0a0a1a] flex items-center justify-center px-4 py-8">
      {/* Starfield background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(124,58,237,0.18),transparent_55%),radial-gradient(ellipse_at_80%_70%,rgba(59,130,246,0.14),transparent_55%)]" />
        <Starfield />
      </div>

      <div className="relative z-10 w-full max-w-3xl">
        {onBack && (
          <button
            onClick={onBack}
            className="text-gray-500 hover:text-gray-300 text-sm mb-6 transition-colors"
          >
            ← Back
          </button>
        )}

        <div className="grid md:grid-cols-[1fr_1.3fr] gap-8 items-center">
          {/* Left: big preview standing on a simple planet */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-56 h-56 flex items-center justify-center">
              <div className="absolute bottom-2 w-40 h-40 rounded-full bg-gradient-to-br from-violet-700/40 to-blue-900/40 border border-violet-500/30" />
              <div className="relative z-10 -mt-6">
                <AvatarIcon avatar={selected} size={140} />
              </div>
            </div>
            <p className="text-white font-bold text-lg mt-2">{selected.name}</p>
          </div>

          {/* Right: picker grid */}
          <div>
            <h1 className="text-white font-black text-2xl mb-1 tracking-tight">Choose avatar</h1>
            <p className="text-gray-500 text-sm mb-5">Pick who represents you in the lobby and on the map.</p>

            <div className="grid grid-cols-4 gap-3 mb-3">
              {AVATARS.map((a) => {
                const isSelected = a.id === selectedId;
                return (
                  <button
                    key={a.id}
                    onClick={() => setSelectedId(a.id)}
                    aria-pressed={isSelected}
                    className={`aspect-square rounded-2xl flex items-center justify-center transition-all border ${
                      isSelected
                        ? "bg-violet-950/60 border-violet-400 shadow-[0_0_0_2px_rgba(167,139,250,0.4)]"
                        : "bg-white/5 border-violet-900/40 hover:border-violet-600/60 hover:bg-white/10"
                    }`}
                  >
                    <AvatarIcon avatar={a} size={48} />
                  </button>
                );
              })}
            </div>
            <p className="text-gray-600 text-xs mb-6">(Don't worry, you can change this later)</p>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-4 rounded-2xl bg-green-600 hover:bg-green-500 active:scale-95 text-white font-black text-lg tracking-wide transition-all shadow-xl shadow-green-900/40 disabled:opacity-50 disabled:active:scale-100"
            >
              {saving ? "Saving…" : "SAVE PROFILE"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}