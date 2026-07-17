"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { ManagerSummary } from "@/lib/managerTypes";

function BarList({ title, data, total }: { title: string; data: Record<string, number>; total: number }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  return (
    <div className="card p-4">
      <h3 className="font-semibold text-stone-900 mb-3">{title}</h3>
      <div className="space-y-2">
        {entries.map(([key, count]) => (
          <div key={key}>
            <div className="flex justify-between text-xs text-stone-500 mb-0.5">
              <span>{key.replace(/_/g, " ")}</span>
              <span>{count}</span>
            </div>
            <div className="h-2 rounded-full bg-stone-100 overflow-hidden">
              <div className="h-full bg-brand-500 rounded-full" style={{ width: `${total ? (count / total) * 100 : 0}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ReportsTab() {
  const { call } = useApi();
  const [summary, setSummary] = useState<ManagerSummary | null>(null);

  useEffect(() => {
    call("/api/manager/summary").then(setSummary);
  }, [call]);

  if (!summary) return <p className="text-stone-400 p-4">Loading…</p>;

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <BarList title="By Channel" data={summary.reports.byChannel} total={summary.reports.total} />
      <BarList title="By Type" data={summary.reports.byType} total={summary.reports.total} />
      <BarList title="By Status" data={summary.reports.byStatus} total={summary.reports.total} />
    </div>
  );
}
