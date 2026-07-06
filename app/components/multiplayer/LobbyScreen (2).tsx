"use client";

import { useEffect, useState, useRef } from "react";
import {
  subscribeToRoom,
  subscribeToPlayers,
  startGame,
  leaveRoom,
} from "@/lib/room";
import { RoomDoc, PlayerDoc } from "@/types/game";
import { getAvatarById } from "@/lib/avatars";
import AvatarIcon from "./AvatarIcon";

interface LobbyScreenProps {
  roomId: string;
  playerId: string;
  onGameStarted: () => void;
  onLeave: () => void;
}

export default function LobbyScreen({ roomId, playerId, onGameStarted, onLeave }: LobbyScreenProps) {
  const [room, setRoom] = useState<RoomDoc | null>(null);
  const [players, setPlayers] = useState<PlayerDoc[]>([]);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsubRoom = subscribeToRoom(roomId, setRoom);
    const unsubPlayers = subscribeToPlayers(roomId, setPlayers);
    return () => {
      unsubRoom();
      unsubPlayers();
    };
  }, [roomId]);

  // Once host starts the game, every player's subscription sees phase
  // flip to "countdown" — that's the cue to leave the lobby screen.
  // Guard with a ref so this only fires ONCE even if onGameStarted's
  // reference changes between renders (e.g. an inline arrow function
  // in the parent) — without this guard, the effect can re-fire on
  // every subsequent render while phase stays non-"lobby", repeatedly
  // calling setView() in the parent and racing with this component's
  // own unmount cleanup.
  const hasStartedRef = useRef(false);
  useEffect(() => {
    if (room && room.phase !== "lobby" && !hasStartedRef.current) {
      hasStartedRef.current = true;
      onGameStarted();
    }
  }, [room, onGameStarted]);

  const isHost = room?.hostId === playerId;

  async function handleStart() {
    setStarting(true);
    setError(null);
    try {
      await startGame(roomId);
      // onGameStarted fires via the room subscription effect above
    } catch (err) {
      console.error("[LobbyScreen] startGame failed", err);
      setError(err instanceof Error ? err.message : "Could not start game. Try again.");
      setStarting(false);
    }
  }

  async function handleLeave() {
    await leaveRoom(roomId, playerId);
    onLeave();
  }

  function handleCopyCode() {
    navigator.clipboard.writeText(roomId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  if (!room) {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <p className="text-gray-500">Loading room…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <p className="text-gray-500 text-sm mb-2 text-center">Room code</p>
        <button
          onClick={handleCopyCode}
          className="w-full text-center mb-8 group"
        >
          <span className="text-5xl font-black text-white tracking-[0.2em] group-hover:text-green-400 transition-colors">
            {roomId}
          </span>
          <p className="text-gray-600 text-xs mt-2">
            {copied ? "Copied!" : "Tap to copy"}
          </p>
        </button>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-sm uppercase tracking-wide">
              Players ({players.length}/8)
            </h2>
            {!isHost && (
              <span className="text-gray-600 text-xs">Waiting for host…</span>
            )}
          </div>

          <div className="space-y-2">
            {players.map((p) => (
              <div
                key={p.playerId}
                className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-950/50"
              >
                <div className="relative shrink-0">
                  <AvatarIcon avatar={getAvatarById(p.avatarUrl)} size={32} />
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-gray-950 ${
                      p.isOnline ? "bg-green-500" : "bg-gray-700"
                    }`}
                  />
                </div>
                <span className="text-gray-200 text-sm font-medium flex-1">
                  {p.displayName}
                </span>
                {p.playerId === room.hostId && (
                  <span className="text-green-400 text-xs font-bold uppercase">Host</span>
                )}
                {p.playerId === playerId && (
                  <span className="text-gray-600 text-xs">(you)</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <p className="text-gray-500 text-xs text-center mb-6">
          {room.totalRounds} rounds · {room.roundDurationSeconds}s per round
        </p>

        {error && (
          <p className="text-red-400 text-sm bg-red-950/40 border border-red-900 rounded-xl px-4 py-3 mb-4">
            {error}
          </p>
        )}

        {isHost ? (
          <button
            onClick={handleStart}
            disabled={starting || players.length < 2}
            className="w-full py-4 rounded-2xl bg-green-600 hover:bg-green-500 active:scale-95 text-white font-black text-lg transition-all shadow-xl shadow-green-900/40 disabled:opacity-50 disabled:active:scale-100 mb-3"
          >
            {starting
              ? "Starting…"
              : players.length < 2
              ? "Waiting for more players…"
              : "Start Game →"}
          </button>
        ) : null}

        <button
          onClick={handleLeave}
          className="w-full py-3 rounded-2xl bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-400 font-semibold transition-all"
        >
          Leave Room
        </button>
      </div>
    </main>
  );
}
