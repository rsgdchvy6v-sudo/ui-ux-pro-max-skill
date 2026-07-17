"use client";

import { useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

export function useApi() {
  const { currentUser } = useAuth();

  const call = useCallback(
    async (path: string, options: RequestInit = {}) => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...((options.headers as Record<string, string>) ?? {}),
      };
      if (currentUser) headers["x-user-id"] = currentUser.userId;

      const res = await fetch(path, { ...options, headers });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data && data.error) || `Request failed with status ${res.status}`);
      }
      return data;
    },
    [currentUser]
  );

  return { call, currentUser };
}
