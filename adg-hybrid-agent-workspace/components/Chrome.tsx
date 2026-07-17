"use client";

import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import TopBar from "@/components/TopBar";

export default function Chrome({ children }: { children: ReactNode }) {
  const { currentUser, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage = pathname === "/";

  useEffect(() => {
    if (loading) return;
    if (!currentUser && !isLoginPage) router.replace("/");
    if (currentUser && isLoginPage) router.replace("/interactions");
  }, [loading, currentUser, isLoginPage, router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-stone-500">Loading…</div>;
  }

  if (isLoginPage || !currentUser) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 py-5">{children}</main>
    </div>
  );
}
