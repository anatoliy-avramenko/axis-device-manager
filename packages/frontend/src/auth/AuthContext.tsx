import React, { createContext, useContext, useState } from "react";

const AUTH_TOKEN_KEY = "axis.authToken";

// Standalone getter so client.ts can read the current token without importing
// the whole context (avoids a circular dependency: client ← auth ← client).
export function getStoredToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

interface AuthContextValue {
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

interface AuthProviderProps {
  children: React.ReactNode;
  // Called after logout so the parent can recreate the urql client, which
  // flushes its document cache. Prevents a user from seeing a previous
  // user's cached data after switching accounts.
  onAuthReset?: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children, onAuthReset }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(() => getStoredToken());

  function login(newToken: string) {
    localStorage.setItem(AUTH_TOKEN_KEY, newToken);
    setToken(newToken);
  }

  function logout() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setToken(null);
    onAuthReset?.();
  }

  return (
    <AuthContext.Provider
      // !!token (not token !== null) so an empty string doesn't count as
      // authenticated and trap the user on a broken CameraList screen.
      value={{ token, isAuthenticated: !!token, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
