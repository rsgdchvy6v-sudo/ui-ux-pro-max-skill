"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/contexts/ToastContext";
import { InteractionBundle } from "@/app/interactions/[id]/page";

export default function CustomerHeader({ bundle, onChanged }: { bundle: InteractionBundle; onChanged: () => void }) {
  const { currentUser, viewAsAgent } = useAuth();
  const { call } = useApi();
  const { show } = useToast();
  const [logged, setLogged] = useState(false);
  const { customer } = bundle;

  const isRealManager = currentUser?.role === "MANAGER" && !viewAsAgent;

  async function logSensitiveAccess() {
    try {
      await call("/api/audit/security-view", {
        method: "POST",
        body: JSON.stringify({
          actionType: "VIEW_FULL_SENSITIVE_DATA",
          customerId: customer.customerId,
          summary: `${currentUser?.name} viewed full unmasked identifiers and sensitive timeline details for ${customer.name}.`,
        }),
      });
      setLogged(true);
      show("Access to full sensitive data logged in the audit trail.", "success");
      onChanged();
    } catch (e) {
      show(e instanceof Error ? e.message : "Failed to log access.", "error");
    }
  }

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-lg shrink-0">
            {customer.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-lg text-slate-900">{customer.name}</h2>
              {customer.flags.map((f) => (
                <span key={f} className="pill bg-violet-100 text-violet-700">
                  {f}
                </span>
              ))}
              <span className="pill bg-slate-100 text-slate-600">{customer.segment}</span>
            </div>
            <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-4 gap-y-0.5">
              <span>
                Emirates ID: <span className="font-mono">{customer.emiratesId}</span>
              </span>
              {customer.uid && (
                <span>
                  UID: <span className="font-mono">{customer.uid}</span>
                </span>
              )}
              <span>Phone: {customer.phone}</span>
              <span>Email: {customer.email}</span>
              <span>Language: {customer.language}</span>
            </div>
          </div>
        </div>

        {isRealManager && (
          <button
            className={`btn-secondary shrink-0 ${logged ? "opacity-60" : ""}`}
            onClick={logSensitiveAccess}
            title="Logs a SECURITY-severity audit entry for viewing this customer's unmasked data"
          >
            {logged ? "Access logged ✓" : "Log Sensitive Data Access"}
          </button>
        )}
        {customer.masked && (
          <span className="pill bg-amber-100 text-amber-700 shrink-0">Masked view (Agent)</span>
        )}
      </div>
    </div>
  );
}
