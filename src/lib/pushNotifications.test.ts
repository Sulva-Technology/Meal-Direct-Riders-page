import assert from 'node:assert/strict';
import { buildDeviceTokenBody, getPushReadiness } from './pushNotifications';

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

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

test('getPushReadiness reports denied permission before missing key', () => {
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

test('getPushReadiness reports missing vapid key when otherwise supported', () => {
  const readiness = getPushReadiness({
    hasServiceWorker: true,
    hasPushManager: true,
    hasNotification: true,
    permission: 'granted',
    publicKey: '   ',
  });

  assert.equal(readiness.ready, false);
  assert.equal(readiness.reason, 'missing_public_key');
});

test('getPushReadiness is ready when supported, permitted, and configured', () => {
  const readiness = getPushReadiness({
    hasServiceWorker: true,
    hasPushManager: true,
    hasNotification: true,
    permission: 'granted',
    publicKey: 'vapid-key',
  });

  assert.equal(readiness.ready, true);
  assert.equal(readiness.reason, 'ready');
});

test('buildDeviceTokenBody wraps the token with the web platform tag', () => {
  assert.deepEqual(buildDeviceTokenBody('abc123'), { token: 'abc123', platform: 'web' });
});
