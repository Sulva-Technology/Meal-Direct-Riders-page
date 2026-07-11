// Thin fetch client for the Meal Direct backend.
// Handles auth headers, token refresh on 401, idempotency keys, and envelope unwrapping.

const env = (import.meta as ImportMeta & { env?: ImportMetaEnv }).env;

/**
 * Base URLs.
 *
 * - Authenticated calls go through the same-origin BFF proxy (/api/proxy), which
 *   injects the bearer from an httpOnly cookie and refreshes on 401. Tokens are
 *   never held in browser JS (previously they sat in localStorage — an XSS risk).
 * - Public calls (auth:false, e.g. /campuses, password-reset) go straight to the
 *   backend; they need no token.
 * - Paths already starting with /api/ are same-origin BFF routes.
 */
const PROXY_BASE = '/api/proxy';
const BASE_URL: string =
  env?.VITE_API_BASE_URL?.replace(/\/$/, '') ??
  'https://mealdirectbackend.onrender.com/v1';

function baseFor(path: string, auth: boolean): string {
  if (path.startsWith('/api/')) return '';
  return auth ? PROXY_BASE : BASE_URL;
}

/** Ask the BFF whether a session cookie is present. */
export async function getSession(): Promise<{ authed: boolean }> {
  try {
    const res = await fetch('/api/auth/session', { credentials: 'include' });
    const json = await res.json().catch(() => null);
    return { authed: !!json?.data?.authed };
  } catch {
    return { authed: false };
  }
}

// Some backend error responses carry a useless message — an empty string, or the
// literal "{}"/"null" produced by JSON.stringify-ing an error object with no
// enumerable fields (e.g. a Supabase AuthError). Treat those as "no message".
function cleanMessage(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  if (['{}', '[]', 'null', 'undefined', '""'].includes(trimmed)) return undefined;
  return trimmed;
}

// Human-readable fallbacks keyed by error code, used when the backend message is
// missing or garbage. Kept generic so they read sensibly across screens.
const DEFAULT_MESSAGES: Record<string, string> = {
  AUTH_FAILED: 'Your email or password was not accepted. Double-check your details and try again.',
  FORBIDDEN: "You don't have permission to do that.",
  NOT_FOUND: 'We could not find what you were looking for.',
  RATE_LIMITED: 'Too many attempts. Please wait a moment and try again.',
  NETWORK_ERROR: 'Network request failed. Check your connection.',
};

/** Pick the best message: real backend message → code default → status text → generic. */
function resolveMessage(rawMessage: unknown, code: string, statusText?: string): string {
  return cleanMessage(rawMessage) ?? DEFAULT_MESSAGES[code] ?? cleanMessage(statusText) ?? 'Request failed.';
}

export class ApiError extends Error {
  code: string;
  status: number;
  requestId?: string;
  details?: unknown;
  constructor(status: number, code: string, message: string, requestId?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.requestId = requestId;
    this.details = details;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | undefined | null>;
  auth?: boolean; // default true
  idempotency?: boolean; // send an Idempotency-Key (auto for mutations)
  _retried?: boolean;
}

function buildUrl(base: string, path: string, query?: RequestOptions['query']): string {
  // base may be relative ('' or '/api/proxy'); resolve against the page origin.
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
  const url = new URL(`${base}${path}`, origin);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    }
  }
  // Same-origin calls stay relative so cookies are sent; absolute for the public API.
  return base.startsWith('http') ? url.toString() : `${url.pathname}${url.search}`;
}

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Force a session-token refresh via the BFF (rotates the httpOnly cookies).
 *  Returns true on success. Used after onboarding, where freshly-created claims
 *  may not yet be in the current access token. */
export async function refreshSession(): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/session?refresh=1', { credentials: 'include' });
    const json = await res.json().catch(() => null);
    return !!json?.data?.authed;
  } catch {
    return false;
  }
}

let onUnauthorized: (() => void) | null = null;
/** Register a callback fired when refresh fails and the session is dead. */
export function setUnauthorizedHandler(fn: () => void): void {
  onUnauthorized = fn;
}

interface RawResponse {
  status: number;
  /** Parsed JSON body, or null when empty/unparseable (e.g. 204 or an HTML error page). */
  json: any;
}

/** Shared core: build the request, refresh-and-retry once on 401, safe-parse the body,
 *  and throw a normalized ApiError on non-2xx. Both apiRequest and apiList build on this. */
async function rawRequest(path: string, opts: RequestOptions = {}): Promise<RawResponse> {
  const { method = 'GET', body, query, auth = true, idempotency } = opts;
  const base = baseFor(path, auth);
  const sameOrigin = base === PROXY_BASE || base === '';
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  // The bearer is injected server-side by the proxy from an httpOnly cookie.
  if ((idempotency ?? method !== 'GET')) headers['Idempotency-Key'] = uuid();

  let res: Response;
  try {
    res = await fetch(buildUrl(base, path, query), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: sameOrigin ? 'include' : 'same-origin',
    });
  } catch (e) {
    throw new ApiError(0, 'NETWORK_ERROR', 'Network request failed. Check your connection.', undefined, e);
  }

  // The proxy already refreshes on 401 and only surfaces a 401 when the refresh
  // itself failed. Treat that as a dead session.
  if (res.status === 401 && auth) {
    onUnauthorized?.();
  }

  let json: any = null;
  if (res.status !== 204) {
    const text = await res.text();
    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }
    }
  }

  if (!res.ok) {
    const err = json?.error ?? {};
    const code = err.code ?? `HTTP_${res.status}`;
    throw new ApiError(
      res.status,
      code,
      resolveMessage(err.message, code, res.statusText),
      err.requestId ?? json?.requestId,
      err.details,
    );
  }

  return { status: res.status, json };
}

export async function apiRequest<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { json, status } = await rawRequest(path, opts);
  if (status === 204) return undefined as T;
  // Unwrap success envelope { data, ... } when present, else return raw.
  if (json && typeof json === 'object' && 'data' in json) return json.data as T;
  return json as T;
}

/** List variant that also returns pagination meta when present. */
export async function apiList<T = unknown>(
  path: string,
  opts: RequestOptions = {},
): Promise<{ data: T[]; pagination?: { hasMore: boolean; limit: number; nextCursor?: string } }> {
  const { json } = await rawRequest(path, opts);
  return { data: json?.data ?? [], pagination: json?.pagination };
}

export { BASE_URL };
