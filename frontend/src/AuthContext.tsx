import { createContext, useContext, useState, ReactNode } from "react";
import {
  AuthResponse,
  AuthUser,
  clearAuth,
  getStoredUser,
  getToken,
  storeAuth,
} from "./auth";

interface AuthState {
  user: AuthUser | null;
  authenticated: boolean;
  setSession: (r: AuthResponse) => void;
  logout: () => void;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [token, setToken] = useState<string | null>(() => getToken());

  function setSession(r: AuthResponse) {
    storeAuth(r);
    setUser(r.user ?? null);
    setToken(r.token);
  }

  function logout() {
    clearAuth();
    setUser(null);
    setToken(null);
  }

  return (
    <Ctx.Provider value={{ user, authenticated: !!token, setSession, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth AuthProvider ichida ishlatilishi kerak");
  return v;
}
