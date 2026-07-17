"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { ManagerSummary } from "@/lib/managerTypes";

export default function WorkloadTab() {
  const { call } = useApi();
  const [summary, setSummary] = useState<ManagerSummary | null>(null);

  useEffect(() => {
    call("/api/manager/summary").then(setSummary);
  }, [call]);

  if (!summary) return <p className="text-stone-400 p-4">Loading…</p>;

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {summary.workload.map((w) => (
        <div key={w.agent.userId} className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-semibold text-stone-900">{w.agent.name}</div>
              <div className="text-xs text-stone-500">{w.agent.userId}</div>
            </div>
            <span className="pill bg-emerald-100 text-emerald-700">{w.agent.presence}</span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            <Stat label="Assigned" value={w.totalAssigned} />
            <Stat label="Active" value={w.active} />
            <Stat label="In Service" value={w.inService} />
            <Stat label="Completed" value={w.completed} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat-tile !p-2">
      <div className="stat-value !text-lg">{value}</div>
      <div className="stat-label !text-[11px] !mt-0.5">{label}</div>
    </div>
  );
}
