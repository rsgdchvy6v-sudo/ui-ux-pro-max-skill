"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { User } from "@/lib/types";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((d) => setUsers(d.users ?? []))
      .finally(() => setLoading(false));
  }, []);

  function pick(user: User) {
    login(user);
    router.replace("/interactions");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 px-4">
      <div className="card w-full max-w-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">ADG Unified Hybrid Agent Workspace</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Demo login — pick a user. No password required.
          </p>
        </div>

        {loading ? (
          <p className="text-center text-slate-400">Loading users…</p>
        ) : (
          <div className="grid sm:grid-cols-3 gap-4">
            {users.map((u) => (
              <button
                key={u.userId}
                onClick={() => pick(u)}
                className="card p-5 text-left hover:border-brand-400 hover:shadow-md transition-all group"
              >
                <div className="h-10 w-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold mb-3 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                  {u.name
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <div className="font-semibold text-slate-900">{u.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">{u.userId}</div>
                <div className="mt-3 flex items-center gap-2">
                  <span
                    className={`pill ${
                      u.role === "MANAGER" ? "bg-violet-100 text-violet-700" : "bg-brand-100 text-brand-700"
                    }`}
                  >
                    {u.role}
                  </span>
                  <span className="pill bg-emerald-100 text-emerald-700">{u.presence}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
