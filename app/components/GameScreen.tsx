"use client";
import { useState, useCallback, useRef, useEffect } from "react";
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
  const [mapExpanded, setMapExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const roundStartRef = useRef(Date.now());
  const guessRef = useRef<LatLng | null>(null);

  const currentLocation = locations[round];

  // Detect mobile on mount — start map collapsed on mobile, expanded on desktop
  useEffect(() => {
    const mobile = window.innerWidth < 640;
    setIsMobile(mobile);
    setMapExpanded(!mobile);
  }, []);

  // Reset map to collapsed on mobile between rounds
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
      if (isMobile) setMapExpanded(false);
    }
  };

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

  if (gameOver) return <FinalScreen results={results} onRestart={() => window.location.reload()} />;

  // Map dimensions — much smaller on mobile when collapsed
  const mapStyle = mapExpanded
    ? { width: "min(92vw, 520px)", height: "min(58vh, 420px)" }
    : isMobile
    ? { width: "140px", height: "110px" }       // tiny thumbnail on mobile
    : { width: "min(55vw, 280px)", height: "min(35vh, 200px)" }; // normal shrunk on desktop

  return (
    <div className="relative w-screen h-screen bg-gray-950 overflow-hidden">

      {/* Street View — fills whole screen */}
      <div className="absolute inset-0">
        <MapillaryViewer location={currentLocation} />
      </div>

      {/* Top HUD */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 bg-gradient-to-b from-black/70 to-transparent">
        <div className="text-white font-bold text-xs sm:text-sm">🌍 GeoGuess</div>
        <div className="text-gray-300 text-xs sm:text-sm">Round {round + 1} / {TOTAL_ROUNDS}</div>
        <div className="w-28 sm:w-40">
          <RoundTimer
            key={timerKey}
            duration={ROUND_DURATION}
            onTimeUp={handleTimeUp}
            paused={!!result}
          />
        </div>
      </div>

      {/* Mini map — top-right when collapsed on mobile, bottom-right when expanded or on desktop */}
      <div
        className={`absolute z-30 transition-all duration-300 ease-in-out ${
          mapExpanded
            ? "bottom-3 right-3 sm:bottom-4 sm:right-4"
            : isMobile
            ? "top-14 right-3"
            : "bottom-3 right-3 sm:bottom-4 sm:right-4"
        }`}
        style={mapStyle}
      >
        {/* Expand/shrink button */}
        <button
          onClick={() => setMapExpanded((v) => !v)}
          className="absolute top-1.5 left-1.5 z-10 bg-black/80 hover:bg-black text-white text-[10px] sm:text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md leading-tight"
        >
          {mapExpanded ? "⊖" : "⊕"}
        </button>
        <MiniMap onGuess={handleGuess} disabled={!!result} />
      </div>

      {/* Bottom-left controls: clue + submit */}
      {!result && (
        <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-30 flex flex-col items-start gap-1.5 sm:gap-2">
          <ClueButton
            key={round}
            city={currentLocation.city}
            country={currentLocation.country}
          />
          <button
            onClick={() => submitGuess(guess)}
            disabled={!guess}
            className={`px-3 py-2 sm:px-5 sm:py-3 rounded-lg sm:rounded-xl font-bold text-white text-xs sm:text-sm shadow-xl transition-all ${
              guess
                ? "bg-green-600 hover:bg-green-500 active:scale-95"
                : "bg-gray-700 opacity-50 cursor-not-allowed"
            }`}
          >
            {guess ? "✅ Submit" : "📍 Place a pin"}
          </button>
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