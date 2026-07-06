// ============================================================
// lib/profile.ts — Avatar selection persistence
// ============================================================
// Avatar choice is saved to localStorage immediately (so it's available
// before a room even exists), and also written to the player's current
// room doc if they're already in one, so other players see the update
// live without needing to rejoin.
// ============================================================

import { doc, updateDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { getOrCreatePlayerId } from "@/lib/room";

const AVATAR_KEY = "geoguessr_avatar_id";

export function getSavedAvatarId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AVATAR_KEY);
}

function saveAvatarIdLocally(avatarId: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(AVATAR_KEY, avatarId);
}

// Call with no roomId to just save locally (e.g. picking an avatar
// before creating/joining any room). Pass roomId when the player is
// already seated in a room, so their PlayerDoc updates live too.
export async function saveAvatarChoice(avatarId: string, roomId?: string): Promise<void> {
  saveAvatarIdLocally(avatarId);
  if (!roomId) return;

  const playerId = getOrCreatePlayerId();
  const playerRef = doc(firestore, "rooms", roomId, "players", playerId);
  await updateDoc(playerRef, { avatarUrl: avatarId });
}
