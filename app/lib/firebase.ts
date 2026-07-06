// ============================================================
// lib/firebase.ts — Firebase app singleton
// ============================================================
// Put your project credentials in .env.local (never commit them).
// All values are NEXT_PUBLIC_ because they're used client-side.
// ============================================================

import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import {
  getFirestore,
  Firestore,
  connectFirestoreEmulator,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

// ─── Singleton pattern (safe in Next.js hot-reload) ───────────────────────────
let app: FirebaseApp;
let db: Firestore;

function initFirebase() {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  db = getFirestore(app);

  // Connect to the local emulator when running locally
  if (
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true" &&
    typeof window !== "undefined"
  ) {
    try {
      // connectFirestoreEmulator(db, "localhost", 8080);
      const emulatorPort = Number(process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_PORT) || 8080;
connectFirestoreEmulator(db, "localhost", emulatorPort);
console.info(`[Firebase] Connected to Firestore emulator on :${emulatorPort}`);
      console.info("[Firebase] Connected to Firestore emulator on :8080");
    } catch {
      // Already connected — safe to ignore in hot-reload
    }
  }

  return { app, db };
}

// Initialise immediately so the module is ready when imported
const firebase = initFirebase();
export const firebaseApp = firebase.app;
export const firestore   = firebase.db;
