import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { clearTokens, getAccessToken, setTokens, setUnauthorizedHandler } from './api';
import { getRiderProfile, riderLogin, riderSignup, logout as apiLogout, setRiderAvailability } from './endpoints';
import type { RiderProfile } from '../types/api';

interface AuthContextValue {
  profile: RiderProfile | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<{ needsVerification: boolean; message?: string }>;
  logout: () => Promise<void>;
  setProfile: (p: RiderProfile) => void;
  toggleAvailability: (available: boolean) => Promise<RiderProfile>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<RiderProfile | null>(null);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

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
      if (!getAccessToken()) {
        setStatus('unauthenticated');
        return;
      }
      try {
        const p = await getRiderProfile();
        if (alive) {
          setProfile(p);
          setStatus('authenticated');
        }
      } catch {
        if (alive) finishLogout();
      }
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
    () => ({ profile, status, login, signup, logout, setProfile, toggleAvailability }),
    [profile, status, login, signup, logout, toggleAvailability],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
