import assert from 'node:assert/strict';

import { extractProxyPath } from './proxy/[...path]';

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

test('extractProxyPath strips Vercel catch-all path query while preserving app query params', () => {
  const parsed = extractProxyPath('/api/proxy/rider/assignments?path=rider%2Fassignments&limit=50&cursor=abc');

  assert.deepEqual(parsed, {
    path: ['rider', 'assignments'],
    search: '?limit=50&cursor=abc',
  });
});

test('extractProxyPath can recover the proxied route from the Vercel path query', () => {
  const parsed = extractProxyPath('/api/proxy/[...path]?path=rider%2Forders%2Fconfirm-delivery');

  assert.deepEqual(parsed, {
    path: ['rider', 'orders', 'confirm-delivery'],
    search: '',
  });
});
