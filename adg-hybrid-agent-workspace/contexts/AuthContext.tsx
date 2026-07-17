"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "@/lib/types";

interface AuthState {
  currentUser: User | null;
  viewAsAgent: boolean;
  loading: boolean;
  login: (user: User) => void;
  logout: () => void;
  setViewAsAgent: (v: boolean) => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const STORAGE_KEY = "adg_current_user";
const VIEW_AS_KEY = "adg_view_as_agent";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [viewAsAgent, setViewAsAgentState] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setCurrentUser(JSON.parse(raw));
      const va = window.localStorage.getItem(VIEW_AS_KEY);
      if (va) setViewAsAgentState(va === "true");
    } finally {
      setLoading(false);
    }
  }, []);

  function login(user: User) {
    setCurrentUser(user);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }

  function logout() {
    setCurrentUser(null);
    setViewAsAgentState(false);
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(VIEW_AS_KEY);
  }

  function setViewAsAgent(v: boolean) {
    setViewAsAgentState(v);
    window.localStorage.setItem(VIEW_AS_KEY, String(v));
  }

  return (
    <AuthContext.Provider value={{ currentUser, viewAsAgent, loading, login, logout, setViewAsAgent }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
