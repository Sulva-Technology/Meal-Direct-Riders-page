import type { IncomingMessage, ServerResponse } from 'http';

import {
  ACCESS_COOKIE,
  BACKEND_BASE_URL,
  REFRESH_COOKIE,
  parseCookies,
  readBody,
  refreshTokens,
  sendJson,
  setSessionCookies
} from '../_lib.js';

/**
 * Authenticated proxy to the Meal Direct backend.
 *
 *   SPA -> /api/proxy/<path> -> <BACKEND_BASE_URL>/<path>
 *
 * Injects the bearer from the httpOnly access cookie, refreshes on 401 and
 * retries once (rotating cookies), and forwards Idempotency-Key on mutations.
 */
const ALLOWED_ROOTS = new Set(['rider', 'me', 'notifications', 'auth']);
const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function extractPath(url: string): { path: string[]; search: string } {
  const [rawPath, search = ''] = url.split('?');
  const after = rawPath.replace(/^\/api\/proxy\/?/, '');
  const segments = after.split('/').filter((s) => s.length > 0);
  return { path: segments, search: search ? `?${search}` : '' };
}

function isSafe(path: string[]): boolean {
  if (path.length === 0 || !ALLOWED_ROOTS.has(path[0])) return false;
  return path.every((seg) => seg !== '.' && seg !== '..' && !seg.includes('\\'));
}

async function callBackend(
  method: string,
  url: string,
  accessToken: string,
  body: string | undefined,
  idempotencyKey: string | undefined
): Promise<Response> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/json'
  };
  if (body) headers['Content-Type'] = 'application/json';
  if (MUTATING.has(method)) headers['Idempotency-Key'] = idempotencyKey ?? crypto.randomUUID();
  return fetch(url, { method, headers, body });
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const { path, search } = extractPath(req.url ?? '');
  if (!isSafe(path)) {
    return sendJson(res, 403, {
      error: { code: 'FORBIDDEN_PATH', message: 'Path not allowed through this proxy.' }
    });
  }

  const cookies = parseCookies(req.headers.cookie);
  const accessToken = cookies[ACCESS_COOKIE];
  const refreshToken = cookies[REFRESH_COOKIE];
  if (!accessToken && !refreshToken) {
    return sendJson(res, 401, { error: { code: 'UNAUTHENTICATED', message: 'No active session.' } });
  }

  const method = (req.method ?? 'GET').toUpperCase();
  const url = `${BACKEND_BASE_URL}/${path.join('/')}${search}`;
  const body = MUTATING.has(method) ? await readBody(req) : undefined;
  const idempotencyKey = (req.headers['idempotency-key'] as string | undefined) ?? undefined;

  let rotated: Awaited<ReturnType<typeof refreshTokens>> = null;
  let upstream: Response | null = null;

  if (accessToken) {
    upstream = await callBackend(method, url, accessToken, body || undefined, idempotencyKey);
  }
  if ((!upstream || upstream.status === 401) && refreshToken) {
    rotated = await refreshTokens(refreshToken);
    if (rotated) {
      upstream = await callBackend(method, url, rotated.accessToken, body || undefined, idempotencyKey);
    }
  }

  if (!upstream) {
    return sendJson(res, 401, {
      error: { code: 'UNAUTHENTICATED', message: 'Session could not be refreshed.' }
    });
  }

  const text = await upstream.text();
  if (rotated) setSessionCookies(res, rotated);
  res.statusCode = upstream.status;
  res.setHeader('Content-Type', upstream.headers.get('Content-Type') ?? 'application/json');
  res.end(text);
}
