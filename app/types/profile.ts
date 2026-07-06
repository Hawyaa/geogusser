// ============================================================
// types/profile.ts — Persistent player profile (Firestore: profiles/{deviceId})
// ============================================================
// A profile is keyed by a per-device ID (see getOrCreatePlayerId in
// lib/room.ts). The handle+PIN exist only so someone can manually
// re-attach their profile on a different device (see recoverProfile
// in lib/profileService.ts) — this is NOT secure auth, just a
// lightweight recovery mechanism for a casual game.
// ============================================================

export interface ProfileDoc {
  handle: string;
  pin: string;
  avatarId: string;
  currentStreak: number;
  longestStreak: number;
  lastPlayedDate: string | null;       // ISO date string, e.g. "2026-07-06"
  daysPlayedThisMonth: string[];       // array of ISO date strings
  createdAt: number;                   // Date.now()
  updatedAt: number;                   // Date.now()
}