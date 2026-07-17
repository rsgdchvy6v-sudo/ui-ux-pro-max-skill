"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { ManagerSummary } from "@/lib/managerTypes";
import { StatusPill } from "@/components/Pills";
import { secondsToClock } from "@/lib/format";

export default function SlaOverviewTab() {
  const { call } = useApi();
  const [summary, setSummary] = useState<ManagerSummary | null>(null);

  useEffect(() => {
    call("/api/manager/summary").then(setSummary);
  }, [call]);

  if (!summary) return <p className="text-slate-400 p-4">Loading…</p>;

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="card p-4">
        <h3 className="font-semibold text-slate-900 mb-3">SLA by Status</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-200">
              <th className="py-2">Status</th>
              <th className="py-2">Count</th>
              <th className="py-2">Avg SLA</th>
              <th className="py-2">Breached</th>
            </tr>
          </thead>
          <tbody>
            {summary.slaByStatus.map((row) => (
              <tr key={row.status} className="border-b border-slate-100">
                <td className="py-2">
                  <StatusPill status={row.status} />
                </td>
                <td className="py-2">{row.count}</td>
                <td className="py-2 font-mono">{secondsToClock(row.avgSlaSeconds)}</td>
                <td className="py-2">
                  {row.breached > 0 ? <span className="pill bg-rose-100 text-rose-700">{row.breached}</span> : "0"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card p-4">
        <h3 className="font-semibold text-slate-900 mb-3">SLA by Agent</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-200">
              <th className="py-2">Agent</th>
              <th className="py-2">Avg SLA</th>
              <th className="py-2">Breached</th>
            </tr>
          </thead>
          <tbody>
            {summary.slaByAgent.map((row) => (
              <tr key={row.agent.userId} className="border-b border-slate-100">
                <td className="py-2">{row.agent.name}</td>
                <td className="py-2 font-mono">{secondsToClock(row.avgSlaSeconds)}</td>
                <td className="py-2">
                  {row.breached > 0 ? <span className="pill bg-rose-100 text-rose-700">{row.breached}</span> : "0"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
