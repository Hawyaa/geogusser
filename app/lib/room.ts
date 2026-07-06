// ============================================================
// lib/room.ts — Room creation, joining, and presence
// ============================================================
// No auth required — players are identified by a random client-side
// ID stored in localStorage so they survive a page refresh but are
// otherwise anonymous. Room codes are short, human-typeable strings.
// ============================================================

import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  Unsubscribe,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { RoomDoc, PlayerDoc, GamePhase } from "@/types/game";
import { getSavedAvatarId } from "@/lib/profile";

const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I — avoids confusion when read aloud
const PLAYER_ID_KEY = "geoguessr_player_id";
const DISPLAY_NAME_KEY = "geoguessr_display_name";

// ─── Local player identity (persisted across refresh, no login) ───────────────
export function getOrCreatePlayerId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(PLAYER_ID_KEY);
  if (!id) {
    id = "p_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    localStorage.setItem(PLAYER_ID_KEY, id);
  }
  return id;
}

export function getSavedDisplayName(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(DISPLAY_NAME_KEY) || "";
}

export function saveDisplayName(name: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(DISPLAY_NAME_KEY, name);
}

function generateRoomCode(length = 6): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
  }
  return code;
}

// ─── Room creation ──────────────────────────────────────────────────────────
export async function createRoom(opts: {
  hostDisplayName: string;
  totalRounds: number;
  roundDurationSeconds: number;
}): Promise<{ roomId: string; playerId: string }> {
  const playerId = getOrCreatePlayerId();
  saveDisplayName(opts.hostDisplayName);

  // Retry on the (very unlikely) chance of a code collision
  for (let attempt = 0; attempt < 5; attempt++) {
    const roomId = generateRoomCode();
    const roomRef = doc(firestore, "rooms", roomId);
    const existing = await getDoc(roomRef);
    if (existing.exists()) continue; // collision, try again

    const now = Date.now();
    const room: RoomDoc = {
      roomId,
      hostId: playerId,
      phase: "lobby",
      currentRound: 0,
      totalRounds: opts.totalRounds,
      roundDurationSeconds: opts.roundDurationSeconds,
      roundEndsAt: null,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(roomRef, room);

    await joinAsPlayer(roomId, playerId, opts.hostDisplayName);

    return { roomId, playerId };
  }

  throw new Error("Could not generate a unique room code — please try again.");
}

// ─── Joining an existing room ───────────────────────────────────────────────
export async function joinRoom(
  roomCodeRaw: string,
  displayName: string
): Promise<{ roomId: string; playerId: string }> {
  const roomId = roomCodeRaw.trim().toUpperCase();
  const playerId = getOrCreatePlayerId();
  saveDisplayName(displayName);

  const roomRef = doc(firestore, "rooms", roomId);
  const roomSnap = await getDoc(roomRef);

  if (!roomSnap.exists()) {
    throw new Error("Room not found. Double-check the code and try again.");
  }

  const room = roomSnap.data() as RoomDoc;
  if (room.phase !== "lobby") {
    throw new Error("This game has already started — ask the host for a new room.");
  }

  await joinAsPlayer(roomId, playerId, displayName);

  return { roomId, playerId };
}

async function joinAsPlayer(roomId: string, playerId: string, displayName: string) {
  const playerRef = doc(firestore, "rooms", roomId, "players", playerId);
  const existing = await getDoc(playerRef);

  if (existing.exists()) {
    // Rejoining (e.g. refreshed the page) — just mark online again
    await updateDoc(playerRef, { isOnline: true, displayName });
    return;
  }

  const player: PlayerDoc = {
    playerId,
    displayName: displayName.trim().slice(0, 24) || "Player",
    avatarUrl: getSavedAvatarId(),
    totalScore: 0,
    isOnline: true,
    joinedAt: Date.now(),
  };
  await setDoc(playerRef, player);
}

export async function leaveRoom(roomId: string, playerId: string) {
  const playerRef = doc(firestore, "rooms", roomId, "players", playerId);
  try {
    await updateDoc(playerRef, { isOnline: false });
  } catch {
    // room/player may already be gone — safe to ignore
  }
}

// ─── Host controls ──────────────────────────────────────────────────────────
export async function startGame(roomId: string) {
  const roomRef = doc(firestore, "rooms", roomId);
  await updateDoc(roomRef, {
    phase: "countdown" as GamePhase,
    currentRound: 1,
    updatedAt: Date.now(),
  });
}

// ─── Live subscriptions ─────────────────────────────────────────────────────
export function subscribeToRoom(
  roomId: string,
  callback: (room: RoomDoc | null) => void
): Unsubscribe {
  const roomRef = doc(firestore, "rooms", roomId);
  return onSnapshot(
    roomRef,
    (snap) => callback(snap.exists() ? (snap.data() as RoomDoc) : null),
    (err) => {
      console.error("[room] subscribeToRoom error", err);
      callback(null);
    }
  );
}

export function subscribeToPlayers(
  roomId: string,
  callback: (players: PlayerDoc[]) => void
): Unsubscribe {
  const playersRef = collection(firestore, "rooms", roomId, "players");
  const q = query(playersRef, orderBy("joinedAt", "asc"));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => d.data() as PlayerDoc)),
    (err) => {
      console.error("[room] subscribeToPlayers error", err);
      callback([]);
    }
  );
}