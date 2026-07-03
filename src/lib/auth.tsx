import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ApiError, clearTokens, getAccessToken, refreshSession, setTokens, setUnauthorizedHandler } from './api';
import {
  getMeSession,
  getRiderProfile,
  riderLogin,
  riderSignup,
  logout as apiLogout,
  setRiderAvailability,
  onboardRider as apiOnboardRider,
} from './endpoints';
import { disablePushNotifications } from './pushNotifications';
import type { RiderProfile, OnboardRiderBody } from '../types/api';

/** A 404 / NOT_FOUND from /rider/profile means the rider is authenticated but
 *  hasn't created a profile yet — they need onboarding, not a logout. */
function isMissingProfile(err: unknown): boolean {
  return err instanceof ApiError && (err.status === 404 || err.code === 'NOT_FOUND');
}

function canUseSessionProfileFallback(err: unknown): boolean {
  return (
    err instanceof ApiError &&
    (err.status === 403 || err.status === 404 || err.code === 'FORBIDDEN' || err.code === 'NOT_FOUND')
  );
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
  completeOnboarding: (body: OnboardRiderBody) => Promise<void>;
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
      if (canUseSessionProfileFallback(err)) {
        const sessionProfile = await getRiderProfileFromSession();
        if (sessionProfile) {
          setProfile(sessionProfile);
          setStatus('authenticated');
          return;
        }
      }
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
    async (body: OnboardRiderBody) => {
      const { rider, tokenRefreshRequired } = await apiOnboardRider(body);
      // The fresh rider_id claim isn't in the current access token yet; refresh so the
      // follow-up reads see it (the backend flags this via tokenRefreshRequired). Even then,
      // /rider/profile can be stricter for a just-created pending rider, so fall back to /me,
      // which includes riderProfiles for the session.
      if (tokenRefreshRequired) await refreshSession();
      for (let attempt = 0; attempt < 4; attempt += 1) {
        try {
          const p = await getRiderProfile();
          setProfile(p);
          setStatus('authenticated');
          return;
        } catch (err) {
          if (!canUseSessionProfileFallback(err)) throw err;
          await sleep(400 * (attempt + 1));
          const retrySessionProfile = await getRiderProfileFromSession();
          if (retrySessionProfile) {
            setProfile(retrySessionProfile);
            setStatus('authenticated');
            return;
          }
        }
      }
      setProfile(rider);
      setStatus('authenticated');
    },
    [],
  );

  const logout = useCallback(async () => {
    // Delete the device token while the access token is still valid, before we clear it.
    await disablePushNotifications().catch(() => {});
    try {
      await apiLogout();
    } catch {
      /* ignore network errors on logout */
    }
    finishLogout();
  }, [finishLogout]);

  const toggleAvailability = useCallback(async (available: boolean) => {
    if (!profile) throw new ApiError(0, 'NO_PROFILE', 'Rider profile is not loaded.');

    const previousProfile = profile;
    setProfile({ ...profile, available });

    try {
      // The backend response carries the persisted `available` — trust it as-is.
      const updated = await setRiderAvailability(available);
      setProfile(updated);
      return updated;
    } catch (err) {
      setProfile(previousProfile);
      throw err;
    }
  }, [profile]);

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
