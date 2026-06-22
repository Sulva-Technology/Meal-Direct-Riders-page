import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { clearTokens, getAccessToken, setTokens, setUnauthorizedHandler } from './api';
import { getRiderProfile, riderLogin, riderSignup, logout as apiLogout, setRiderAvailability } from './endpoints';
import type { RiderProfile } from '../types/api';

interface AuthContextValue {
  profile: RiderProfile | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  // One-shot message from the email-confirmation callback (success or error), shown on the login screen.
  authNotice: { message: string; type: 'success' | 'error' } | null;
  clearAuthNotice: () => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<{ needsVerification: boolean; message?: string }>;
  logout: () => Promise<void>;
  setProfile: (p: RiderProfile) => void;
  toggleAvailability: (available: boolean) => Promise<RiderProfile>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Supabase redirects email confirmation / password reset back to /auth/callback with
// the session in the URL hash (#access_token=...&refresh_token=...&type=signup), or an
// #error_description=... on failure. Consume it once: store the tokens, then scrub the
// hash + path so the token never lingers in the address bar and a refresh can't replay it.
function consumeAuthCallback(): { error?: string } {
  const onCallback = window.location.pathname.startsWith('/auth/callback');
  const rawHash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
  const params = new URLSearchParams(rawHash);
  const accessToken = params.get('access_token') ?? undefined;
  const refreshToken = params.get('refresh_token') ?? undefined;
  const error = params.get('error_description') ?? params.get('error') ?? undefined;

  if (!onCallback && !accessToken && !error) return {};

  window.history.replaceState(null, '', '/');

  if (error) return { error };
  if (accessToken) setTokens({ accessToken, refreshToken });
  return {};
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<RiderProfile | null>(null);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const [authNotice, setAuthNotice] = useState<AuthContextValue['authNotice']>(null);
  const clearAuthNotice = useCallback(() => setAuthNotice(null), []);

  const finishLogout = useCallback(() => {
    clearTokens();
    setProfile(null);
    setStatus('unauthenticated');
  }, []);

  // When refresh fails anywhere, drop to login.
  useEffect(() => {
    setUnauthorizedHandler(finishLogout);
  }, [finishLogout]);

  // Bootstrap an existing session.
  useEffect(() => {
    let alive = true;
    (async () => {
      const { error } = consumeAuthCallback();
      if (error) {
        if (alive) setAuthNotice({ message: error, type: 'error' });
      } else if (getAccessToken()) {
        // Either a returning session or freshly-stored callback tokens — verify against the API.
        try {
          const p = await getRiderProfile();
          if (alive) {
            setProfile(p);
            setStatus('authenticated');
          }
          return;
        } catch {
          if (alive) finishLogout();
          return;
        }
      }
      if (alive) setStatus('unauthenticated');
    })();
    return () => {
      alive = false;
    };
  }, [finishLogout]);

  const afterAuth = useCallback(async (tokens: { accessToken?: string; refreshToken?: string }) => {
    setTokens(tokens);
    const p = await getRiderProfile();
    setProfile(p);
    setStatus('authenticated');
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const tokens = await riderLogin(email, password);
      await afterAuth(tokens);
    },
    [afterAuth],
  );

  const signup = useCallback(
    async (email: string, password: string) => {
      const tokens = await riderSignup(email, password);
      // Some backends auto-confirm and return a session; others require email verification.
      if (tokens.accessToken) {
        await afterAuth(tokens);
        return { needsVerification: false, message: tokens.message };
      }
      return { needsVerification: true, message: tokens.message };
    },
    [afterAuth],
  );

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      /* ignore network errors on logout */
    }
    finishLogout();
  }, [finishLogout]);

  const toggleAvailability = useCallback(async (available: boolean) => {
    const updated = await setRiderAvailability(available);
    setProfile(updated);
    return updated;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ profile, status, authNotice, clearAuthNotice, login, signup, logout, setProfile, toggleAvailability }),
    [profile, status, authNotice, clearAuthNotice, login, signup, logout, toggleAvailability],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
