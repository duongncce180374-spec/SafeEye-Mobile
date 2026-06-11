import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { login as loginRequest, register as registerRequest } from '../api/auth';
import { getCurrentUser, updateUser, updateFcmToken } from '../api/users';
import type { AuthResult, AuthUser } from '../types/auth';

type AuthState = {
  ready: boolean;
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateUserProfile: (name?: string, password?: string) => Promise<void>;
  updateUserFcmToken: (fcmToken: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  useEffect(() => {
    setReady(true);
  }, []);

  async function persist(result: AuthResult) {
    setAccessToken(result.accessToken);
    setRefreshToken(result.refreshToken);
    setUser(result.user);
    setReady(true);
  }

  async function refreshProfile() {
    const token = accessToken;
    if (!token) return;
    const profile = await getCurrentUser(token);
    setUser({
      id: profile.id,
      name: profile.name,
      email: profile.email,
    });
  }

  async function clear() {
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
  }

  const value = useMemo<AuthState>(() => ({
    ready,
    user,
    accessToken,
    refreshToken,
    isAuthenticated: Boolean(accessToken && user),
    login: async (email, password) => {
      const result = await loginRequest({ email, password });
      await persist(result);
      await getCurrentUser(result.accessToken).then((profile) =>
        setUser({
          id: profile.id,
          name: profile.name,
          email: profile.email,
        }),
      );
    },
    register: async (name, email, password) => {
      const result = await registerRequest({ name, email, password });
      await persist(result);
      await getCurrentUser(result.accessToken).then((profile) =>
        setUser({
          id: profile.id,
          name: profile.name,
          email: profile.email,
        }),
      );
    },
    refreshProfile,
    updateUserProfile: async (name, password) => {
      const token = accessToken;
      if (!token) throw new Error('Not authenticated');
      const payload: Record<string, string> = {};
      if (name !== undefined) payload.name = name;
      if (password !== undefined) payload.password = password;
      const profile = await updateUser(token, payload);
      setUser({
        id: profile.id,
        name: profile.name,
        email: profile.email,
      });
    },
    updateUserFcmToken: async (fcmToken: string) => {
      const token = accessToken;
      if (!token) throw new Error('Not authenticated');
      await updateFcmToken(token, fcmToken);
    },
    logout: clear,
  }), [accessToken, ready, refreshProfile, refreshToken, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider.');
  }
  return context;
}
