"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "@/lib/types";

interface AuthState {
  currentUser: User | null;
  loading: boolean;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const STORAGE_KEY = "adg_current_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setCurrentUser(JSON.parse(raw));
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
    window.localStorage.removeItem(STORAGE_KEY);
  }

  return <AuthContext.Provider value={{ currentUser, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
