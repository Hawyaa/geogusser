// ============================================================
// lib/liveStats.ts — Live "players active now" counter
// ============================================================
// No Cloud Functions, so this is a client-side aggregate query using
// Firestore's getCountFromServer (cheap — counts without downloading
// documents). "Active" = rooms not yet finished, counting their players.
//
// This is a snapshot at call time, not a live subscription — re-fetch
// on an interval if you want it to visibly tick up/down.
// ============================================================

import { collection, collectionGroup, query, where, getCountFromServer } from "firebase/firestore";
import { firestore } from "@/lib/firebase";

export async function getActivePlayerCount(): Promise<number> {
  try {
    // Players subcollection across ALL rooms, filtered to online ones.
    // Requires a Firestore composite index on collectionGroup("players")
    // for the isOnline field if this errors with "needs an index" —
    // Firestore will print a direct console link to create it.
    const playersQuery = query(
      collectionGroup(firestore, "players"),
      where("isOnline", "==", true)
    );
    const snap = await getCountFromServer(playersQuery);
    return snap.data().count;
  } catch (err) {
    console.error("[liveStats] getActivePlayerCount failed", err);
    return 0;
  }
}

export async function getActiveRoomCount(): Promise<number> {
  try {
    const roomsQuery = query(
      collection(firestore, "rooms"),
      where("phase", "!=", "finished")
    );
    const snap = await getCountFromServer(roomsQuery);
    return snap.data().count;
  } catch (err) {
    console.error("[liveStats] getActiveRoomCount failed", err);
    return 0;
  }
}
