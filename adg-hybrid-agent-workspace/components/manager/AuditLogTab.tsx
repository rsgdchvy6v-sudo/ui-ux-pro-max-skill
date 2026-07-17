"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { AuditLogEntry } from "@/lib/types";
import { formatDateTime } from "@/lib/format";

const severityStyles: Record<string, string> = {
  INFO: "bg-stone-100 text-stone-600",
  SECURITY: "bg-violet-100 text-violet-700",
  RISK: "bg-rose-100 text-rose-700",
};

export default function AuditLogTab() {
  const { call } = useApi();
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [actor, setActor] = useState("");
  const [actionType, setActionType] = useState("");
  const [entityType, setEntityType] = useState("");
  const [severity, setSeverity] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (actor) params.set("actor", actor);
    if (actionType) params.set("actionType", actionType);
    if (entityType) params.set("entityType", entityType);
    if (severity) params.set("severity", severity);
    if (from) params.set("from", new Date(from).toISOString());
    if (to) params.set("to", new Date(to).toISOString());
    try {
      const d = await call(`/api/audit?${params.toString()}`);
      setEntries(d.entries ?? []);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call, actor, actionType, entityType, severity, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const actionTypes = useMemo(() => Array.from(new Set(entries.map((e) => e.actionType))).sort(), [entries]);
  const actors = useMemo(() => Array.from(new Set(entries.map((e) => e.actorUserId))).sort(), [entries]);

  return (
    <div className="space-y-3">
      <div className="card p-3 grid sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <select className="input" value={actor} onChange={(e) => setActor(e.target.value)}>
          <option value="">All actors</option>
          {actors.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <select className="input" value={actionType} onChange={(e) => setActionType(e.target.value)}>
          <option value="">All action types</option>
          {actionTypes.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <select className="input" value={entityType} onChange={(e) => setEntityType(e.target.value)}>
          <option value="">All entity types</option>
          <option value="APPROVAL">APPROVAL</option>
          <option value="INTERACTION">INTERACTION</option>
          <option value="QUEUE">QUEUE</option>
          <option value="CUSTOMER">CUSTOMER</option>
          <option value="CORE_APPLICATION">CORE_APPLICATION</option>
        </select>
        <select className="input" value={severity} onChange={(e) => setSeverity(e.target.value)}>
          <option value="">All severities</option>
          <option value="INFO">INFO</option>
          <option value="SECURITY">SECURITY</option>
          <option value="RISK">RISK</option>
        </select>
        <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
        <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>

      <div className="card divide-y divide-stone-100">
        {loading && <p className="p-4 text-stone-400 text-sm">Loading…</p>}
        {!loading && entries.length === 0 && <p className="p-4 text-stone-400 text-sm">No audit entries match these filters.</p>}
        {entries.map((e) => (
          <div key={e.auditId} className="p-3 text-sm">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <span className="font-medium text-stone-800">{e.actionType.replace(/_/g, " ")}</span>{" "}
                <span className="text-xs text-stone-400">by {e.actorUserId} ({e.actorRole})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`pill ${severityStyles[e.severity ?? "INFO"]}`}>{e.severity}</span>
                <span className="text-xs text-stone-400">{formatDateTime(e.timestamp)}</span>
              </div>
            </div>
            <p className="text-stone-600 mt-1">{e.summary}</p>
            <div className="text-xs text-stone-400 mt-1">
              {e.entityType} · {e.entityId} · channel {e.channel}
            </div>
            {(e.before !== undefined || e.after !== undefined) && (
              <button
                className="text-xs text-brand-600 hover:underline mt-1"
                onClick={() => setExpanded(expanded === e.auditId ? null : e.auditId)}
              >
                {expanded === e.auditId ? "Hide diff" : "Show before/after diff"}
              </button>
            )}
            {expanded === e.auditId && (
              <div className="grid sm:grid-cols-2 gap-2 mt-2">
                <div>
                  <div className="text-xs font-medium text-stone-500 mb-1">Before</div>
                  <pre className="text-xs bg-stone-50 border border-stone-200 rounded-md p-2 overflow-x-auto">
                    {JSON.stringify(e.before ?? null, null, 2)}
                  </pre>
                </div>
                <div>
                  <div className="text-xs font-medium text-stone-500 mb-1">After</div>
                  <pre className="text-xs bg-stone-50 border border-stone-200 rounded-md p-2 overflow-x-auto">
                    {JSON.stringify(e.after ?? null, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
