"use client";
import { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { LatLng, RoundResult } from "@/types/game";
import { getRandomLocations, Location } from "@/lib/locations";
import { calculateScore } from "@/lib/scoring";
import RoundTimer from "./RoundTimer";
import ResultsModal from "./ResultsModal";
import ClueButton from "./ClueButton";

const MapillaryViewer = dynamic(() => import("./MapillaryViewer"), { ssr: false });
const MiniMap = dynamic(() => import("./MiniMap"), { ssr: false });

const TOTAL_ROUNDS = 5;
const ROUND_DURATION = 60;

function FinalScreen({ results, onRestart }: { results: RoundResult[]; onRestart: () => void }) {
  const total = results.reduce((sum, r) => sum + r.score, 0);
  const avg = Math.round(total / results.length);
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="bg-gray-800 px-6 py-4 border-b border-gray-700 text-center">
          <h2 className="text-white font-black text-xl">🏁 Game Over</h2>
        </div>
        <div className="px-6 py-6 text-center">
          <div className="text-5xl font-black text-white mb-1">{total.toLocaleString()}</div>
          <div className="text-gray-400 text-sm mb-6">Total Score</div>
          <div className="space-y-2 mb-6">
            {results.map((r, i) => (
              <div key={i} className="flex justify-between items-center bg-gray-800 rounded-xl px-4 py-2 text-sm">
                <span className="text-gray-400">Round {i + 1} — {r.correctLocation.city || r.correctLocation.country}</span>
                <span className="text-white font-bold">{r.score.toLocaleString()} pts</span>
              </div>
            ))}
          </div>
          <div className="bg-gray-800 rounded-xl px-4 py-3 mb-6 flex justify-between text-sm">
            <span className="text-gray-400">Average per round</span>
            <span className="text-white font-bold">{avg.toLocaleString()} pts</span>
          </div>
          <button onClick={onRestart} className="w-full py-3 rounded-xl font-bold text-white bg-green-600 hover:bg-green-500 active:scale-95 transition-all">
            🔄 Play Again
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GameScreen() {
  const [locations] = useState<Location[]>(() => getRandomLocations(TOTAL_ROUNDS));
  const [round, setRound] = useState(0);
  const [guess, setGuess] = useState<LatLng | null>(null);
  const [result, setResult] = useState<RoundResult | null>(null);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [timerKey, setTimerKey] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [mapExpanded, setMapExpanded] = useState(true);
  const roundStartRef = useRef(Date.now());
  const guessRef = useRef<LatLng | null>(null);

  const currentLocation = locations[round];

  const handleGuess = (latlng: LatLng) => {
    guessRef.current = latlng;
    setGuess(latlng);
  };

  const submitGuess = useCallback((finalGuess: LatLng | null) => {
    const taken = Math.round((Date.now() - roundStartRef.current) / 1000);
    const guessLatLng = finalGuess ?? { lat: 0, lng: 0 };
    const { score, distanceKm } = calculateScore(
      guessLatLng,
      { lat: currentLocation.lat, lng: currentLocation.lng },
      taken,
      ROUND_DURATION
    );
    const roundResult: RoundResult = {
      score,
      distanceKm,
      correctLocation: currentLocation,
      guessLocation: finalGuess,
      timeTaken: taken,
    };
    setResult(roundResult);
    setResults((prev) => [...prev, roundResult]);
  }, [currentLocation]);

  const handleTimeUp = useCallback(() => {
    submitGuess(guessRef.current);
  }, [submitGuess]);

  const handleNext = () => {
    if (round + 1 >= TOTAL_ROUNDS) {
      setGameOver(true);
    } else {
      setRound((r) => r + 1);
      setGuess(null);
      guessRef.current = null;
      setResult(null);
      setTimerKey((k) => k + 1);
      roundStartRef.current = Date.now();
    }
  };

  if (gameOver) return <FinalScreen results={results} onRestart={() => window.location.reload()} />;

  return (
    <div className="relative w-screen h-screen bg-gray-950 overflow-hidden">

      {/* Street View */}
      <div className="absolute inset-0">
        <MapillaryViewer location={currentLocation} />
      </div>

      {/* Top HUD */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/70 to-transparent">
        <div className="text-white font-bold text-sm">🌍 GeoGuess Ethiopia</div>
        <div className="text-gray-300 text-sm">Round {round + 1} / {TOTAL_ROUNDS}</div>
        <div className="w-40">
          <RoundTimer
            key={timerKey}
            duration={ROUND_DURATION}
            onTimeUp={handleTimeUp}
            paused={!!result}
          />
        </div>
      </div>

      {/* Mini map bottom right — responsive size + fades out a bit when shrunk */}
      <div
        className={`absolute z-30 transition-all duration-300 ease-in-out bottom-3 right-3 sm:bottom-4 sm:right-4 ${
          mapExpanded ? "opacity-100" : "opacity-60 hover:opacity-95"
        }`}
        style={{
          width: mapExpanded ? "min(90vw, 520px)" : "min(55vw, 280px)",
          height: mapExpanded ? "min(60vh, 420px)" : "min(35vh, 200px)",
        }}
      >
        <button
          onClick={() => setMapExpanded((v) => !v)}
          className="absolute top-2 left-2 z-10 bg-black/70 hover:bg-black/90 text-white text-xs px-2 py-1 rounded-lg"
        >
          {mapExpanded ? "⊖ Shrink" : "⊕ Expand"}
        </button>
        <MiniMap onGuess={handleGuess} disabled={!!result} />
      </div>

      {/* Submit button bottom left — smaller on mobile */}
      {!result && (
        <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-30 flex flex-col gap-1.5 sm:gap-2">
          <button
            onClick={() => submitGuess(guess)}
            disabled={!guess}
            className={`px-3 py-2 sm:px-5 sm:py-3 rounded-lg sm:rounded-xl font-bold text-white text-xs sm:text-sm shadow-xl transition-all ${
              guess
                ? "bg-green-600 hover:bg-green-500 active:scale-95"
                : "bg-gray-700 opacity-50 cursor-not-allowed"
            }`}
          >
            {guess ? "✅ Submit Guess" : "📍 Place a pin first"}
          </button>

          {/* 💡 Clue button sits right above submit */}
          <ClueButton
            key={round}
            city={currentLocation.city}
            country={currentLocation.country}
          />
        </div>
      )}

      {/* Results modal */}
      {result && (
        <ResultsModal
          result={result}
          round={round + 1}
          totalRounds={TOTAL_ROUNDS}
          onNext={handleNext}
          isLastRound={round + 1 === TOTAL_ROUNDS}
        />
      )}
    </div>
  );
}