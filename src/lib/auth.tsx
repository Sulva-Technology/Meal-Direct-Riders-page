import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ApiError, clearTokens, getAccessToken, refreshSession, setTokens, setUnauthorizedHandler } from './api';
import {
  getMeSession,
  getRiderProfile,
  riderLogin,
  riderSignup,
  logout as apiLogout,
  setRiderAvailability,
  completeOnboarding as apiCompleteOnboarding,
} from './endpoints';
import type { RiderProfile, CompleteOnboardingBody } from '../types/api';

/** A 404 / NOT_FOUND from /rider/profile means the rider is authenticated but
 *  hasn't created a profile yet — they need onboarding, not a logout. */
function isMissingProfile(err: unknown): boolean {
  return err instanceof ApiError && (err.status === 404 || err.code === 'NOT_FOUND');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function getRiderProfileFromSession(): Promise<RiderProfile | null> {
  const session = await getMeSession();
  return session.riderProfiles[0] ?? null;
}

interface AuthContextValue {
  profile: RiderProfile | null;
  status: 'loading' | 'authenticated' | 'onboarding' | 'unauthenticated';
  // One-shot message from the email-confirmation callback (success or error), shown on the login screen.
  authNotice: { message: string; type: 'success' | 'error' } | null;
  clearAuthNotice: () => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<{ needsVerification: boolean; message?: string }>;
  completeOnboarding: (body: CompleteOnboardingBody) => Promise<void>;
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
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'onboarding' | 'unauthenticated'>('loading');
  const [authNotice, setAuthNotice] = useState<AuthContextValue['authNotice']>(null);
  const clearAuthNotice = useCallback(() => setAuthNotice(null), []);

  const finishLogout = useCallback(() => {
    clearTokens();
    setProfile(null);
    setStatus('unauthenticated');
  }, []);

  // Load the rider profile and settle into the right state: authenticated when it
  // exists, onboarding when the rider hasn't created one yet, logged-out otherwise.
  const loadProfileOrOnboard = useCallback(async (): Promise<void> => {
    try {
      const p = await getRiderProfile();
      setProfile(p);
      setStatus('authenticated');
    } catch (err) {
      if (isMissingProfile(err)) {
        setStatus('onboarding');
      } else {
        finishLogout();
      }
    }
  }, [finishLogout]);

  // When refresh fails anywhere, drop to login.
  useEffect(() => {
    setUnauthorizedHandler(finishLogout);
  }, [finishLogout]);

  // Bootstrap an existing session.
  useEffect(() => {
    (async () => {
      const { error } = consumeAuthCallback();
      if (error) {
        setAuthNotice({ message: error, type: 'error' });
        // Tokens may have been stored before the error path; only verify if present.
      }
      if (getAccessToken()) {
        // Either a returning session or freshly-stored callback tokens — verify against the API.
        await loadProfileOrOnboard();
      } else {
        setStatus('unauthenticated');
      }
    })();
  }, [loadProfileOrOnboard]);

  const afterAuth = useCallback(
    async (tokens: { accessToken?: string; refreshToken?: string }) => {
      setTokens(tokens);
      await loadProfileOrOnboard();
    },
    [loadProfileOrOnboard],
  );

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

  const completeOnboarding = useCallback(
    async (body: CompleteOnboardingBody) => {
      await apiCompleteOnboarding(body);
      // The new rider claims aren't in the current access token yet; refresh once so the
      // follow-up reads see them. /rider/profile can be stricter for newly-created or
      // pending riders, so fall back to /me, which includes riderProfiles for the session.
      await refreshSession();
      let lastMissingProfile: unknown;
      for (let attempt = 0; attempt < 4; attempt += 1) {
        try {
          const p = await getRiderProfile();
          setProfile(p);
          setStatus('authenticated');
          return;
        } catch (err) {
          if (!isMissingProfile(err)) throw err;
          lastMissingProfile = err;
          const sessionProfile = await getRiderProfileFromSession();
          if (sessionProfile) {
            setProfile(sessionProfile);
            setStatus('authenticated');
            return;
          }
          await sleep(400 * (attempt + 1));
        }
      }
      setStatus('onboarding');
      throw lastMissingProfile;
    },
    [],
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
    () => ({
      profile,
      status,
      authNotice,
      clearAuthNotice,
      login,
      signup,
      completeOnboarding,
      logout,
      setProfile,
      toggleAvailability,
    }),
    [profile, status, authNotice, clearAuthNotice, login, signup, completeOnboarding, logout, toggleAvailability],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
