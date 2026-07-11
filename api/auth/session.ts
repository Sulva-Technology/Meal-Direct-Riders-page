import type { IncomingMessage, ServerResponse } from 'http';

import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  parseCookies,
  refreshTokens,
  sendJson,
  setSessionCookies
} from '../_lib.js';

/**
 * Reports whether a session exists, without exposing tokens.
 *
 *   GET /api/auth/session           -> { authed }
 *   GET /api/auth/session?refresh=1 -> refreshes first (rotating cookies), so a
 *                                      freshly-onboarded rider picks up new claims.
 */
export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const cookies = parseCookies(req.headers.cookie);
  const accessToken = cookies[ACCESS_COOKIE];
  const refreshToken = cookies[REFRESH_COOKIE];
  const wantRefresh = (req.url ?? '').includes('refresh=1');

  if ((wantRefresh || !accessToken) && refreshToken) {
    const rotated = await refreshTokens(refreshToken);
    if (rotated) {
      setSessionCookies(res, rotated);
      return sendJson(res, 200, { data: { authed: true } });
    }
  }

  sendJson(res, 200, { data: { authed: !!accessToken } });
}
