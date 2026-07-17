"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { href: "/interactions", label: "Interactions" },
  { href: "/kiosk", label: "Kiosk" },
  { href: "/queue", label: "Queue" },
  { href: "/appointments", label: "Appointments" },
];

export default function TopBar() {
  const { currentUser, logout } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!currentUser) return null;
  const isManager = currentUser.role === "MANAGER";

  return (
    <header className="bg-brand-700 sticky top-0 z-40 shadow-sm">
      <div className="max-w-[1600px] mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <span className="font-bold text-gold-300 text-sm tracking-tight whitespace-nowrap">
            ADG Hybrid Workspace
          </span>
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                  pathname.startsWith(item.href)
                    ? "bg-brand-800 text-white"
                    : "text-brand-100 hover:bg-brand-600"
                }`}
              >
                {item.label}
              </Link>
            ))}
            {isManager && (
              <Link
                href="/manager"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                  pathname.startsWith("/manager") ? "bg-brand-800 text-white" : "text-brand-100 hover:bg-brand-600"
                }`}
              >
                Manager Dashboard
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-brand-600"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-sm font-medium text-white">{currentUser.name}</span>
              <span className="pill bg-brand-800 text-gold-200">{currentUser.role}</span>
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-1 w-56 card p-2 text-sm text-stone-700">
                <div className="px-2 py-1.5 text-stone-500">
                  {currentUser.userId} · {currentUser.presence}
                </div>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-md hover:bg-stone-100 text-rose-600"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
