import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import Chrome from "@/components/Chrome";

export const metadata: Metadata = {
  title: "ADG Unified Hybrid Agent Workspace",
  description: "Local demo: one Interaction Card for hybrid physical + virtual service.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ToastProvider>
            <Chrome>{children}</Chrome>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
