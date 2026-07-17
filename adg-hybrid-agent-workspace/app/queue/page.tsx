"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { Interaction } from "@/lib/types";
import { CustomerView } from "@/lib/view";
import { ModePill, PriorityPill, StatusPill } from "@/components/Pills";

const COUNTERS = ["Counter 1", "Counter 2", "Counter 3", "Counter 4"];

interface WaitingItem {
  interaction: Interaction;
  customer: CustomerView | null;
}

export default function QueuePage() {
  const { call } = useApi();
  const { currentUser } = useAuth();
  const { show } = useToast();
  const [waiting, setWaiting] = useState<WaitingItem[]>([]);
  const [active, setActive] = useState<WaitingItem[]>([]);
  const [counters, setCounters] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [waitingData, activeData] = await Promise.all([
        call("/api/queue"),
        call(`/api/interactions?status=CALLED,IN_SERVICE`),
      ]);
      setWaiting(waitingData.waiting ?? []);
      setActive((activeData.items ?? []).map((it: { interaction: Interaction; customer: CustomerView }) => it));
    } finally {
      setLoading(false);
    }
  }, [call, currentUser]);

  useEffect(() => {
    load();
  }, [load]);

  async function callNext(interactionId: string) {
    const counter = counters[interactionId] ?? COUNTERS[0];
    try {
      await call("/api/queue/call", { method: "POST", body: JSON.stringify({ interactionId, counter }) });
      show(`Token called to ${counter}.`, "success");
      load();
    } catch (e) {
      show(e instanceof Error ? e.message : "Failed to call token.", "error");
    }
  }

  async function start(interactionId: string) {
    try {
      await call("/api/queue/start", { method: "POST", body: JSON.stringify({ interactionId }) });
      show("Service started.", "success");
      load();
    } catch (e) {
      show(e instanceof Error ? e.message : "Failed to start service.", "error");
    }
  }

  async function complete(interactionId: string) {
    try {
      await call("/api/queue/complete", { method: "POST", body: JSON.stringify({ interactionId }) });
      show("Service completed.", "success");
      load();
    } catch (e) {
      show(e instanceof Error ? e.message : "Failed to complete service.", "error");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-stone-900">Queue Simulator</h1>
        <p className="text-sm text-stone-500">Issue, call, start, and complete physical queue tokens.</p>
      </div>

      <section>
        <h2 className="font-semibold text-stone-800 mb-2">Waiting ({waiting.length})</h2>
        <div className="card divide-y divide-stone-100">
          {loading && <p className="p-4 text-stone-400 text-sm">Loading…</p>}
          {!loading && waiting.length === 0 && <p className="p-4 text-stone-400 text-sm">No customers waiting.</p>}
          {waiting.map(({ interaction, customer }) => (
            <div key={interaction.interactionId} className="p-3 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="font-medium text-stone-800">
                  {customer?.name} <span className="text-xs text-stone-400 font-mono">· token {interaction.queue?.token}</span>
                </div>
                <div className="text-xs text-stone-500 flex items-center gap-2 mt-0.5">
                  <ModePill mode={interaction.mode} />
                  <PriorityPill priority={interaction.priority} />
                  {interaction.serviceName}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="input w-auto"
                  value={counters[interaction.interactionId] ?? COUNTERS[0]}
                  onChange={(e) => setCounters((c) => ({ ...c, [interaction.interactionId]: e.target.value }))}
                >
                  {COUNTERS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <button className="btn-primary" onClick={() => callNext(interaction.interactionId)}>
                  Call Next
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-semibold text-stone-800 mb-2">My Active Tokens</h2>
        <div className="card divide-y divide-stone-100">
          {!loading && active.length === 0 && <p className="p-4 text-stone-400 text-sm">Nothing called or in service right now.</p>}
          {active.map(({ interaction, customer }) => (
            <div key={interaction.interactionId} className="p-3 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <Link href={`/interactions/${interaction.interactionId}`} className="font-medium text-brand-700 hover:underline">
                  {customer?.name}
                </Link>{" "}
                <span className="text-xs text-stone-400 font-mono">token {interaction.queue?.token}</span>
                <div className="text-xs text-stone-500 mt-0.5">
                  {interaction.queue?.counter ?? "—"} · <StatusPill status={interaction.status} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                {interaction.status === "CALLED" && (
                  <button className="btn-primary" onClick={() => start(interaction.interactionId)}>
                    Start Service
                  </button>
                )}
                {interaction.status === "IN_SERVICE" && (
                  <button className="btn-primary" onClick={() => complete(interaction.interactionId)}>
                    Complete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
