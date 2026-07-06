// ============================================================
// GeoGuessr MMO — Firestore Data Schema (fully typed)
// ============================================================
//
// Firestore collection layout:
//
//   rooms/{roomId}                         ← RoomDoc
//   rooms/{roomId}/players/{playerId}      ← PlayerDoc
//   rooms/{roomId}/rounds/{roundNumber}    ← RoundDoc
//   rooms/{roomId}/rounds/{roundNumber}/guesses/{playerId}  ← GuessDoc
//
// ============================================================

export type GamePhase =
  | "lobby"       // waiting for players, host can start
  | "countdown"   // 3-2-1 before round starts
  | "playing"     // Street View is live, timer running
  | "revealing"   // showing results / leaderboard
  | "finished";   // all rounds done, final scores

// ─── Root room document ────────────────────────────────────────────────────────
export interface RoomDoc {
  roomId: string;
  hostId: string;                  // playerId of the room creator
  phase: GamePhase;
  currentRound: number;            // 1-indexed, 0 means not started
  totalRounds: number;             // default 3
  roundDurationSeconds: number;    // default 60
  /** Unix ms when the current round's timer expires */
  roundEndsAt: number | null;
  createdAt: number;               // Date.now()
  updatedAt: number;
}

// ─── Player sub-document ───────────────────────────────────────────────────────
export interface PlayerDoc {
  playerId: string;
  displayName: string;
  avatarUrl: string | null;        // optional gravatar / emoji avatar
  totalScore: number;
  isOnline: boolean;
  joinedAt: number;
}

// ─── Round sub-document ────────────────────────────────────────────────────────
export interface RoundDoc {
  roundNumber: number;             // 1, 2, 3 …
  /** The secret location (written client-side by the host, never exposed
   *  to other clients via UI before they guess — trust boundary is
   *  Firestore rules + the honor system, since there's no auth/Cloud Functions) */
  location: LatLng;
  /** Panorama ID for Mapillary */
  panoramaId: string | null;
  phase: "active" | "scoring" | "done";
  startedAt: number | null;
  endsAt: number | null;
  /** playerId of whoever wrote this round doc (must be the host).
   *  Required by firestore.rules to authorize round create/update —
   *  every round write MUST set this field or it will be rejected. */
  createdBy: string;
}

// ─── Guess sub-document ────────────────────────────────────────────────────────
export interface GuessDoc {
  playerId: string;
  guess: LatLng;
  submittedAt: number;
  /** Populated client-side by the submitting player right after they guess */
  distanceKm: number | null;
  roundScore: number | null;
}

// ─── Shared primitives ─────────────────────────────────────────────────────────
export interface LatLng {
  lat: number;
  lng: number;
}

// ─── Derived client-side types ─────────────────────────────────────────────────
export interface PlayerWithGuess extends PlayerDoc {
  guess: GuessDoc | null;
}

export interface LeaderboardEntry {
  playerId: string;
  displayName: string;
  avatarUrl: string | null;
  totalScore: number;
  roundScore: number | null;
  distanceKm: number | null;
  rank: number;
}

// ─── Single-player round result (client-side, local game mode) ────────────────
export interface RoundResult {
  score: number;
  distanceKm: number;
  correctLocation: {
    lat: number;
    lng: number;
    country: string;
    city?: string;
  };
  guessLocation: LatLng | null;
  timeTaken: number;
}