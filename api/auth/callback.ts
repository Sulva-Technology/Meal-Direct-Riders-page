import type { IncomingMessage, ServerResponse } from 'http';

import { sendJson, setSessionCookies } from '../_lib.js';
import { readJson } from './_forward.js';

/**
 * Receives the access/refresh tokens Supabase places in the URL fragment of an
 * email-link redirect. The fragment is client-only, so the SPA POSTs the tokens
 * here; we move them into httpOnly cookies and never return them to the browser.
 */
export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== 'POST') return sendJson(res, 405, { error: { code: 'METHOD_NOT_ALLOWED' } });
  const body = await readJson(req);
  const accessToken = typeof body.accessToken === 'string' ? body.accessToken : '';
  const refreshToken = typeof body.refreshToken === 'string' ? body.refreshToken : '';
  const expiresIn = typeof body.expiresIn === 'number' ? body.expiresIn : undefined;

  if (!accessToken || !refreshToken) {
    return sendJson(res, 400, {
      error: { code: 'MISSING_TOKENS', message: 'Callback is missing session tokens.' }
    });
  }

  setSessionCookies(res, { accessToken, refreshToken, expiresIn });
  sendJson(res, 200, { data: { authed: true } });
}
