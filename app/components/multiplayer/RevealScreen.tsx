"use client";

import dynamic from "next/dynamic";
import { RoomDoc, RoundDoc, PlayerDoc, GuessDoc } from "@/types/game";
import { WORLD_LOCATIONS } from "@/lib/locations";
import { countryFlag } from "./MultiplayerMiniMap";

const MultiplayerMiniMap = dynamic(() => import("./MultiplayerMiniMap"), { ssr: false });

// Find the country for the round's location by matching coordinates
// against the locations list (exact match since we picked from that list).
function getCountryForLocation(lat: number, lng: number): string {
  const match = WORLD_LOCATIONS.find(
    (l) => Math.abs(l.lat - lat) < 0.001 && Math.abs(l.lng - lng) < 0.001
  );
  return match?.country ?? "";
}

interface RevealScreenProps {
  room: RoomDoc;
  round: RoundDoc;
  players: PlayerDoc[];
  guesses: GuessDoc[];
  playerId: string;
  isHost: boolean;
  onHostNext: () => void;
}

// A small fixed palette so each player gets a stable, distinguishable
// pin color round to round (cycles if there are more than 8 players).
const PIN_COLORS = [
  "#22c55e", "#3b82f6", "#f97316", "#ec4899",
  "#a855f7", "#eab308", "#06b6d4", "#ef4444",
];

export default function RevealScreen({
  room,
  round,
  players,
  guesses,
  playerId,
  isHost,
  onHostNext,
}: RevealScreenProps) {
  const isLastRound = round.roundNumber >= room.totalRounds;
  const country = getCountryForLocation(round.location.lat, round.location.lng);
  const flag = countryFlag(country);

  // Sort by this round's score, highest first, for the results list
  const ranked = [...players]
    .map((p) => {
      const g = guesses.find((gu) => gu.playerId === p.playerId);
      return { player: p, guess: g };
    })
    .sort((a, b) => (b.guess?.roundScore ?? -1) - (a.guess?.roundScore ?? -1));

  const otherPins = guesses.map((g, i) => {
    const player = players.find((p) => p.playerId === g.playerId);
    return {
      playerId: g.playerId,
      displayName: player?.displayName ?? "Player",
      guess: g.guess,
      color: PIN_COLORS[i % PIN_COLORS.length],
      avatarId: player?.avatarUrl ?? null,
    };
  });

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-6 flex flex-col items-center">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black text-white mb-1">
            Round {round.roundNumber} Results
          </h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-3xl">{flag}</span>
            <span className="text-white font-bold text-lg">{country}</span>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            {room.totalRounds - round.roundNumber > 0
              ? `${room.totalRounds - round.roundNumber} rounds left`
              : "Final round"}
          </p>
        </div>

        <div className="h-[340px] rounded-2xl overflow-hidden border border-gray-800 mb-6">
          <MultiplayerMiniMap
            onGuess={() => {}}
            disabled
            otherPins={otherPins}
            correctLocation={round.location}
            correctCountry={country}
          />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-6">
          <h2 className="text-white font-bold text-sm uppercase tracking-wide mb-3">
            Round Scores
          </h2>
          <div className="space-y-2">
            {ranked.map(({ player, guess: g }, i) => (
              <div
                key={player.playerId}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl ${
                  player.playerId === playerId ? "bg-green-950/40 border border-green-900" : "bg-gray-950/50"
                }`}
              >
                <span className="text-gray-600 text-sm font-bold w-5">{i + 1}</span>
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: PIN_COLORS[i % PIN_COLORS.length] }}
                />
                <span className="text-gray-200 text-sm font-medium flex-1">
                  {player.displayName}
                  {player.playerId === playerId && (
                    <span className="text-gray-600 text-xs ml-1">(you)</span>
                  )}
                </span>
                {g ? (
                  <>
                    <span className="text-gray-500 text-xs">
                      {g.distanceKm != null ? `${g.distanceKm.toFixed(0)} km` : "—"}
                    </span>
                    <span className="text-white font-bold text-sm w-16 text-right">
                      {g.roundScore?.toLocaleString() ?? 0} pts
                    </span>
                  </>
                ) : (
                  <span className="text-gray-600 text-xs italic">No guess</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-6">
          <h2 className="text-white font-bold text-sm uppercase tracking-wide mb-3">
            Total Scores
          </h2>
          <div className="space-y-1">
            {[...players]
              .sort((a, b) => b.totalScore - a.totalScore)
              .map((p, i) => (
                <div key={p.playerId} className="flex justify-between text-sm px-3 py-1">
                  <span className="text-gray-400">
                    {i + 1}. {p.displayName}
                    {p.playerId === playerId && <span className="text-gray-600 text-xs ml-1">(you)</span>}
                  </span>
                  <span className="text-white font-bold">{p.totalScore.toLocaleString()}</span>
                </div>
              ))}
          </div>
        </div>

        {isHost ? (
          <button
            onClick={onHostNext}
            className="w-full py-4 rounded-2xl bg-green-600 hover:bg-green-500 active:scale-95 text-white font-black text-lg transition-all shadow-xl shadow-green-900/40"
          >
            {isLastRound ? "See Final Results →" : "Next Round →"}
          </button>
        ) : (
          <p className="text-gray-500 text-sm text-center">Waiting for host to continue…</p>
        )}
      </div>
    </main>
  );
}