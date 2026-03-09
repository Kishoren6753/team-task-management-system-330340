import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { createBackend } from "../../api/backend";

const TOKEN_KEY = "ttm_token";
const USER_KEY = "ttm_user";

/**
 * @typedef {Object} AuthUser
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string} [role]
 */

/**
 * @typedef {Object} AuthState
 * @property {boolean} isAuthenticated
 * @property {string|null} token
 * @property {AuthUser|null} user
 * @property {boolean} loading
 * @property {(email:string,password:string)=>Promise<void>} login
 * @property {(name:string,email:string,password:string)=>Promise<void>} register
 * @property {()=>Promise<void>} logout
 * @property {(partial: Partial<AuthUser>)=>Promise<AuthUser>} updateProfile
 * @property {()=>string|null} getToken
 * @property {ReturnType<typeof createBackend>} backend
 */

const AuthContext = createContext(/** @type {AuthState|null} */ (null));

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

// PUBLIC_INTERFACE
export function AuthProvider({ children }) {
  /** Auth provider: single canonical source of truth for token+user. */
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? safeJsonParse(raw) : null;
  });
  const [loading, setLoading] = useState(false);

  const getToken = useCallback(() => token, [token]);
  const backend = useMemo(() => createBackend(getToken), [getToken]);

  const setSession = useCallback((newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    if (newToken) localStorage.setItem(TOKEN_KEY, newToken);
    else localStorage.removeItem(TOKEN_KEY);

    if (newUser) localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    else localStorage.removeItem(USER_KEY);
  }, []);

  const login = useCallback(
    async (email, password) => {
      setLoading(true);
      try {
        const res = await backend.auth.login({ email, password });
        const tokenFromRes = res?.token || res?.accessToken || null;
        const userFromRes = res?.user || null;

        if (!tokenFromRes || !userFromRes) {
          throw { message: "Invalid login response from server", status: 500, data: res };
        }
        setSession(tokenFromRes, userFromRes);
      } finally {
        setLoading(false);
      }
    },
    [backend, setSession]
  );

  const register = useCallback(
    async (name, email, password) => {
      setLoading(true);
      try {
        const res = await backend.auth.register({ name, email, password });
        const tokenFromRes = res?.token || res?.accessToken || null;
        const userFromRes = res?.user || null;

        if (!tokenFromRes || !userFromRes) {
          throw { message: "Invalid register response from server", status: 500, data: res };
        }
        setSession(tokenFromRes, userFromRes);
      } finally {
        setLoading(false);
      }
    },
    [backend, setSession]
  );

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await backend.auth.logout();
      setSession(null, null);
    } finally {
      setLoading(false);
    }
  }, [backend, setSession]);

  const updateProfile = useCallback(
    async (partial) => {
      const updated = await backend.users.updateProfile(partial);
      setSession(token, updated);
      return updated;
    },
    [backend, token, setSession]
  );

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(token),
      token,
      user,
      loading,
      login,
      register,
      logout,
      updateProfile,
      getToken,
      backend
    }),
    [token, user, loading, login, register, logout, updateProfile, getToken, backend]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// PUBLIC_INTERFACE
export function useAuth() {
  /** Hook to access auth state and flows. */
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
