import assert from 'node:assert/strict';
import {
  getPushReadiness,
  serializePushSubscription,
  urlBase64ToUint8Array,
} from './pushNotifications';

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

test('urlBase64ToUint8Array decodes URL-safe VAPID keys', () => {
  const result = urlBase64ToUint8Array('SGVsbG8td29ybGQ');
  assert.deepEqual(Array.from(result), Array.from(new TextEncoder().encode('Hello-world')));
});

test('getPushReadiness reports missing browser capabilities first', () => {
  const readiness = getPushReadiness({
    hasServiceWorker: false,
    hasPushManager: true,
    hasNotification: true,
    permission: 'default',
    publicKey: 'abc',
  });

  assert.equal(readiness.ready, false);
  assert.equal(readiness.reason, 'unsupported');
});

test('getPushReadiness reports denied permission before VAPID configuration', () => {
  const readiness = getPushReadiness({
    hasServiceWorker: true,
    hasPushManager: true,
    hasNotification: true,
    permission: 'denied',
    publicKey: '',
  });

  assert.equal(readiness.ready, false);
  assert.equal(readiness.reason, 'denied');
});

test('serializePushSubscription keeps endpoint and available encryption keys', () => {
  const payload = serializePushSubscription({
    endpoint: 'https://push.example/subscription',
    expirationTime: null,
    getKey(name: PushEncryptionKeyName) {
      const data = name === 'p256dh' ? 'public-key' : 'auth-secret';
      return new TextEncoder().encode(data).buffer;
    },
  } as PushSubscription);

  assert.deepEqual(payload, {
    endpoint: 'https://push.example/subscription',
    expirationTime: null,
    keys: {
      p256dh: 'cHVibGljLWtleQ==',
      auth: 'YXV0aC1zZWNyZXQ=',
    },
  });
});
