import { createContext, useContext, useState, useEffect, useCallback } from "react";
import * as authApi from "../api/auth.js";
import { getToken, setToken, getLastActivity, updateLastActivity } from "../api/client.js";

const AuthContext = createContext(null);

// Auto-logout after 30 minutes of inactivity
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  // Restore session on app start
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    // Check if session has already expired due to inactivity
    const timeInactive = Date.now() - getLastActivity();
    if (timeInactive > INACTIVITY_TIMEOUT_MS) {
      logout();
      setIsLoading(false);
      return;
    }

    authApi
      .fetchMe()
      .then(setUser)
      .catch((err) => {
        // Only clear token if server explicitly rejected it with 401/403
        if (err.status === 401 || err.status === 403) {
          logout();
        }
      })
      .finally(() => setIsLoading(false));
  }, [logout]);

  // Listen for global 401 unauthorized events
  useEffect(() => {
    function handleUnauthorized() {
      logout();
    }
    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, [logout]);

  // Track user activity & auto-logout on inactivity
  useEffect(() => {
    if (!user) return;

    let lastUpdate = 0;
    function handleUserActivity() {
      const now = Date.now();
      // Throttle activity updates to at most once every 10 seconds
      if (now - lastUpdate > 10000) {
        lastUpdate = now;
        updateLastActivity();
      }
    }

    const activityEvents = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    activityEvents.forEach((evt) => window.addEventListener(evt, handleUserActivity, { passive: true }));

    // Periodically check for inactivity every 15 seconds
    const interval = setInterval(() => {
      const inactiveDuration = Date.now() - getLastActivity();
      if (inactiveDuration > INACTIVITY_TIMEOUT_MS) {
        logout();
      }
    }, 15000);

    return () => {
      activityEvents.forEach((evt) => window.removeEventListener(evt, handleUserActivity));
      clearInterval(interval);
    };
  }, [user, logout]);

  async function login(email, password) {
    const { token, user } = await authApi.login({ email, password });
    setToken(token);
    setUser(user);
    updateLastActivity();
  }

  async function register(name, email, password) {
    const { token, user } = await authApi.register({ name, email, password });
    setToken(token);
    setUser(user);
    updateLastActivity();
  }

  function updateUser(patch) {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  const value = { user, isLoading, isAuthenticated: !!user, login, register, logout, updateUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
