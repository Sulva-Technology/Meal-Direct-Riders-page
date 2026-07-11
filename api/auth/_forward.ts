import type { IncomingMessage, ServerResponse } from 'http';

import { BACKEND_BASE_URL, readBody, sendJson, setSessionCookies } from '../_lib.js';

/**
 * Forwards a credential payload to a backend auth endpoint, stores the returned
 * JWTs in httpOnly cookies, and returns only non-sensitive session facts.
 * `authed: false` means the account exists but has no session yet (email
 * confirmation required) — mirrors the old client behaviour.
 */
export async function forwardAuth(
  res: ServerResponse,
  backendPath: string,
  payload: unknown
): Promise<void> {
  let upstream: Response;
  try {
    upstream = await fetch(`${BACKEND_BASE_URL}${backendPath}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch {
    sendJson(res, 502, { error: { code: 'NETWORK_ERROR', message: 'Could not reach the server.' } });
    return;
  }

  const json = await upstream.json().catch(() => null);
  if (!upstream.ok) {
    sendJson(res, upstream.status, json ?? { error: { code: 'AUTH_FAILED', message: 'Login failed.' } });
    return;
  }

  const tokens = json?.data ?? json;
  if (!tokens?.accessToken) {
    sendJson(res, 200, { data: { authed: false, message: tokens?.message } });
    return;
  }

  setSessionCookies(res, tokens);
  sendJson(res, 200, { data: { authed: true, message: tokens?.message } });
}

export async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  try {
    const raw = await readBody(req);
    return raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}
