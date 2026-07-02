import { deleteToken, getToken, onMessage, type MessagePayload } from 'firebase/messaging';
import { getFirebaseMessaging } from './firebase';
import { registerDeviceToken, deleteDeviceToken } from './endpoints';

export type PushReadinessReason = 'ready' | 'unsupported' | 'denied' | 'missing_public_key';

export interface PushReadinessInput {
  hasServiceWorker: boolean;
  hasPushManager: boolean;
  hasNotification: boolean;
  permission: NotificationPermission;
  publicKey?: string;
}

export interface PushReadiness {
  ready: boolean;
  reason: PushReadinessReason;
  message?: string;
}

export interface DeviceTokenBody {
  token: string;
  platform: 'web';
}

export interface RegisterPushResult {
  token: string;
  permission: NotificationPermission;
}

const env = (import.meta as ImportMeta & { env?: ImportMetaEnv }).env;
// FCM "Web Push certificate" public key (Firebase console → Cloud Messaging).
export const PUSH_PUBLIC_KEY: string = env?.VITE_WEB_PUSH_PUBLIC_KEY ?? '';
const SERVICE_WORKER_PATH = '/firebase-messaging-sw.js';
const DEVICE_TOKEN_KEY = 'md_fcm_token';

export function getPushReadiness(input: PushReadinessInput): PushReadiness {
  if (!input.hasServiceWorker || !input.hasPushManager || !input.hasNotification) {
    return {
      ready: false,
      reason: 'unsupported',
      message: 'Push notifications are not supported by this browser.',
    };
  }

  if (input.permission === 'denied') {
    return {
      ready: false,
      reason: 'denied',
      message: 'Notifications are blocked for this browser. Enable them in browser settings first.',
    };
  }

  if (!input.publicKey?.trim()) {
    return {
      ready: false,
      reason: 'missing_public_key',
      message: 'Push notifications are not configured for this deployment.',
    };
  }

  return { ready: true, reason: 'ready' };
}

export function getBrowserPushReadiness(publicKey = PUSH_PUBLIC_KEY): PushReadiness {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      ready: false,
      reason: 'unsupported',
      message: 'Push notifications are only available in the browser.',
    };
  }

  return getPushReadiness({
    hasServiceWorker: 'serviceWorker' in navigator,
    hasPushManager: 'PushManager' in window,
    hasNotification: 'Notification' in window,
    permission: 'Notification' in window ? Notification.permission : 'denied',
    publicKey,
  });
}

export function buildDeviceTokenBody(token: string): DeviceTokenBody {
  return { token, platform: 'web' };
}

function storeToken(token: string): void {
  try {
    localStorage.setItem(DEVICE_TOKEN_KEY, token);
  } catch {
    /* storage unavailable (private mode / SSR) — token still registered server-side */
  }
}

function readStoredToken(): string | null {
  try {
    return localStorage.getItem(DEVICE_TOKEN_KEY);
  } catch {
    return null;
  }
}

function clearStoredToken(): void {
  try {
    localStorage.removeItem(DEVICE_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration(SERVICE_WORKER_PATH);
  return existing ?? navigator.serviceWorker.register(SERVICE_WORKER_PATH);
}

export async function enablePushNotifications(publicKey = PUSH_PUBLIC_KEY): Promise<RegisterPushResult> {
  const readiness = getBrowserPushReadiness(publicKey);
  if (!readiness.ready) throw new Error(readiness.message);

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error(permission === 'denied'
      ? 'Notifications are blocked for this browser.'
      : 'Notification permission was not granted.');
  }

  const messaging = await getFirebaseMessaging();
  if (!messaging) throw new Error('Push notifications are not supported by this browser.');

  const registration = await getServiceWorkerRegistration();
  const token = await getToken(messaging, {
    vapidKey: publicKey,
    serviceWorkerRegistration: registration,
  });
  if (!token) throw new Error('Could not obtain a device token for push notifications.');

  await registerDeviceToken(token);
  storeToken(token);

  return { token, permission };
}

export async function disablePushNotifications(): Promise<void> {
  const token = readStoredToken();
  try {
    if (token) await deleteDeviceToken(token);
  } finally {
    const messaging = await getFirebaseMessaging();
    if (messaging) {
      await deleteToken(messaging).catch(() => {
        /* token may already be gone — clearing local state below is enough */
      });
    }
    clearStoredToken();
  }
}

/** Subscribe to foreground pushes (tab focused). Returns an unsubscribe fn. */
export function initForegroundMessaging(handler: (payload: MessagePayload) => void): () => void {
  let unsubscribe = () => {};
  let cancelled = false;

  getFirebaseMessaging().then((messaging) => {
    if (!messaging || cancelled) return;
    unsubscribe = onMessage(messaging, handler);
  });

  return () => {
    cancelled = true;
    unsubscribe();
  };
}
