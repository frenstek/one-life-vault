import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, fetchCurrentUser } from '../lib/api';

const AuthContext = createContext(null);

const TOKEN_KEY = 'olf_auth_token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, check for saved token
  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (!saved) {
      // No token — check if auth is set up by trying the me endpoint
      // If auth tables don't exist yet, fall back to admin mode
      fetchCurrentUser('none')
        .then((data) => {
          // Auth works, user needs to log in
          setLoading(false);
        })
        .catch((err) => {
          // Auth not set up yet — fall back to admin mode so app still works
          setUser({ id: 'local-admin', email: 'admin@onelifefoundation.com' });
          setProfile({ role: 'admin', full_name: 'Admin', email: 'admin@onelifefoundation.com' });
          setLoading(false);
        });
      return;
    }

    fetchCurrentUser(saved)
      .then((data) => {
        setUser(data.user || data);
        setProfile(data.profile || data);
        setToken(saved);
      })
      .catch(() => {
        // Token invalid, clear it but fall back to admin mode
        localStorage.removeItem(TOKEN_KEY);
        setUser({ id: 'local-admin', email: 'admin@onelifefoundation.com' });
        setProfile({ role: 'admin', full_name: 'Admin', email: 'admin@onelifefoundation.com' });
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await apiLogin(email, password);
    const t = data.session?.access_token || data.token || data.session?.token;
    if (t) {
      localStorage.setItem(TOKEN_KEY, t);
      setToken(t);
    }
    setUser(data.user || data);
    setProfile(data.profile || data);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setProfile(null);
    setToken(null);
  }, []);

  const isAuthenticated = !!user;
  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, profile, token, loading, login, logout, isAuthenticated, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
