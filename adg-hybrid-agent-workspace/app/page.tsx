"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { User } from "@/lib/types";

const SIMULATION_PIN = "1234";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((d) => {
        const list: User[] = d.users ?? [];
        setUsers(list);
        if (list.length) setSelectedUserId(list[0].userId);
      })
      .finally(() => setLoading(false));
  }, []);

  function authenticate() {
    const user = users.find((u) => u.userId === selectedUserId);
    if (!user) {
      setError("Select an agent profile first.");
      return;
    }
    if (pin !== SIMULATION_PIN) {
      setError(`Incorrect PIN. This simulation's PIN is ${SIMULATION_PIN}.`);
      return;
    }
    setError(null);
    login(user);
    router.replace("/interactions");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 px-4">
      <div className="card w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-brand-700 flex items-center justify-center mb-4">
            <svg viewBox="0 0 24 24" className="h-8 w-8 text-gold-300" fill="currentColor">
              <path d="M12 2l4 4-4 4-4-4 4-4zm0 8l4 4-4 4-4-4 4-4zm-8-4l4 4-4 4-4-4 4-4zm16 0l4 4-4 4-4-4 4-4z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-stone-900">ADG Unified Hybrid Agent Workspace</h1>
          <p className="text-stone-500 mt-1 text-sm">Agent Portal Login</p>
        </div>

        {loading ? (
          <p className="text-center text-stone-400">Loading agent directory…</p>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Select Agent Profile</label>
              <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} className="input">
                {users.map((u) => (
                  <option key={u.userId} value={u.userId}>
                    {u.name} ({u.userId} — {u.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Enter Security PIN</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && authenticate()}
                className="input tracking-[0.5em] text-center"
                placeholder="••••"
              />
              <p className="text-xs text-stone-400 mt-1">Simulation PIN is: {SIMULATION_PIN}</p>
            </div>

            {error && <p className="text-sm text-rose-600">{error}</p>}

            <button className="btn-primary w-full" onClick={authenticate}>
              Authenticate Session
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
