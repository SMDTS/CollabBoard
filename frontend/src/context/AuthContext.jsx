import { createContext, useContext, useState, useEffect } from "react";
import * as authApi from "../api/auth.js";
import { getToken, setToken } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    const token = getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    authApi
      .fetchMe()
      .then(setUser)
      .catch(() => setToken(null)) // token expired/invalid — clear it
      .finally(() => setIsLoading(false));
  }, []);

  async function login(email, password) {
    const { token, user } = await authApi.login({ email, password });
    setToken(token);
    setUser(user);
  }

  async function register(name, email, password) {
    const { token, user } = await authApi.register({ name, email, password });
    setToken(token);
    setUser(user);
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  // Lets other parts of the app (e.g. Settings saving a preference) merge
  // a partial update into the shared user object without a full re-fetch.
  function updateUser(patch) {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  const value = { user, isLoading, isAuthenticated: !!user, login, register, logout, updateUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
