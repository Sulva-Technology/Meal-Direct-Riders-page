// Thin fetch client for the Meal Direct backend.
// Handles auth headers, token refresh on 401, idempotency keys, and envelope unwrapping.

import type { AuthTokens } from '../types/api';

const env = (import.meta as ImportMeta & { env?: ImportMetaEnv }).env;
const BASE_URL: string =
  env?.VITE_API_BASE_URL?.replace(/\/$/, '') ??
  'https://mealdirectbackend.onrender.com/v1';

const ACCESS_KEY = 'md_access_token';
const REFRESH_KEY = 'md_refresh_token';

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}
export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}
export function setTokens(tokens: Pick<AuthTokens, 'accessToken' | 'refreshToken'>): void {
  if (tokens.accessToken) localStorage.setItem(ACCESS_KEY, tokens.accessToken);
  if (tokens.refreshToken) localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
}
export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
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

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = new URL(BASE_URL + path);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Exchange the stored refresh token for fresh tokens. Returns true on success. */
async function tryRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  try {
    const res = await fetch(buildUrl('/auth/refresh'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const json = await res.json();
    const data: AuthTokens = json.data ?? json;
    if (data.accessToken) {
      setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/** Force a session-token refresh. Returns true on success. Used after onboarding,
 *  where freshly-created claims may not yet be in the current access token. */
export function refreshSession(): Promise<boolean> {
  return tryRefresh();
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
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  if ((idempotency ?? method !== 'GET')) headers['Idempotency-Key'] = uuid();

  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new ApiError(0, 'NETWORK_ERROR', 'Network request failed. Check your connection.', undefined, e);
  }

  // Auto-refresh once on 401, then retry the original request (the _retried guard caps it).
  if (res.status === 401 && auth && !opts._retried) {
    const refreshed = await tryRefresh();
    if (refreshed) return rawRequest(path, { ...opts, _retried: true });
    clearTokens();
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
