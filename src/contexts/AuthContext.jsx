import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { login as apiLogin, fetchCurrentUser, refreshToken as apiRefresh } from '../lib/api';

const AuthContext = createContext(null);

const TOKEN_KEY = 'olf_auth_token';
const REFRESH_KEY = 'olf_refresh_token';
const EXPIRES_KEY = 'olf_token_expires';

// Refresh 5 minutes before expiry
const REFRESH_BUFFER_MS = 5 * 60 * 1000;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const refreshTimer = useRef(null);

  // ─── Save session to localStorage ────────────────────────────────────────
  function saveSession(accessToken, refreshTk, expiresAt) {
    localStorage.setItem(TOKEN_KEY, accessToken);
    if (refreshTk) localStorage.setItem(REFRESH_KEY, refreshTk);
    if (expiresAt) localStorage.setItem(EXPIRES_KEY, String(expiresAt));
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(EXPIRES_KEY);
  }

  // ─── Schedule token refresh ──────────────────────────────────────────────
  function scheduleRefresh(expiresAt) {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    if (!expiresAt) return;

    const expiresMs = expiresAt * 1000; // Unix seconds → ms
    const now = Date.now();
    const delay = Math.max(expiresMs - now - REFRESH_BUFFER_MS, 10_000); // At least 10s

    refreshTimer.current = setTimeout(async () => {
      const rt = localStorage.getItem(REFRESH_KEY);
      if (!rt) return;

      try {
        const data = await apiRefresh(rt);
        const t = data.session?.access_token;
        const newRt = data.session?.refresh_token;
        const newExp = data.session?.expires_at;

        if (t) {
          saveSession(t, newRt, newExp);
          setToken(t);
          setUser(data.user || user);
          setProfile(data.profile || profile);
          scheduleRefresh(newExp);
        }
      } catch {
        // Refresh failed — session truly expired, log out
        clearSession();
        setUser(null);
        setProfile(null);
        setToken(null);
      }
    }, delay);
  }

  // ─── On mount: restore session ───────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (!saved) {
      setLoading(false);
      return;
    }

    const savedExpires = localStorage.getItem(EXPIRES_KEY);
    const now = Date.now() / 1000;

    // If token is expired but we have a refresh token, refresh first
    if (savedExpires && Number(savedExpires) < now) {
      const rt = localStorage.getItem(REFRESH_KEY);
      if (rt) {
        apiRefresh(rt)
          .then((data) => {
            const t = data.session?.access_token;
            const newRt = data.session?.refresh_token;
            const newExp = data.session?.expires_at;
            if (t) {
              saveSession(t, newRt, newExp);
              setToken(t);
              setUser(data.user || data);
              setProfile(data.profile || data);
              scheduleRefresh(newExp);
            }
          })
          .catch(() => {
            clearSession();
          })
          .finally(() => setLoading(false));
        return;
      }
      // No refresh token and expired — clear
      clearSession();
      setLoading(false);
      return;
    }

    // Token still valid — validate it
    fetchCurrentUser(saved)
      .then((data) => {
        setUser(data.user || data);
        setProfile(data.profile || data);
        setToken(saved);
        if (savedExpires) scheduleRefresh(Number(savedExpires));
      })
      .catch(() => {
        // Token invalid — try refresh
        const rt = localStorage.getItem(REFRESH_KEY);
        if (rt) {
          return apiRefresh(rt)
            .then((data) => {
              const t = data.session?.access_token;
              const newRt = data.session?.refresh_token;
              const newExp = data.session?.expires_at;
              if (t) {
                saveSession(t, newRt, newExp);
                setToken(t);
                setUser(data.user || data);
                setProfile(data.profile || data);
                scheduleRefresh(newExp);
              }
            })
            .catch(() => {
              clearSession();
            });
        }
        clearSession();
      })
      .finally(() => setLoading(false));

    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, []);

  // ─── Login ───────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const data = await apiLogin(email, password);
    const t = data.session?.access_token || data.token || data.session?.token;
    const rt = data.session?.refresh_token;
    const exp = data.session?.expires_at;

    if (t) {
      saveSession(t, rt, exp);
      setToken(t);
      if (exp) scheduleRefresh(exp);
    }
    setUser(data.user || data);
    setProfile(data.profile || data);
    return data;
  }, []);

  // ─── Logout ──────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    clearSession();
    setUser(null);
    setProfile(null);
    setToken(null);
  }, []);

  const isAuthenticated = !!user;
  const isOwner = profile?.role === 'owner';
  const isAdmin = profile?.role === 'admin' || profile?.role === 'owner';
  const isManager = profile?.role === 'manager';
  const isStaff = profile?.role === 'staff';
  const userRole = profile?.role || 'staff';

  const hasRole = (allowedRoles) => {
    if (!allowedRoles || allowedRoles.length === 0) return true;
    if (userRole === 'owner') return true; // owner has access to everything
    return allowedRoles.includes(userRole);
  };

  return (
    <AuthContext.Provider value={{ user, profile, token, loading, login, logout, isAuthenticated, isOwner, isAdmin, isManager, isStaff, userRole, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
