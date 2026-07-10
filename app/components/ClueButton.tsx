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

  const clues = getCluesForLocation(city ?? "", country);

  const handleReveal = () => {
    if (cluesRevealed < clues.length) {
      setCluesRevealed((c) => c + 1);
    }
  };

  return (
    <div className="flex flex-col gap-1 sm:gap-2 w-32 sm:w-64">
      {open && (
        <div
          className="rounded-md sm:rounded-xl overflow-hidden"
          style={{
            background: "rgba(10,10,20,0.92)",
            border: "1px solid rgba(34,197,94,0.3)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          {/* Header */}
          <div
            className="px-2 py-1 sm:px-4 sm:py-2 flex items-center justify-between"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
          >
            <span
              className="text-[8px] sm:text-xs font-bold tracking-widest uppercase"
              style={{ color: "#4ade80" }}
            >
              Clues
            </span>
            <span className="text-[8px] sm:text-xs text-white/30">
              {cluesRevealed}/{clues.length}
            </span>
          </div>

          {/* Revealed clues list */}
          <div className="px-2 py-1.5 sm:px-4 sm:py-3 flex flex-col gap-1 sm:gap-2">
            {cluesRevealed === 0 && (
              <p className="text-[8px] sm:text-xs text-white/40 italic">
                No clues yet. Tap below!
              </p>
            )}
            {clues.slice(0, cluesRevealed).map((clue, i) => (
              <div
                key={i}
                className="text-[9px] sm:text-sm text-white/80 py-1 px-1.5 sm:py-1.5 sm:px-3 rounded sm:rounded-lg"
                style={{ background: "rgba(34,197,94,0.12)" }}
              >
                {clue}
              </div>
            ))}
          </div>

          {/* Reveal next / all done */}
          {cluesRevealed < clues.length ? (
            <div className="px-2 pb-1.5 sm:px-4 sm:pb-3">
              <button
                onClick={handleReveal}
                className="w-full py-1 sm:py-2 rounded sm:rounded-lg text-[8px] sm:text-xs font-bold tracking-widest uppercase transition-all"
                style={{
                  background: "rgba(34,197,94,0.2)",
                  border: "1px solid rgba(34,197,94,0.4)",
                  color: "#4ade80",
                }}
              >
                Next clue →
              </button>
            </div>
          ) : (
            <p className="text-[8px] sm:text-xs text-white/30 text-center pb-1.5 sm:pb-3">
              All revealed!
            </p>
          )}
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="py-1 px-2 sm:py-2.5 sm:px-4 rounded-md sm:rounded-xl font-bold text-[10px] sm:text-sm tracking-widest uppercase transition-all whitespace-nowrap"
        style={{
          background: open
            ? "rgba(34,197,94,0.3)"
            : "linear-gradient(135deg, #22c55e, #16a34a)",
          border: "1px solid rgba(34,197,94,0.4)",
          color: "white",
          boxShadow: "0 4px 20px rgba(34,197,94,0.3)",
        }}
      >
        {open ? "✕ Hide" : "💡 Clues"}
      </button>
    </div>
  );
}