import { registerPushSubscription, unregisterPushSubscription } from './endpoints';

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

export interface SerializedPushSubscription {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh?: string;
    auth?: string;
  };
}

export interface RegisterPushResult {
  subscription: SerializedPushSubscription;
  permission: NotificationPermission;
}

const env = (import.meta as ImportMeta & { env?: ImportMetaEnv }).env;
export const PUSH_PUBLIC_KEY: string = env?.VITE_WEB_PUSH_PUBLIC_KEY ?? '';
const SERVICE_WORKER_PATH = '/sw.js';

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

export function urlBase64ToUint8Array(value: string): Uint8Array {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const base64 = `${value}${padding}`.replace(/-/g, '+').replace(/_/g, '/');
  const raw = typeof atob === 'function'
    ? atob(base64)
    : Buffer.from(base64, 'base64').toString('binary');

  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

function arrayBufferToBase64(buffer: ArrayBuffer | null): string | undefined {
  if (!buffer) return undefined;
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return typeof btoa === 'function'
    ? btoa(binary)
    : Buffer.from(bytes).toString('base64');
}

export function serializePushSubscription(subscription: PushSubscription): SerializedPushSubscription {
  return {
    endpoint: subscription.endpoint,
    expirationTime: subscription.expirationTime,
    keys: {
      p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
      auth: arrayBufferToBase64(subscription.getKey('auth')),
    },
  };
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

  const registration = await getServiceWorkerRegistration();
  const existing = await registration.pushManager.getSubscription();
  const subscription = existing ?? await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  const serialized = serializePushSubscription(subscription);
  await registerPushSubscription({
    subscription: serialized,
    userAgent: navigator.userAgent,
  });

  return { subscription: serialized, permission };
}

export async function disablePushNotifications(): Promise<void> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration(SERVICE_WORKER_PATH);
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;

  const serialized = serializePushSubscription(subscription);
  await unregisterPushSubscription({ endpoint: serialized.endpoint });
  await subscription.unsubscribe();
}
