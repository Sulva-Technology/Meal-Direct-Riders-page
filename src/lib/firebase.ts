// Firebase app + messaging init (client side).
// NOTE: keep firebaseConfig in sync with public/firebase-messaging-sw.js — the
// service worker cannot import from src, so the same config literal lives there too.
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getMessaging, isSupported, type Messaging } from 'firebase/messaging';

// Firebase web config is public by design (it identifies the project, it is not a secret).
export const firebaseConfig = {
  apiKey: 'AIzaSyAYKfgVS5WGsbZLQ42dsKTJy98fRRjj1w8',
  authDomain: 'mealdirect-2192b.firebaseapp.com',
  projectId: 'mealdirect-2192b',
  storageBucket: 'mealdirect-2192b.firebasestorage.app',
  messagingSenderId: '99018858239',
  appId: '1:99018858239:web:9ff663f20b28f8c5d036ca',
  measurementId: 'G-34V8S6D2GF',
};

let app: FirebaseApp | null = null;
export function getFirebaseApp(): FirebaseApp {
  if (!app) app = initializeApp(firebaseConfig);
  return app;
}

let messagingPromise: Promise<Messaging | null> | null = null;
/** Resolve the Messaging instance, or null when the browser can't support FCM. */
export function getFirebaseMessaging(): Promise<Messaging | null> {
  if (!messagingPromise) {
    messagingPromise = isSupported()
      .then((ok) => (ok ? getMessaging(getFirebaseApp()) : null))
      .catch(() => null);
  }
  return messagingPromise;
}
