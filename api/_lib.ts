import type { IncomingMessage, ServerResponse } from 'http';

/**
 * Shared helpers for the rider BFF (Vercel serverless functions).
 *
 * The backend issues its own access/refresh JWTs. We keep them in httpOnly
 * cookies so browser JS — and any XSS — can never read them. Authenticated calls
 * from the SPA go through /api/proxy, which injects the bearer server-side.
 */

export const BACKEND_BASE_URL = (
  process.env.API_BASE_URL ||
  process.env.VITE_API_BASE_URL ||
  'https://mealdirectbackend.onrender.com/v1'
).replace(/\/$/, '');

export const ACCESS_COOKIE = 'md_rider_access';
export const REFRESH_COOKIE = 'md_rider_refresh';

const ACCESS_MAX_AGE_S = 60 * 60; // 1h
const REFRESH_MAX_AGE_S = 30 * 24 * 60 * 60; // 30d
const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';

export function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const name = part.slice(0, idx).trim();
    if (name) out[name] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return out;
}

function cookie(name: string, value: string, maxAge: number): string {
  const attrs = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`
  ];
  if (isProd) attrs.push('Secure');
  return attrs.join('; ');
}

export function setSessionCookies(
  res: ServerResponse,
  tokens: { accessToken?: string; refreshToken?: string; expiresIn?: number }
): void {
  const cookies: string[] = [];
  if (tokens.accessToken) {
    cookies.push(
      cookie(ACCESS_COOKIE, tokens.accessToken, tokens.expiresIn && tokens.expiresIn > 0 ? tokens.expiresIn : ACCESS_MAX_AGE_S)
    );
  }
  if (tokens.refreshToken) {
    cookies.push(cookie(REFRESH_COOKIE, tokens.refreshToken, REFRESH_MAX_AGE_S));
  }
  if (cookies.length) res.setHeader('Set-Cookie', cookies);
}

export function clearSessionCookies(res: ServerResponse): void {
  res.setHeader('Set-Cookie', [
    `${ACCESS_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${isProd ? '; Secure' : ''}`,
    `${REFRESH_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${isProd ? '; Secure' : ''}`
  ]);
}

export function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1_048_576) reject(new Error('Body too large'));
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

export function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

/** Exchange a refresh token for fresh tokens. Returns null on failure. */
export async function refreshTokens(
  refreshToken: string
): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number } | null> {
  const res = await fetch(`${BACKEND_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  if (!res.ok) return null;
  const json = await res.json().catch(() => null);
  const tokens = json?.data ?? json;
  return tokens?.accessToken ? tokens : null;
}
