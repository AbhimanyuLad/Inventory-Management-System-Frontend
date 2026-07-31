import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, clearAuth, getStoredAuth, persistAuth } from '@/lib/api';
import type { AuthUser, LoginPayload, RegisterPayload } from '@/types';

interface AuthContextValue {
  user: AuthUser | null;
  isAdmin: boolean;
  loading: boolean;
  login: (p: LoginPayload) => Promise<void>;
  register: (p: RegisterPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function parseLoginResponse(data: Record<string, unknown>): AuthUser {
  const token =
    (data.token as string) ||
    (data.jwt as string) ||
    (data.accessToken as string) ||
    (data.authToken as string) ||
    '';
  const role = ((data.role as string) || 'USER').toUpperCase() as AuthUser['role'];
  return {
    username: (data.username as string) || '',
    email: (data.email as string) || '',
    role: role.includes('ADMIN') ? 'ADMIN' : 'USER',
    token,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredAuth());
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (p: LoginPayload) => {
    setLoading(true);
    try {
      const data = await api.login(p);
      const parsed = parseLoginResponse(data);
      if (!parsed.token) throw new Error('Login response did not include a token.');
      persistAuth(parsed);
      setUser(parsed);
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (p: RegisterPayload) => {
    setLoading(true);
    try {
      await api.register(p);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAdmin: user?.role === 'ADMIN', loading, login, register, logout }),
    [user, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function useToast() {
  // placeholder kept for compatibility if needed elsewhere
  return { toast: (_msg: string) => {} };
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false,
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return isMobile;
}
