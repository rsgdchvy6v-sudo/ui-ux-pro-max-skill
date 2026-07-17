"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/contexts/ToastContext";
import { ApprovalRequest, ApprovalType } from "@/lib/types";

const TYPE_LABELS: Record<ApprovalType, string> = {
  PRIORITY_OVERRIDE: "Priority Override",
  DOCUMENT_WAIVER: "Document Waiver",
  EXCEPTION_ELIGIBILITY: "Exception Eligibility",
  MANAGER_REVIEW: "Manager Review",
  FAST_TRACK: "Fast-Track / VIP Handling",
  TRANSFER_APPROVAL: "Transfer Approval",
};

const statusStyles: Record<string, string> = {
  PENDING: "bg-gold-100 text-gold-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700",
};

export default function ApprovalsInboxTab() {
  const { call } = useApi();
  const { show } = useToast();
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await call("/api/approvals");
      setApprovals(d.approvals ?? []);
    } finally {
      setLoading(false);
    }
  }, [call]);

  useEffect(() => {
    load();
  }, [load]);

  async function decide(approvalId: string, decision: "APPROVED" | "REJECTED") {
    try {
      await call(`/api/approvals/${approvalId}/decide`, {
        method: "POST",
        body: JSON.stringify({ decision, notes: notes[approvalId] ?? "" }),
      });
      show(`Request ${decision.toLowerCase()}.`, "success");
      load();
    } catch (e) {
      show(e instanceof Error ? e.message : "Failed to record decision.", "error");
    }
  }

  const filtered = filter === "ALL" ? approvals : approvals.filter((a) => a.status === filter);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {(["PENDING", "APPROVED", "REJECTED", "ALL"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`pill ${filter === f ? "bg-brand-600 text-white" : "bg-white border border-stone-200 text-stone-600"}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="card divide-y divide-stone-100">
        {loading && <p className="p-4 text-stone-400 text-sm">Loading…</p>}
        {!loading && filtered.length === 0 && <p className="p-4 text-stone-400 text-sm">No approval requests here.</p>}
        {filtered.map((a) => (
          <div key={a.approvalId} className="p-4 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <div className="font-medium text-stone-800">{a.title}</div>
                <div className="text-xs text-stone-500">
                  {TYPE_LABELS[a.type]} · Requested by {a.requestedByUserId} ·{" "}
                  <Link href={`/interactions/${a.interactionId}`} className="text-brand-600 hover:underline">
                    {a.interactionId}
                  </Link>
                </div>
              </div>
              <span className={`pill ${statusStyles[a.status]}`}>{a.status}</span>
            </div>
            <p className="text-sm text-stone-600">{a.justification}</p>

            {a.status === "PENDING" ? (
              <div className="flex items-center gap-2">
                <input
                  className="input"
                  placeholder="Decision notes (optional)"
                  value={notes[a.approvalId] ?? ""}
                  onChange={(e) => setNotes((n) => ({ ...n, [a.approvalId]: e.target.value }))}
                />
                <button className="btn-primary shrink-0" onClick={() => decide(a.approvalId, "APPROVED")}>
                  Approve
                </button>
                <button className="btn-danger shrink-0" onClick={() => decide(a.approvalId, "REJECTED")}>
                  Reject
                </button>
              </div>
            ) : (
              <div className="text-xs text-stone-500 italic">
                Decided by {a.decidedByUserId} — {a.decisionNotes}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
