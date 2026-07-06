// ============================================================
// lib/round.ts — Round lifecycle, guess submission, scoring
// ============================================================
// Client-side architecture (no Cloud Functions): the HOST's client
// writes each round's location, and EACH PLAYER's client scores their
// own guess locally on submit. Firestore security rules are the trust
// boundary — see firestore.rules. Fine for friends playing together,
// not abuse-proof against a malicious host or player.
// ============================================================

import {
    collection,
    doc,
    setDoc,
    updateDoc,
    onSnapshot,
    query,
    orderBy,
    increment,
    Unsubscribe,
  } from "firebase/firestore";
  import { firestore } from "@/lib/firebase";
  import { getRandomLocations, Location } from "@/lib/locations";
  import { calculateScore } from "@/lib/scoring";
  import { RoomDoc, RoundDoc, GuessDoc, LatLng, GamePhase } from "@/types/game";
  
  // Locations for an entire game are picked ONCE by the host and written
  // round-by-round, so every player genuinely sees the same place at the
  // same time. We don't persist the full list anywhere except the host's
  // local memory + each RoundDoc as it gets written.
  export function pickGameLocations(totalRounds: number): Location[] {
    return getRandomLocations(totalRounds);
  }
  
  // ─── Host: start a specific round ──────────────────────────────────────────
  export async function startRound(
    roomId: string,
    hostPlayerId: string,
    roundNumber: number,
    location: Location,
    roundDurationSeconds: number
  ): Promise<void> {
    const now = Date.now();
    const roundRef = doc(firestore, "rooms", roomId, "rounds", String(roundNumber));
  
    const round: RoundDoc = {
      roundNumber,
      location: { lat: location.lat, lng: location.lng },
      panoramaId: null,
      phase: "active",
      startedAt: now,
      endsAt: now + roundDurationSeconds * 1000,
      createdBy: hostPlayerId,
    };
    await setDoc(roundRef, round);
  
    // Flip the room into "playing" and record which round we're on
    const roomRef = doc(firestore, "rooms", roomId);
    await updateDoc(roomRef, {
      phase: "playing" as GamePhase,
      currentRound: roundNumber,
      roundEndsAt: round.endsAt,
      updatedAt: now,
    });
  }
  
  // ─── Host: move the room into the reveal phase for the current round ──────
  export async function revealRound(roomId: string, roundNumber: number): Promise<void> {
    const roundRef = doc(firestore, "rooms", roomId, "rounds", String(roundNumber));
    await updateDoc(roundRef, { phase: "done" });
  
    const roomRef = doc(firestore, "rooms", roomId);
    await updateDoc(roomRef, {
      phase: "revealing" as GamePhase,
      updatedAt: Date.now(),
    });
  }
  
  // ─── Host: advance to next round, or finish the game ───────────────────────
  export async function finishGame(roomId: string): Promise<void> {
    const roomRef = doc(firestore, "rooms", roomId);
    await updateDoc(roomRef, {
      phase: "finished" as GamePhase,
      updatedAt: Date.now(),
    });
  }
  
  // ─── Player: submit a guess, scored client-side immediately ───────────────
  export async function submitGuess(
    roomId: string,
    roundNumber: number,
    playerId: string,
    guess: LatLng,
    correctLocation: LatLng,
    timeTaken: number,
    totalTime: number
  ): Promise<void> {
    const { score, distanceKm } = calculateScore(guess, correctLocation, timeTaken, totalTime);
  
    const guessRef = doc(
      firestore,
      "rooms",
      roomId,
      "rounds",
      String(roundNumber),
      "guesses",
      playerId
    );
  
    const guessDoc: GuessDoc = {
      playerId,
      guess,
      submittedAt: Date.now(),
      distanceKm,
      roundScore: score,
    };
    await setDoc(guessRef, guessDoc);
  
    // Add this round's score onto the player's running total
    const playerRef = doc(firestore, "rooms", roomId, "players", playerId);
    await updateDoc(playerRef, { totalScore: increment(score) });
  }
  
  // ─── Live subscriptions ─────────────────────────────────────────────────────
  export function subscribeToRound(
    roomId: string,
    roundNumber: number,
    callback: (round: RoundDoc | null) => void
  ): Unsubscribe {
    const roundRef = doc(firestore, "rooms", roomId, "rounds", String(roundNumber));
    return onSnapshot(
      roundRef,
      (snap) => callback(snap.exists() ? (snap.data() as RoundDoc) : null),
      (err) => {
        console.error("[round] subscribeToRound error", err);
        callback(null);
      }
    );
  }
  
  export function subscribeToGuesses(
    roomId: string,
    roundNumber: number,
    callback: (guesses: GuessDoc[]) => void
  ): Unsubscribe {
    const guessesRef = collection(
      firestore,
      "rooms",
      roomId,
      "rounds",
      String(roundNumber),
      "guesses"
    );
    const q = query(guessesRef, orderBy("submittedAt", "asc"));
    return onSnapshot(
      q,
      (snap) => callback(snap.docs.map((d) => d.data() as GuessDoc)),
      (err) => {
        console.error("[round] subscribeToGuesses error", err);
        callback([]);
      }
    );
  }