// ============================================================
// lib/profileService.ts — Profile creation, recovery, streak tracking
// ============================================================
// Profiles are keyed by a per-device ID (same getOrCreatePlayerId from
// lib/room.ts — re-used here so a profile and a player's room identity
// share the same underlying ID). The handle+PIN exist only so someone
// can manually re-attach their profile on a different device; see the
// security note in types/profile.ts.
// ============================================================

import { doc, getDoc, setDoc, updateDoc, query, collection, where, getDocs } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { getOrCreatePlayerId } from "@/lib/room";
import { ProfileDoc } from "@/types/profile";

const PROFILE_CACHE_KEY = "geoguessr_profile_cached";

function todayLocalISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function daysBetween(aISO: string, bISO: string): number {
  const a = new Date(aISO + "T00:00:00");
  const b = new Date(bISO + "T00:00:00");
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function isSameMonth(aISO: string, bISO: string): boolean {
  return aISO.slice(0, 7) === bISO.slice(0, 7);
}

// ─── Local cache so the UI has something to render instantly ──────────────
export function getCachedProfile(): ProfileDoc | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(PROFILE_CACHE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ProfileDoc;
  } catch {
    return null;
  }
}

function cacheProfile(profile: ProfileDoc) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
}

// ─── Look up whether THIS device already has a profile ────────────────────
export async function getProfileForThisDevice(): Promise<ProfileDoc | null> {
  const deviceId = getOrCreatePlayerId();
  const ref = doc(firestore, "profiles", deviceId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const profile = snap.data() as ProfileDoc;
  cacheProfile(profile);
  return profile;
}

// ─── Create a brand-new profile for this device ────────────────────────────
export async function createProfile(handle: string, pin: string, avatarId: string): Promise<ProfileDoc> {
  const deviceId = getOrCreatePlayerId();
  const now = Date.now();
  const profile: ProfileDoc = {
    handle: handle.trim().slice(0, 20),
    pin: pin.trim(),
    avatarId,
    currentStreak: 0,
    longestStreak: 0,
    lastPlayedDate: null,
    daysPlayedThisMonth: [],
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(doc(firestore, "profiles", deviceId), profile);
  cacheProfile(profile);
  return profile;
}

// ─── Recover a profile by handle + PIN onto THIS device ───────────────────
// Looks up by handle (requires a query across the collection, since handle
// isn't the doc ID — deviceId is). Re-writes the profile under THIS
// device's ID so future reads use getOrCreatePlayerId() as normal.
export async function recoverProfile(handle: string, pin: string): Promise<ProfileDoc> {
  const profilesRef = collection(firestore, "profiles");
  const q = query(profilesRef, where("handle", "==", handle.trim().slice(0, 20)));
  const snap = await getDocs(q);

  const match = snap.docs.find((d) => (d.data() as ProfileDoc).pin === pin.trim());
  if (!match) {
    throw new Error("No profile found with that handle and PIN.");
  }

  const existing = match.data() as ProfileDoc;
  const deviceId = getOrCreatePlayerId();
  await setDoc(doc(firestore, "profiles", deviceId), existing);
  cacheProfile(existing);
  return existing;
}

// ─── Update the player's avatar on their profile ───────────────────────────
export async function updateProfileAvatar(avatarId: string): Promise<void> {
  const deviceId = getOrCreatePlayerId();
  const ref = doc(firestore, "profiles", deviceId);
  await updateDoc(ref, { avatarId, updatedAt: Date.now() });
  const cached = getCachedProfile();
  if (cached) cacheProfile({ ...cached, avatarId });
}

// ─── Call once per app session (e.g. on home screen mount) to record
// today's play and update the streak ────────────────────────────────────
export async function recordPlayToday(): Promise<ProfileDoc | null> {
  const deviceId = getOrCreatePlayerId();
  const ref = doc(firestore, "profiles", deviceId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  const profile = snap.data() as ProfileDoc;
  const today = todayLocalISO();

  if (profile.lastPlayedDate === today) {
    // Already recorded today — nothing to do.
    return profile;
  }

  let newStreak = 1;
  if (profile.lastPlayedDate) {
    const gap = daysBetween(profile.lastPlayedDate, today);
    if (gap === 1) {
      // Played yesterday — streak continues.
      newStreak = profile.currentStreak + 1;
    } else if (gap === 0) {
      newStreak = profile.currentStreak;
    }
    // gap > 1 (missed a day or more) — newStreak stays 1, streak resets.
  }

  const daysPlayedThisMonth = isSameMonth(profile.daysPlayedThisMonth[0] ?? today, today)
    ? [...profile.daysPlayedThisMonth, today]
    : [today]; // month rolled over — start fresh

  const updated: Partial<ProfileDoc> = {
    currentStreak: newStreak,
    longestStreak: Math.max(newStreak, profile.longestStreak),
    lastPlayedDate: today,
    daysPlayedThisMonth,
    updatedAt: Date.now(),
  };

  await updateDoc(ref, updated);
  const merged = { ...profile, ...updated } as ProfileDoc;
  cacheProfile(merged);
  return merged;
}
