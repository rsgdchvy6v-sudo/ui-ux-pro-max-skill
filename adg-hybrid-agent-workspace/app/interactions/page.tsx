"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/contexts/AuthContext";
import { Interaction, InteractionStatus } from "@/lib/types";
import { CustomerView } from "@/lib/view";
import { ModePill, PriorityPill, SlaTimer, StatusPill } from "@/components/Pills";
import { formatDateTime } from "@/lib/format";

const ALL_STATUSES: InteractionStatus[] = [
  "BOOKED",
  "ARRIVED",
  "CALLED",
  "IN_SERVICE",
  "COMPLETED",
  "NO_SHOW",
  "CANCELLED",
];

interface Item {
  interaction: Interaction;
  customer: CustomerView | null;
  assignedAgentName: string | null;
}

export default function InteractionsPage() {
  const { call } = useApi();
  const { currentUser } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [statusFilter, setStatusFilter] = useState<InteractionStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);
    const qs = statusFilter.length ? `?status=${statusFilter.join(",")}` : "";
    call(`/api/interactions${qs}`)
      .then((d) => setItems(d.items ?? []))
      .finally(() => setLoading(false));
  }, [call, currentUser, statusFilter]);

  function toggleStatus(s: InteractionStatus) {
    setStatusFilter((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  const title = currentUser?.role === "MANAGER" ? "All Interactions" : "My Interactions";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
      </div>

      <div className="flex flex-wrap gap-2">
        {ALL_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => toggleStatus(s)}
            className={`pill border ${
              statusFilter.includes(s)
                ? "bg-brand-600 text-white border-brand-600"
                : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
            }`}
          >
            {s.replace("_", " ")}
          </button>
        ))}
        {statusFilter.length > 0 && (
          <button onClick={() => setStatusFilter([])} className="text-xs text-slate-500 underline ml-1">
            Clear filters
          </button>
        )}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-200">
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Service</th>
              <th className="px-4 py-3 font-medium">Mode</th>
              <th className="px-4 py-3 font-medium">Priority</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">SLA</th>
              <th className="px-4 py-3 font-medium">Agent</th>
              <th className="px-4 py-3 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                  No interactions match the current filters.
                </td>
              </tr>
            )}
            {!loading &&
              items.map(({ interaction, customer, assignedAgentName }) => (
                <tr key={interaction.interactionId} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/interactions/${interaction.interactionId}`} className="font-medium text-brand-700 hover:underline">
                      {customer?.name ?? "Unknown"}
                    </Link>
                    <div className="text-xs text-slate-400">{customer?.emiratesId}</div>
                  </td>
                  <td className="px-4 py-3">
                    {interaction.serviceName}
                    <div className="text-xs text-slate-400">{interaction.interactionId} · {interaction.type}</div>
                  </td>
                  <td className="px-4 py-3">
                    <ModePill mode={interaction.mode} />
                  </td>
                  <td className="px-4 py-3">
                    <PriorityPill priority={interaction.priority} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={interaction.status} />
                  </td>
                  <td className="px-4 py-3">
                    <SlaTimer seconds={interaction.slaSecondsRemaining} status={interaction.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">{assignedAgentName ?? "Unassigned"}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{formatDateTime(interaction.updatedAt)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
