"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/contexts/ToastContext";
import { Interaction, Priority, User } from "@/lib/types";
import { CustomerView } from "@/lib/view";
import { PriorityPill, StatusPill } from "@/components/Pills";

interface Item {
  interaction: Interaction;
  customer: CustomerView | null;
  assignedAgentName: string | null;
}

export default function ReassignPanel() {
  const { call } = useApi();
  const { show } = useToast();
  const [items, setItems] = useState<Item[]>([]);
  const [agents, setAgents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [i, u] = await Promise.all([call("/api/interactions"), call("/api/users")]);
      setItems(
        (i.items as Item[]).filter((it) => !["COMPLETED", "CANCELLED", "NO_SHOW"].includes(it.interaction.status))
      );
      setAgents((u.users as User[]).filter((a) => a.role === "AGENT"));
    } finally {
      setLoading(false);
    }
  }, [call]);

  useEffect(() => {
    load();
  }, [load]);

  async function reassign(interactionId: string, toUserId: string) {
    try {
      await call(`/api/interactions/${interactionId}/reassign`, { method: "POST", body: JSON.stringify({ toUserId }) });
      show("Interaction reassigned.", "success");
      load();
    } catch (e) {
      show(e instanceof Error ? e.message : "Failed to reassign.", "error");
    }
  }

  async function overridePriority(interactionId: string, priority: Priority) {
    try {
      await call(`/api/interactions/${interactionId}/priority`, { method: "POST", body: JSON.stringify({ priority }) });
      show(`Priority overridden to ${priority}.`, "success");
      load();
    } catch (e) {
      show(e instanceof Error ? e.message : "Failed to override priority.", "error");
    }
  }

  if (loading) return <p className="text-stone-400 p-4">Loading…</p>;

  return (
    <div className="card divide-y divide-stone-100">
      {items.length === 0 && <p className="p-4 text-stone-400 text-sm">No open interactions.</p>}
      {items.map(({ interaction, customer, assignedAgentName }) => (
        <div key={interaction.interactionId} className="p-3 flex items-center justify-between gap-3 flex-wrap text-sm">
          <div className="min-w-[180px]">
            <Link href={`/interactions/${interaction.interactionId}`} className="font-medium text-brand-700 hover:underline">
              {customer?.name}
            </Link>
            <div className="text-xs text-stone-500 mt-0.5">
              {interaction.serviceName} · <StatusPill status={interaction.status} />
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-stone-500">Assigned: {assignedAgentName ?? "Unassigned"}</span>
            <select
              className="input w-auto"
              value={interaction.assignedTo ?? ""}
              onChange={(e) => reassign(interaction.interactionId, e.target.value)}
            >
              <option value="" disabled>
                Reassign to…
              </option>
              {agents.map((a) => (
                <option key={a.userId} value={a.userId}>
                  {a.name}
                </option>
              ))}
            </select>
            <PriorityPill priority={interaction.priority} />
            <select
              className="input w-auto"
              value=""
              onChange={(e) => e.target.value && overridePriority(interaction.interactionId, e.target.value as Priority)}
            >
              <option value="">Override priority…</option>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}
