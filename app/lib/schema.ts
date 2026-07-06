// ============================================================
// lib/schema.ts — Typed Firestore collection references & helpers
// ============================================================

import {
  collection,
  doc,
  CollectionReference,
  DocumentReference,
  WithFieldValue,
} from "firebase/firestore";
import { firestore } from "./firebase";
import type { RoomDoc, PlayerDoc, RoundDoc, GuessDoc } from "../types/game";

// ─── Typed collection refs ─────────────────────────────────────────────────────
// TypeScript trick: cast so Firestore knows the shape of each document.

export function roomsRef(): CollectionReference<RoomDoc> {
  return collection(firestore, "rooms") as CollectionReference<RoomDoc>;
}

export function roomRef(roomId: string): DocumentReference<RoomDoc> {
  return doc(firestore, "rooms", roomId) as DocumentReference<RoomDoc>;
}

export function playersRef(
  roomId: string
): CollectionReference<PlayerDoc> {
  return collection(
    firestore,
    "rooms",
    roomId,
    "players"
  ) as CollectionReference<PlayerDoc>;
}

export function playerRef(
  roomId: string,
  playerId: string
): DocumentReference<PlayerDoc> {
  return doc(
    firestore,
    "rooms",
    roomId,
    "players",
    playerId
  ) as DocumentReference<PlayerDoc>;
}

export function roundsRef(roomId: string): CollectionReference<RoundDoc> {
  return collection(
    firestore,
    "rooms",
    roomId,
    "rounds"
  ) as CollectionReference<RoundDoc>;
}

export function roundRef(
  roomId: string,
  roundNumber: number
): DocumentReference<RoundDoc> {
  return doc(
    firestore,
    "rooms",
    roomId,
    "rounds",
    String(roundNumber)
  ) as DocumentReference<RoundDoc>;
}

export function guessesRef(
  roomId: string,
  roundNumber: number
): CollectionReference<GuessDoc> {
  return collection(
    firestore,
    "rooms",
    roomId,
    "rounds",
    String(roundNumber),
    "guesses"
  ) as CollectionReference<GuessDoc>;
}

export function guessRef(
  roomId: string,
  roundNumber: number,
  playerId: string
): DocumentReference<GuessDoc> {
  return doc(
    firestore,
    "rooms",
    roomId,
    "rounds",
    String(roundNumber),
    "guesses",
    playerId
  ) as DocumentReference<GuessDoc>;
}

// ─── Utility: strip undefined so Firestore doesn't complain ───────────────────
export function clean<T extends object>(obj: T): WithFieldValue<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as WithFieldValue<T>;
}
