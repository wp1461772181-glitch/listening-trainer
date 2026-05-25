import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { apiRegister, apiLogin, apiGetMe, setToken, getToken } from '../lib/api';

interface User {
  id: number;
  email: string;
}

interface AuthError {
  message: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = getToken();
    if (!savedToken) {
      setLoading(false);
      return;
    }

    apiGetMe()
      .then(({ email }) => {
        setUser({ id: 0, email }); // id not needed on frontend after auth
      })
      .catch(() => {
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      const res = await apiRegister(email, password);
      setUser({ id: 0, email: res.email });
      return { error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      return { error: { message } };
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const res = await apiLogin(email, password);
      setUser({ id: 0, email: res.email });
      return { error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      return { error: { message } };
    }
  }, []);

  const signOut = useCallback(async () => {
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
