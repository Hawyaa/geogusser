"use client";
import dynamic from "next/dynamic";
import { RoundResult } from "@/types/game";
import { countryFlag } from "./multiplayer/MultiplayerMiniMap";

const ResultsMap = dynamic(() => import("./ResultsMap"), { ssr: false });

interface Props {
  result: RoundResult;
  round: number;
  totalRounds: number;
  onNext: () => void;
  isLastRound?: boolean;
}

function getRating(score: number) {
  if (score >= 4500) return { emoji: "🏆", label: "Perfect!" };
  if (score >= 3500) return { emoji: "🎯", label: "Excellent!" };
  if (score >= 2500) return { emoji: "👍", label: "Good job!" };
  if (score >= 1500) return { emoji: "🙂", label: "Not bad!" };
  if (score >= 500)  return { emoji: "😅", label: "Keep trying!" };
  return { emoji: "😬", label: "Way off!" };
}

export default function ResultsModal({
  result, round, totalRounds, onNext, isLastRound = false,
}: Props) {
  const score = typeof result?.score === "number" ? result.score : 0;
  const distRaw = typeof result?.distanceKm === "number" && !isNaN(result.distanceKm) ? result.distanceKm : 0;
  const dist = distRaw < 1 ? `${Math.round(distRaw * 1000)} m` : `${distRaw.toFixed(1)} km`;
  const rating = getRating(score);
  const loc = result?.correctLocation;
  const guess = result?.guessLocation;
  const pct = (score / 5000) * 100;
  const barColor = pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-yellow-400" : pct >= 25 ? "bg-orange-400" : "bg-red-500";
  const flag = loc?.country ? countryFlag(loc.country) : "📍";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[95vh] overflow-y-auto">

        {/* Header */}
        <div className="bg-gray-800 px-6 py-4 flex items-center justify-between border-b border-gray-700">
          <span className="text-gray-400 text-sm">Round {round} of {totalRounds}</span>
          <span className="text-white font-bold text-sm flex items-center gap-2">
            <span className="text-xl">{flag}</span>
            {loc?.city ? `${loc.city}, ` : ""}{loc?.country}
          </span>
        </div>

        {/* Score */}
        <div className="px-6 pt-5 pb-3 text-center">
          <div className="text-5xl mb-1">{rating.emoji}</div>
          <div className="text-3xl font-black text-white mb-1">
            {score.toLocaleString()}{" "}
            <span className="text-gray-400 text-lg font-normal">pts</span>
          </div>
          <div className="text-gray-400 text-sm mb-3">{rating.label}</div>
          <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden mb-1">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="px-6 pb-4 grid grid-cols-2 gap-3">
          <div className="bg-gray-800 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-white">{dist}</div>
            <div className="text-gray-400 text-xs mt-0.5">Distance off</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-white">
              {result?.timeTaken != null ? `${result.timeTaken}s` : "—"}
            </div>
            <div className="text-gray-400 text-xs mt-0.5">Time taken</div>
          </div>
        </div>

        {/* Map showing both pins */}
        {loc && (
          <div className="px-6 pb-4">
            <p className="text-gray-500 text-xs mb-2 uppercase tracking-wide">
              Your guess vs actual location
            </p>
            <div className="h-52 rounded-xl overflow-hidden border border-gray-700">
              <ResultsMap
                correctLocation={{ lat: loc.lat, lng: loc.lng }}
                guessLocation={guess ?? null}
                correctCountry={loc.country}
              />
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
                Your guess
              </span>
              <span className="flex items-center gap-1">
                <span className="text-base">{flag}</span>
                Actual location
              </span>
            </div>
          </div>
        )}

        {/* Next button */}
        <div className="px-6 pb-6">
          <button
            onClick={onNext}
            className="w-full py-3 rounded-xl font-bold text-white bg-green-600 hover:bg-green-500 active:scale-95 transition-all"
          >
            {isLastRound ? "🏁 See Final Results" : "Next Round →"}
          </button>
        </div>
      </div>
    </div>
  );
}