import type { IncomingMessage, ServerResponse } from 'http';

import { ACCESS_COOKIE, BACKEND_BASE_URL, clearSessionCookies, parseCookies, sendJson } from '../_lib.js';

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const cookies = parseCookies(req.headers.cookie);
  const accessToken = cookies[ACCESS_COOKIE];
  if (accessToken) {
    try {
      await fetch(`${BACKEND_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' }
      });
    } catch {
      // best-effort; clearing cookies is what matters
    }
  }
  clearSessionCookies(res);
  sendJson(res, 200, { data: { success: true } });
}
