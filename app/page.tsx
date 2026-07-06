// app/page.tsx
"use client";

import { useState, useCallback, useEffect } from "react";
import GameScreen from "./components/GameScreen";
import CreateRoomScreen from "./components/multiplayer/CreateRoomScreen";
import JoinRoomScreen from "./components/multiplayer/JoinRoomScreen";
import LobbyScreen from "./components/multiplayer/LobbyScreen";
import MultiplayerGameScreen from "./components/multiplayer/MultiplayerGameScreen";
import AvatarPicker from "./components/multiplayer/AvatarPicker";
import AvatarIcon from "./components/multiplayer/AvatarIcon";
import ProfileSetupScreen from "./components/multiplayer/ProfileSetupScreen";
import Starfield from "./components/Starfield";
import { getAvatarById } from "@/lib/avatars";
import { getSavedAvatarId } from "@/lib/profile";
import { getProfileForThisDevice, getCachedProfile, recordPlayToday, updateProfileAvatar } from "@/lib/profileService";
import { getActivePlayerCount } from "@/lib/liveStats";
import { ProfileDoc } from "@/types/profile";

type View = "home" | "solo" | "create" | "join" | "lobby" | "mp-game" | "avatar" | "profile-setup";

export default function Home() {
  const [view, setView] = useState<View>("avatar");
  const [roomId, setRoomId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  // IMPORTANT: do NOT read localStorage here during initial state init.
  // localStorage doesn't exist during server-side rendering, so the
  // server always renders the default avatar — if the client read the
  // real saved value on its very first render, the two wouldn't match
  // and React throws a hydration error. Instead, start with null (same
  // on server and client) and pick up the real saved value in the
  // effect below, which only ever runs in the browser after mount.
  const [avatarId, setAvatarId] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileDoc | null>(null);
  const [profileChecked, setProfileChecked] = useState(false);
  const [activePlayers, setActivePlayers] = useState<number | null>(null);

  useEffect(() => {
    setAvatarId(getSavedAvatarId());
    // Show cached profile instantly if we have one, then confirm/refresh
    // against Firestore (cache may be stale or this may be a fresh device).
    setProfile(getCachedProfile());
    getProfileForThisDevice()
      .then((p) => {
        setProfile(p);
        setProfileChecked(true);
        if (p) {
          recordPlayToday().then((updated) => updated && setProfile(updated));
        }
      })
      .catch((err) => {
        console.error("[Home] profile lookup failed", err);
        setProfileChecked(true);
      });
    getActivePlayerCount().then(setActivePlayers);
  }, []);

  // These must be declared before any early returns below — React
  // requires the same hooks to run in the same order on every render.
  // Putting them after a conditional `return` means they'd only run
  // on SOME renders (e.g. skipped whenever view === "create"), which
  // throws "Rendered fewer hooks than expected."
  const handleGameStarted = useCallback(() => setView("mp-game"), []);
  const handleExitToHome = useCallback(() => {
    setRoomId(null);
    setPlayerId(null);
    setView("home");
  }, []);

  if (view === "avatar") {
    return (
      <AvatarPicker
        initialAvatarId={avatarId ?? undefined}
        onSaved={async (id) => {
          setAvatarId(id);
          if (profile) {
            // Returning player who already has a profile — just update
            // the avatar on it and go straight home.
            await updateProfileAvatar(id).catch((err) =>
              console.error("[Home] updateProfileAvatar failed", err)
            );
            setProfile((p) => (p ? { ...p, avatarId: id } : p));
            setView("home");
          } else if (profileChecked) {
            // First time on this device — need a handle before we can
            // create the profile doc.
            setView("profile-setup");
          } else {
            // Profile lookup hasn't resolved yet — fall back to home;
            // the lookup effect will catch up shortly after.
            setView("home");
          }
        }}
      />
    );
  }

  if (view === "profile-setup") {
    return (
      <ProfileSetupScreen
        avatarId={avatarId ?? "av_1"}
        onDone={(p) => {
          setProfile(p);
          setAvatarId(p.avatarId);
          setView("home");
        }}
      />
    );
  }

  if (view === "solo") return <GameScreen />;

  if (view === "create") {
    return (
      <CreateRoomScreen
        onRoomCreated={(rid, pid) => {
          setRoomId(rid);
          setPlayerId(pid);
          setView("lobby");
        }}
        onBack={() => setView("home")}
      />
    );
  }

  if (view === "join") {
    return (
      <JoinRoomScreen
        onRoomJoined={(rid, pid) => {
          setRoomId(rid);
          setPlayerId(pid);
          setView("lobby");
        }}
        onBack={() => setView("home")}
      />
    );
  }

  if (view === "lobby" && roomId && playerId) {
    return (
      <LobbyScreen
        roomId={roomId}
        playerId={playerId}
        onGameStarted={handleGameStarted}
        onLeave={handleExitToHome}
      />
    );
  }

  if (view === "mp-game" && roomId && playerId) {
    return (
      <MultiplayerGameScreen
        roomId={roomId}
        playerId={playerId}
        onExit={handleExitToHome}
      />
    );
  }

  return (
    <main className="min-h-screen relative overflow-hidden bg-[#0a0a1a] flex items-center justify-center px-4 py-10">
      {/* Starfield background, same world as the avatar picker */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_15%,rgba(124,58,237,0.18),transparent_55%),radial-gradient(ellipse_at_85%_75%,rgba(34,197,94,0.10),transparent_50%)]" />
        <Starfield />
      </div>

      <div className="relative z-10 text-center max-w-md w-full">
        {/* Profile header: avatar standing on a glowing planet */}
        <button
          onClick={() => setView("avatar")}
          className="inline-flex flex-col items-center gap-1 mb-5 group"
        >
          <div className="relative w-24 h-24 flex items-center justify-center">
            <div className="absolute bottom-1 w-16 h-16 rounded-full bg-gradient-to-br from-violet-700/50 to-blue-900/50 border border-violet-500/30 group-hover:border-violet-400/60 transition-colors" />
            <div className="relative z-10 -mt-3">
              <AvatarIcon avatar={getAvatarById(avatarId)} size={68} />
            </div>
          </div>
          <span className="text-gray-500 group-hover:text-violet-300 text-xs transition-colors">
            {profile?.handle ?? "Edit avatar"}
            {profile && profile.currentStreak > 0 && (
              <span className="ml-1.5 text-orange-400">
                🔥 {profile.currentStreak}
              </span>
            )}
          </span>
        </button>

        <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
          GeoGuess
        </h1>
        <p className="text-green-400 font-semibold text-lg mb-1">Ethiopia Edition</p>
        <p className="text-gray-400 text-sm mb-3">
          Explore real street-level photos from Ethiopia and East Africa.
          Drop your pin as close as you can!
        </p>

        {activePlayers !== null && activePlayers > 0 && (
          <p className="text-gray-500 text-xs mb-6">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 align-middle animate-pulse" />
            {activePlayers} player{activePlayers === 1 ? "" : "s"} active right now
          </p>
        )}

        {!(activePlayers !== null && activePlayers > 0) && <div className="mb-6" />}

        <div className="space-y-3 mb-6">
          <button
            onClick={() => setView("solo")}
            className="w-full py-4 rounded-2xl bg-green-600 hover:bg-green-500 active:scale-95 text-white font-black text-lg transition-all shadow-xl shadow-green-900/40"
          >
            Play Solo →
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setView("create")}
              className="py-4 rounded-2xl bg-white/5 border border-violet-900/40 hover:border-violet-500/60 hover:bg-white/10 active:scale-95 text-white font-bold transition-all"
            >
              Create Room
            </button>
            <button
              onClick={() => setView("join")}
              className="py-4 rounded-2xl bg-white/5 border border-violet-900/40 hover:border-violet-500/60 hover:bg-white/10 active:scale-95 text-white font-bold transition-all"
            >
              Join Room
            </button>
          </div>
        </div>

        <details className="text-left group/details">
          <summary className="text-gray-500 hover:text-gray-300 text-xs cursor-pointer list-none flex items-center justify-center gap-1 transition-colors">
            How to play
            <span className="transition-transform group-open/details:rotate-180">⌄</span>
          </summary>
          <div className="mt-3 bg-white/5 border border-violet-900/30 rounded-2xl p-4 space-y-2.5">
            {[
              ["📸", "You'll see a real street-level photo"],
              ["🗺️", "Click the map to place your guess"],
              ["⏱️", "You have 60 seconds per round"],
              ["🏆", "Closer = more points (max 5,000)"],
            ].map(([icon, text]) => (
              <div key={text} className="flex items-center gap-3 text-gray-300 text-sm">
                <span className="text-base">{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </details>

        <p className="text-gray-600 text-xs mt-6">Powered by Mapillary · OpenStreetMap · Next.js</p>
      </div>
    </main>
  );
}