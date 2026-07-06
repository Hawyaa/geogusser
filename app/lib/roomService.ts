// ============================================================
// lib/roomService.ts — Create / join / start room actions
// ============================================================

import {
  setDoc,
  updateDoc,
  getDoc,
  serverTimestamp,
  FieldValue,
} from "firebase/firestore";
import { roomRef, playerRef, clean } from "./schema";
import type { RoomDoc, PlayerDoc } from "../types/game";

// ─── Generate a short, human-readable room code ───────────────────────────────
export function generateRoomId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/1/0 ambiguity
  return Array.from({ length: 6 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join("");
}

// ─── Generate a random player ID ─────────────────────────────────────────────
export function generatePlayerId(): string {
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Create a brand-new room (called by the host) ─────────────────────────────
export async function createRoom(
  hostId: string,
  hostName: string
): Promise<string> {
  const roomId = generateRoomId();
  const now = Date.now();

  const room: RoomDoc = {
    roomId,
    hostId,
    phase: "lobby",
    currentRound: 0,
    totalRounds: 3,
    roundDurationSeconds: 60,
    roundEndsAt: null,
    createdAt: now,
    updatedAt: now,
  };

  // Write room document
  await setDoc(roomRef(roomId), clean(room));

  // Add host as first player
  await joinRoom(roomId, hostId, hostName);

  return roomId;
}

// ─── Join an existing room ────────────────────────────────────────────────────
export async function joinRoom(
  roomId: string,
  playerId: string,
  displayName: string
): Promise<void> {
  // Validate room exists
  const snap = await getDoc(roomRef(roomId));
  if (!snap.exists()) {
    throw new Error(`Room "${roomId}" does not exist.`);
  }
  if (snap.data().phase !== "lobby") {
    throw new Error("Game has already started.");
  }

  const player: PlayerDoc = {
    playerId,
    displayName,
    avatarUrl: null,
    totalScore: 0,
    isOnline: true,
    joinedAt: Date.now(),
  };

  await setDoc(playerRef(roomId, playerId), clean(player));
}

// ─── Mark player offline (call on window unload / component unmount) ──────────
export async function markOffline(
  roomId: string,
  playerId: string
): Promise<void> {
  try {
    await updateDoc(playerRef(roomId, playerId), { isOnline: false });
  } catch {
    // Best-effort; ignore if the doc no longer exists
  }
}

// ─── Mark player back online ──────────────────────────────────────────────────
export async function markOnline(
  roomId: string,
  playerId: string
): Promise<void> {
  await updateDoc(playerRef(roomId, playerId), { isOnline: true });
}
