import type { IncomingMessage, ServerResponse } from 'http';

import { sendJson } from '../_lib.js';
import { forwardAuth, readJson } from './_forward.js';

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== 'POST') return sendJson(res, 405, { error: { code: 'METHOD_NOT_ALLOWED' } });
  const body = await readJson(req);
  await forwardAuth(res, '/auth/rider/login', {
    email: typeof body.email === 'string' ? body.email : '',
    password: typeof body.password === 'string' ? body.password : ''
  });
}
