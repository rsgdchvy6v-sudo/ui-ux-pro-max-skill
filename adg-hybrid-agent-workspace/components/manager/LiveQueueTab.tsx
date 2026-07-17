"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/contexts/ToastContext";
import { ManagerSummary } from "@/lib/managerTypes";
import { ModePill, PriorityPill, StatusPill } from "@/components/Pills";
import { User } from "@/lib/types";

const COUNTERS = ["Counter 1", "Counter 2", "Counter 3", "Counter 4"];

export default function LiveQueueTab() {
  const { call } = useApi();
  const { show } = useToast();
  const [summary, setSummary] = useState<ManagerSummary | null>(null);
  const [agents, setAgents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, u] = await Promise.all([call("/api/manager/summary"), call("/api/users")]);
      setSummary(s);
      setAgents((u.users as User[]).filter((a) => a.role === "AGENT"));
    } finally {
      setLoading(false);
    }
  }, [call]);

  useEffect(() => {
    load();
  }, [load]);

  async function forceCall(interactionId: string, counter: string, toUserId: string) {
    try {
      await call(`/api/interactions/${interactionId}/force-call`, {
        method: "POST",
        body: JSON.stringify({ counter, toUserId }),
      });
      show("Token force-called.", "success");
      load();
    } catch (e) {
      show(e instanceof Error ? e.message : "Failed to force-call.", "error");
    }
  }

  if (loading || !summary) return <p className="text-slate-400 p-4">Loading…</p>;

  return (
    <div className="card divide-y divide-slate-100">
      <div className="p-3 grid grid-cols-12 gap-2 text-xs font-medium text-slate-500">
        <div className="col-span-3">Customer</div>
        <div className="col-span-2">Service</div>
        <div className="col-span-1">Mode</div>
        <div className="col-span-1">Priority</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-3">Force-call</div>
      </div>
      {summary.liveQueue.length === 0 && <p className="p-4 text-slate-400 text-sm">Queue is empty.</p>}
      {summary.liveQueue.map(({ interaction, customer }) => (
        <ForceCallRow
          key={interaction.interactionId}
          interactionId={interaction.interactionId}
          customerName={customer?.name ?? "Unknown"}
          serviceName={interaction.serviceName}
          mode={interaction.mode}
          priority={interaction.priority}
          status={interaction.status}
          agents={agents}
          onForceCall={forceCall}
        />
      ))}
    </div>
  );
}

function ForceCallRow({
  interactionId,
  customerName,
  serviceName,
  mode,
  priority,
  status,
  agents,
  onForceCall,
}: {
  interactionId: string;
  customerName: string;
  serviceName: string;
  mode: "PHYSICAL" | "VIRTUAL";
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: import("@/lib/types").InteractionStatus;
  agents: User[];
  onForceCall: (interactionId: string, counter: string, toUserId: string) => void;
}) {
  const [counter, setCounter] = useState(COUNTERS[0]);
  const [toUserId, setToUserId] = useState(agents[0]?.userId ?? "");

  return (
    <div className="p-3 grid grid-cols-12 gap-2 items-center text-sm">
      <div className="col-span-3">
        <Link href={`/interactions/${interactionId}`} className="font-medium text-brand-700 hover:underline">
          {customerName}
        </Link>
      </div>
      <div className="col-span-2 text-slate-600">{serviceName}</div>
      <div className="col-span-1">
        <ModePill mode={mode} />
      </div>
      <div className="col-span-1">
        <PriorityPill priority={priority} />
      </div>
      <div className="col-span-2">
        <StatusPill status={status} />
      </div>
      <div className="col-span-3 flex items-center gap-1">
        <select value={counter} onChange={(e) => setCounter(e.target.value)} className="input w-auto text-xs py-1">
          {COUNTERS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select value={toUserId} onChange={(e) => setToUserId(e.target.value)} className="input w-auto text-xs py-1">
          {agents.map((a) => (
            <option key={a.userId} value={a.userId}>
              {a.name}
            </option>
          ))}
        </select>
        <button className="btn-secondary text-xs" onClick={() => onForceCall(interactionId, counter, toUserId)}>
          Force-call
        </button>
      </div>
    </div>
  );
}
