"use client";

import { useEffect, useState } from "react";
import { InteractionBundle } from "@/app/interactions/[id]/page";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { ApprovalType, Priority, User } from "@/lib/types";
import Drawer from "@/components/Drawer";

const TYPE_LABELS: Record<ApprovalType, string> = {
  PRIORITY_OVERRIDE: "Priority Override",
  DOCUMENT_WAIVER: "Document Waiver",
  EXCEPTION_ELIGIBILITY: "Exception Eligibility",
  MANAGER_REVIEW: "Manager Review",
  FAST_TRACK: "Fast-Track / VIP Handling",
  TRANSFER_APPROVAL: "Transfer Approval",
};

const statusStyles: Record<string, string> = {
  PENDING: "bg-gold-100 text-gold-800",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700",
};

export default function ApprovalsPanel({ bundle, onChanged }: { bundle: InteractionBundle; onChanged: () => void }) {
  const { currentUser } = useAuth();
  const { call } = useApi();
  const { show } = useToast();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<ApprovalType>("PRIORITY_OVERRIDE");
  const [justification, setJustification] = useState("");
  const [targetPriority, setTargetPriority] = useState<Priority>("HIGH");
  const [docName, setDocName] = useState("");
  const [expiryDays, setExpiryDays] = useState(30);
  const [skipSteps, setSkipSteps] = useState<string[]>([]);
  const [toUserId, setToUserId] = useState("");
  const [agents, setAgents] = useState<User[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const { interaction, coreApp, approvals } = bundle;
  const problemDocs = coreApp?.requiredDocs.filter((d) => (d.status === "MISSING" || d.status === "INVALID") && !d.waived) ?? [];

  useEffect(() => {
    if (!open) return;
    call("/api/users").then((d) => setAgents((d.users as User[]).filter((u) => u.role === "AGENT")));
    if (problemDocs.length) setDocName(problemDocs[0].name);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  function resetForm() {
    setJustification("");
    setTargetPriority("HIGH");
    setSkipSteps([]);
    setToUserId("");
  }

  async function submit() {
    if (!justification.trim()) {
      show("Please provide a justification.", "error");
      return;
    }
    let payload: Record<string, unknown> = {};
    let title = "";
    if (type === "PRIORITY_OVERRIDE") {
      payload = { from: interaction.priority, to: targetPriority };
      title = `Priority override: ${interaction.priority} → ${targetPriority}`;
    } else if (type === "DOCUMENT_WAIVER") {
      if (!docName) {
        show("Select a document to waive.", "error");
        return;
      }
      payload = { docName, reason: justification, expiryDays };
      title = `Waive requirement: ${docName}`;
    } else if (type === "EXCEPTION_ELIGIBILITY") {
      payload = { rule: coreApp?.eligibility.reasons.join("; ") ?? "Eligibility rule", exceptionRequested: true };
      title = "Grant eligibility exception";
    } else if (type === "FAST_TRACK") {
      payload = { skipSteps };
      title = "Fast-track / VIP handling";
    } else if (type === "TRANSFER_APPROVAL") {
      if (!toUserId) {
        show("Select a target agent.", "error");
        return;
      }
      const toUser = agents.find((a) => a.userId === toUserId);
      payload = { toUserId };
      title = `Transfer to ${toUser?.name ?? toUserId}`;
    } else {
      title = "Manager review requested";
    }

    setSubmitting(true);
    try {
      await call("/api/approvals", {
        method: "POST",
        body: JSON.stringify({
          interactionId: interaction.interactionId,
          type,
          title,
          justification,
          payload,
        }),
      });
      show("Approval request submitted to Manager.", "success");
      setOpen(false);
      resetForm();
      onChanged();
    } catch (e) {
      show(e instanceof Error ? e.message : "Failed to submit request.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  const canRequest = currentUser?.role === "AGENT" || currentUser?.role === "MANAGER";

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="section-label !mb-0 !border-b-0 !pb-0">Approval Requests</span>
        {canRequest && (
          <button className="btn-secondary" onClick={() => setOpen(true)}>
            + Request Approval
          </button>
        )}
      </div>

      {approvals.length === 0 && <p className="text-sm text-stone-400">No approval requests for this interaction.</p>}
      <div className="space-y-2">
        {approvals.map((a) => (
          <div key={a.approvalId} className="rounded-lg border border-stone-200 border-l-4 border-l-gold-400 p-2.5 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-stone-800">{a.title}</span>
              <span className={`pill ${statusStyles[a.status]}`}>{a.status}</span>
            </div>
            <div className="text-xs text-stone-500 mt-0.5">{TYPE_LABELS[a.type]}</div>
            {a.status !== "PENDING" && a.decisionNotes && (
              <div className="text-xs text-stone-500 mt-1 italic">Manager notes: {a.decisionNotes}</div>
            )}
          </div>
        ))}
      </div>

      {open && (
        <Drawer
          title="Request Manager Approval"
          onClose={() => setOpen(false)}
          footer={
            <>
              <button className="btn-ghost" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button className="btn-primary" disabled={submitting} onClick={submit}>
                {submitting ? "Submitting…" : "Submit Request"}
              </button>
            </>
          }
        >
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value as ApprovalType)} className="input">
                {(Object.keys(TYPE_LABELS) as ApprovalType[])
                  .filter((t) => t !== "MANAGER_REVIEW")
                  .map((t) => (
                    <option key={t} value={t}>
                      {TYPE_LABELS[t]}
                    </option>
                  ))}
              </select>
            </div>

            {type === "PRIORITY_OVERRIDE" && (
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">
                  New priority (current: {interaction.priority})
                </label>
                <select value={targetPriority} onChange={(e) => setTargetPriority(e.target.value as Priority)} className="input">
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                </select>
              </div>
            )}

            {type === "DOCUMENT_WAIVER" && (
              <>
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">Document to waive</label>
                  {problemDocs.length ? (
                    <select value={docName} onChange={(e) => setDocName(e.target.value)} className="input">
                      {problemDocs.map((d) => (
                        <option key={d.name} value={d.name}>
                          {d.name} ({d.status})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm text-stone-400">No missing/invalid documents on this case.</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">Waiver valid for (days)</label>
                  <input
                    type="number"
                    min={1}
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(Number(e.target.value))}
                    className="input"
                  />
                </div>
              </>
            )}

            {type === "FAST_TRACK" && (
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Steps to skip</label>
                <div className="space-y-1">
                  {(coreApp?.pendingSteps ?? []).map((s) => (
                    <label key={s} className="flex items-center gap-2 text-sm text-stone-600">
                      <input
                        type="checkbox"
                        checked={skipSteps.includes(s)}
                        onChange={(e) =>
                          setSkipSteps((prev) => (e.target.checked ? [...prev, s] : prev.filter((x) => x !== s)))
                        }
                      />
                      {s}
                    </label>
                  ))}
                  {!coreApp?.pendingSteps.length && <p className="text-stone-400 text-sm">No pending steps to skip.</p>}
                </div>
              </div>
            )}

            {type === "TRANSFER_APPROVAL" && (
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Transfer to</label>
                <select value={toUserId} onChange={(e) => setToUserId(e.target.value)} className="input">
                  <option value="">Select agent…</option>
                  {agents
                    .filter((a) => a.userId !== interaction.assignedTo)
                    .map((a) => (
                      <option key={a.userId} value={a.userId}>
                        {a.name}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {type === "EXCEPTION_ELIGIBILITY" && coreApp && (
              <p className="text-sm text-stone-500">
                Current blocking reasons: {coreApp.eligibility.reasons.join("; ") || "None on file"}
              </p>
            )}

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Justification</label>
              <textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                rows={3}
                className="input"
                placeholder="Explain why this request should be approved…"
              />
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
}
