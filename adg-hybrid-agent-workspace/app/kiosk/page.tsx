"use client";

import { useState } from "react";
import Link from "next/link";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/contexts/ToastContext";
import { Interaction } from "@/lib/types";

const DEMO_IDS = [
  { label: "Ahmed Al Falasi", eid: "784-1985-1234567-1" },
  { label: "Fatima Al Suwaidi", eid: "784-1990-7654321-2" },
  { label: "Rashid Al Nuaimi", eid: "784-1978-2223344-5" },
  { label: "Unknown ID (lookup failure demo)", eid: "784-1999-9999999-9" },
];

export default function KioskPage() {
  const { call } = useApi();
  const { show } = useToast();
  const [emiratesId, setEmiratesId] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ interaction: Interaction; created: boolean; matchedAppointment: boolean } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  async function scan() {
    if (!emiratesId.trim()) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const data = await call("/api/kiosk/checkin", {
        method: "POST",
        body: JSON.stringify({ emiratesId: emiratesId.trim() }),
      });
      setResult(data.data);
      show(data.data.matchedAppointment ? "Appointment matched — checked in." : "Walk-in registered.", "success");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Check-in failed.";
      setError(msg);
      show(msg, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <h1 className="text-xl font-bold text-slate-900">Kiosk Simulator</h1>
      <p className="text-sm text-slate-500">
        Simulates a customer scanning their Emirates ID at a physical kiosk. The system resolves the customer, checks
        for a matching appointment within ±2 hours, and either checks them in or registers a walk-in.
      </p>

      <div className="card p-5 space-y-3">
        <label className="block text-xs font-medium text-slate-600">Scan Emirates ID</label>
        <div className="flex gap-2">
          <input
            value={emiratesId}
            onChange={(e) => setEmiratesId(e.target.value)}
            placeholder="784-1985-1234567-1"
            className="input font-mono"
            onKeyDown={(e) => e.key === "Enter" && scan()}
          />
          <button className="btn-primary shrink-0" disabled={busy} onClick={scan}>
            {busy ? "Scanning…" : "Scan"}
          </button>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {DEMO_IDS.map((d) => (
            <button key={d.eid} className="pill bg-slate-100 text-slate-600 hover:bg-slate-200" onClick={() => setEmiratesId(d.eid)}>
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="card p-4 border-rose-200 bg-rose-50 text-rose-700 text-sm">{error}</div>}

      {result && (
        <div className="card p-5 space-y-2">
          <h3 className="font-semibold text-emerald-700">
            {result.matchedAppointment ? "Appointment Checked-in" : "Walk-in Registered"}
          </h3>
          <p className="text-sm text-slate-600">
            Interaction <span className="font-mono">{result.interaction.interactionId}</span> is now{" "}
            <span className="font-semibold">{result.interaction.status}</span>. Queue token:{" "}
            <span className="font-mono font-semibold">{result.interaction.queue?.token}</span>
          </p>
          <Link href="/queue" className="btn-secondary inline-flex mt-2">
            Go to Queue →
          </Link>
        </div>
      )}
    </div>
  );
}
