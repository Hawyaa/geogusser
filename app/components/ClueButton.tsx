"use client";

import { useState } from "react";
import { getCluesForLocation } from "../lib/clues";

interface Props {
  city?: string;
  country: string;
}

export default function ClueButton({ city, country }: Props) {
  const [cluesRevealed, setCluesRevealed] = useState(0);
  const [open, setOpen] = useState(false);

  console.log("ClueButton received:", { city, country });

  const clues = getCluesForLocation(city ?? "", country);

  console.log("Clues found:", clues);

  const handleReveal = () => {
    if (cluesRevealed < clues.length) {
      setCluesRevealed((c) => c + 1);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-64">
      {open && (
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: "rgba(10,10,20,0.92)",
            border: "1px solid rgba(34,197,94,0.3)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          {/* Header */}
          <div
            className="px-4 py-2 flex items-center justify-between"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
          >
            <span
              className="text-xs font-bold tracking-widest uppercase"
              style={{ color: "#4ade80" }}
            >
              Clues
            </span>
            <span className="text-xs text-white/30">
              {cluesRevealed}/{clues.length}
            </span>
          </div>

          {/* Revealed clues list */}
          <div className="px-4 py-3 flex flex-col gap-2">
            {cluesRevealed === 0 && (
              <p className="text-xs text-white/40 italic">
                No clues revealed yet. Tap below!
              </p>
            )}
            {clues.slice(0, cluesRevealed).map((clue, i) => (
              <div
                key={i}
                className="text-sm text-white/80 py-1.5 px-3 rounded-lg"
                style={{ background: "rgba(34,197,94,0.12)" }}
              >
                {clue}
              </div>
            ))}
          </div>

          {/* Reveal next / all done */}
          {cluesRevealed < clues.length ? (
            <div className="px-4 pb-3">
              <button
                onClick={handleReveal}
                className="w-full py-2 rounded-lg text-xs font-bold tracking-widest uppercase transition-all"
                style={{
                  background: "rgba(34,197,94,0.2)",
                  border: "1px solid rgba(34,197,94,0.4)",
                  color: "#4ade80",
                }}
              >
                Reveal next clue →
              </button>
            </div>
          ) : (
            <p className="text-xs text-white/30 text-center pb-3">
              All clues revealed!
            </p>
          )}
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="py-2.5 px-4 rounded-xl font-bold text-sm tracking-widest uppercase transition-all"
        style={{
          background: open
            ? "rgba(34,197,94,0.3)"
            : "linear-gradient(135deg, #22c55e, #16a34a)",
          border: "1px solid rgba(34,197,94,0.4)",
          color: "white",
          boxShadow: "0 4px 20px rgba(34,197,94,0.3)",
        }}
      >
        {open ? "✕ Hide Clues" : "💡 Clues"}
      </button>
    </div>
  );
}