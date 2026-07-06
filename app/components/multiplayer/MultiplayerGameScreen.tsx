"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import {
  subscribeToRoom,
  subscribeToPlayers,
} from "@/lib/room";
import {
  pickGameLocations,
  startRound,
  revealRound,
  finishGame,
  submitGuess,
  subscribeToRound,
  subscribeToGuesses,
} from "@/lib/round";
import { Location } from "@/lib/locations";
import { RoomDoc, PlayerDoc, RoundDoc, GuessDoc, LatLng } from "@/types/game";
import RoundTimer from "../RoundTimer";
import RevealScreen from "./RevealScreen";
import FinalLeaderboard from "./FinalLeaderboard";

const MapillaryViewer = dynamic(() => import("../MapillaryViewer"), { ssr: false });
const MultiplayerMiniMap = dynamic(() => import("./MultiplayerMiniMap"), { ssr: false });

interface MultiplayerGameScreenProps {
  roomId: string;
  playerId: string;
  onExit: () => void;
}

export default function MultiplayerGameScreen({
  roomId,
  playerId,
  onExit,
}: MultiplayerGameScreenProps) {
  const [room, setRoom] = useState<RoomDoc | null>(null);
  const [players, setPlayers] = useState<PlayerDoc[]>([]);
  const [round, setRound] = useState<RoundDoc | null>(null);
  const [guesses, setGuesses] = useState<GuessDoc[]>([]);
  const [guess, setGuess] = useState<LatLng | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [mapExpanded, setMapExpanded] = useState(true);

  const roundStartRef = useRef(Date.now());
  const guessRef = useRef<LatLng | null>(null);
  // Locations for the whole game, picked once by the host the moment
  // they start round 1. Stored only in the host's memory + written
  // round-by-round into Firestore as the game progresses.
  const gameLocationsRef = useRef<Location[]>([]);

  const isHost = room?.hostId === playerId;

  // ─── Subscribe to room + players (for phase changes, leaderboard) ──────
  useEffect(() => {
    const unsubRoom = subscribeToRoom(roomId, setRoom);
    const unsubPlayers = subscribeToPlayers(roomId, setPlayers);
    return () => {
      unsubRoom();
      unsubPlayers();
    };
  }, [roomId]);

  // ─── Host: kick off round 1 the moment we land on this screen ─────────
  useEffect(() => {
    if (!room || !isHost) return;
    if (room.phase === "countdown" && room.currentRound === 1 && gameLocationsRef.current.length === 0) {
      gameLocationsRef.current = pickGameLocations(room.totalRounds);
      const firstLocation = gameLocationsRef.current[0];
      startRound(roomId, playerId, 1, firstLocation, room.roundDurationSeconds).catch((err) =>
        console.error("[MultiplayerGameScreen] startRound failed", err)
      );
    }
  }, [room, isHost, roomId, playerId]);

  // ─── Subscribe to the current round + its guesses ──────────────────────
  useEffect(() => {
    if (!room || room.currentRound < 1) return;
    const unsubRound = subscribeToRound(roomId, room.currentRound, (r) => {
      setRound(r);
      if (r) roundStartRef.current = r.startedAt ?? Date.now();
    });
    const unsubGuesses = subscribeToGuesses(roomId, room.currentRound, setGuesses);
    // Reset local guess state whenever the round number changes
    setGuess(null);
    guessRef.current = null;
    setHasSubmitted(false);
    return () => {
      unsubRound();
      unsubGuesses();
    };
  }, [roomId, room?.currentRound]);

  // ─── Host: once everyone's submitted (or time is up), move to reveal ──
  const handleSubmit = useCallback(
    async (finalGuess: LatLng | null) => {
      if (!room || !round || hasSubmitted) return;
      const taken = Math.round((Date.now() - roundStartRef.current) / 1000);
      const fallback: LatLng = finalGuess ?? { lat: 0, lng: 0 };
      setHasSubmitted(true);
      try {
        await submitGuess(
          roomId,
          round.roundNumber,
          playerId,
          fallback,
          round.location,
          taken,
          room.roundDurationSeconds
        );
      } catch (err) {
        console.error("[MultiplayerGameScreen] submitGuess failed", err);
        setHasSubmitted(false);
      }
    },
    [room, round, hasSubmitted, roomId, playerId]
  );

  const handleTimeUp = useCallback(() => {
    if (!hasSubmitted) handleSubmit(guessRef.current);
  }, [hasSubmitted, handleSubmit]);

  // ─── Host: once all online players have submitted, reveal automatically ─
  useEffect(() => {
    if (!isHost || !room || !round || round.phase !== "active") return;
    const onlinePlayers = players.filter((p) => p.isOnline);
    if (onlinePlayers.length === 0) return;
    const allSubmitted = onlinePlayers.every((p) =>
      guesses.some((g) => g.playerId === p.playerId)
    );
    if (allSubmitted) {
      revealRound(roomId, round.roundNumber).catch((err) =>
        console.error("[MultiplayerGameScreen] revealRound failed", err)
      );
    }
  }, [isHost, room, round, players, guesses, roomId]);

  // ─── Host: advance to next round, or finish the game ───────────────────
  const handleHostNext = useCallback(async () => {
    if (!room || !isHost) return;
    const nextRoundNumber = room.currentRound + 1;
    if (nextRoundNumber > room.totalRounds) {
      await finishGame(roomId);
      return;
    }
    const nextLocation = gameLocationsRef.current[nextRoundNumber - 1];
    await startRound(roomId, playerId, nextRoundNumber, nextLocation, room.roundDurationSeconds);
  }, [room, isHost, roomId, playerId]);

  if (!room) {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-500">Loading room…</p>
      </main>
    );
  }

  if (room.phase === "finished") {
    return <FinalLeaderboard players={players} onExit={onExit} />;
  }

  if (room.phase === "revealing" && round) {
    return (
      <RevealScreen
        room={room}
        round={round}
        players={players}
        guesses={guesses}
        playerId={playerId}
        isHost={isHost}
        onHostNext={handleHostNext}
      />
    );
  }

  // "countdown" or "playing" with no round doc yet — brief loading state
  // while the host's startRound() write propagates to everyone.
  if (!round || room.phase === "countdown") {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse">🌍</div>
          <p className="text-gray-400">Starting round {room.currentRound || 1}…</p>
        </div>
      </main>
    );
  }

  const submittedCount = guesses.length;
  const onlineCount = players.filter((p) => p.isOnline).length;

  return (
    <div className="relative w-screen h-screen bg-gray-950 overflow-hidden">
      <div className="absolute inset-0">
        <MapillaryViewer key={round.roundNumber} location={round.location} />
      </div>

      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/70 to-transparent">
        <div className="text-white font-bold text-sm">🌍 GeoGuess</div>
        <div className="text-gray-300 text-sm">
          Round {round.roundNumber} / {room.totalRounds}
        </div>
        <div className="w-40">
          <RoundTimer
            key={round.roundNumber}
            duration={room.roundDurationSeconds}
            onTimeUp={handleTimeUp}
            paused={hasSubmitted}
          />
        </div>
      </div>

      <div className="absolute top-14 left-4 z-20 bg-black/60 rounded-xl px-3 py-2 text-xs text-gray-300">
        {submittedCount}/{onlineCount} players submitted
      </div>

      <div
        className={`absolute z-30 transition-all duration-300 ease-in-out ${
          mapExpanded ? "bottom-4 right-4 w-[520px] h-[420px]" : "bottom-4 right-4 w-[280px] h-[200px]"
        }`}
      >
        <button
          onClick={() => setMapExpanded((v) => !v)}
          className="absolute top-2 left-2 z-10 bg-black/70 hover:bg-black/90 text-white text-xs px-2 py-1 rounded-lg"
        >
          {mapExpanded ? "⊖ Shrink" : "⊕ Expand"}
        </button>
        <MultiplayerMiniMap
          key={round.roundNumber}
          onGuess={(latlng) => {
            guessRef.current = latlng;
            setGuess(latlng);
          }}
          disabled={hasSubmitted}
          myAvatarId={players.find((p) => p.playerId === playerId)?.avatarUrl ?? null}
        />
      </div>

      {!hasSubmitted && (
        <div className="absolute bottom-4 left-4 z-30">
          <button
            onClick={() => handleSubmit(guess)}
            disabled={!guess}
            className={`px-5 py-3 rounded-xl font-bold text-white text-sm shadow-xl transition-all ${
              guess ? "bg-green-600 hover:bg-green-500 active:scale-95" : "bg-gray-700 opacity-50 cursor-not-allowed"
            }`}
          >
            {guess ? "✅ Submit Guess" : "📍 Place a pin first"}
          </button>
        </div>
      )}

      {hasSubmitted && (
        <div className="absolute bottom-4 left-4 z-30 bg-black/70 text-white text-sm px-4 py-3 rounded-xl">
          ✅ Guess submitted — waiting for other players…
        </div>
      )}
    </div>
  );
}