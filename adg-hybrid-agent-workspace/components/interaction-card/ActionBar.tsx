"use client";

import { useState } from "react";
import { InteractionBundle } from "@/app/interactions/[id]/page";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/contexts/ToastContext";

type ModalKey = "update" | "requestDocs" | "upload" | "followup" | "notify" | "close" | null;

export default function ActionBar({ bundle, onChanged }: { bundle: InteractionBundle; onChanged: () => void }) {
  const [modal, setModal] = useState<ModalKey>(null);
  const { interaction, coreApp } = bundle;
  const closed = ["COMPLETED", "CANCELLED", "NO_SHOW"].includes(interaction.status);

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30">
        <div className="max-w-[1600px] mx-auto px-4 py-2.5 flex flex-wrap gap-2 justify-center">
          <button className="btn-secondary" onClick={() => setModal("update")} disabled={!coreApp}>
            Update Application
          </button>
          <button className="btn-secondary" onClick={() => setModal("requestDocs")} disabled={!coreApp}>
            Request Documents
          </button>
          <button className="btn-secondary" onClick={() => setModal("upload")} disabled={!coreApp}>
            Upload Document
          </button>
          <button className="btn-secondary" onClick={() => setModal("followup")}>
            Schedule Follow-up
          </button>
          <button className="btn-secondary" onClick={() => setModal("notify")}>
            Send Notification
          </button>
          <button className="btn-danger" onClick={() => setModal("close")} disabled={closed}>
            Close Interaction
          </button>
        </div>
      </div>

      {modal === "update" && coreApp && <UpdateApplicationModal bundle={bundle} onClose={() => setModal(null)} onChanged={onChanged} />}
      {modal === "requestDocs" && coreApp && <RequestDocsModal bundle={bundle} onClose={() => setModal(null)} onChanged={onChanged} />}
      {modal === "upload" && coreApp && <UploadDocumentModal bundle={bundle} onClose={() => setModal(null)} onChanged={onChanged} />}
      {modal === "followup" && <ScheduleFollowupModal bundle={bundle} onClose={() => setModal(null)} onChanged={onChanged} />}
      {modal === "notify" && <SendNotificationModal bundle={bundle} onClose={() => setModal(null)} onChanged={onChanged} />}
      {modal === "close" && <CloseInteractionModal bundle={bundle} onClose={() => setModal(null)} onChanged={onChanged} />}
    </>
  );
}

function ModalShell({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <h4 className="font-semibold text-slate-900 mb-3">{title}</h4>
        {children}
      </div>
    </div>
  );
}

function UpdateApplicationModal({
  bundle,
  onClose,
  onChanged,
}: {
  bundle: InteractionBundle;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { call } = useApi();
  const { show } = useToast();
  const [status, setStatus] = useState(bundle.coreApp?.status ?? "");
  const [busy, setBusy] = useState(false);

  async function completeStep(step: string) {
    setBusy(true);
    try {
      await call(`/api/core-applications/${bundle.coreApp!.appId}/action`, {
        method: "POST",
        body: JSON.stringify({ action: "COMPLETE_STEP", step }),
      });
      show(`Marked step complete: ${step}`, "success");
      onChanged();
    } catch (e) {
      show(e instanceof Error ? e.message : "Failed to update.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function saveStatus() {
    setBusy(true);
    try {
      await call(`/api/core-applications/${bundle.coreApp!.appId}/action`, {
        method: "POST",
        body: JSON.stringify({ action: "SET_STATUS", status }),
      });
      show("Application status updated.", "success");
      onClose();
      onChanged();
    } catch (e) {
      show(e instanceof Error ? e.message : "Failed to update.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ModalShell title="Update Application" onClose={onClose}>
      <div className="text-sm space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Case status</label>
          <div className="flex gap-2">
            <input value={status} onChange={(e) => setStatus(e.target.value)} className="input" />
            <button className="btn-primary shrink-0" disabled={busy} onClick={saveStatus}>
              Save
            </button>
          </div>
        </div>
        <div>
          <div className="font-medium text-slate-800 mb-1">Pending steps</div>
          {bundle.coreApp?.pendingSteps.length ? (
            <ul className="space-y-1.5">
              {bundle.coreApp.pendingSteps.map((s) => (
                <li key={s} className="flex items-center justify-between gap-2 rounded-md bg-slate-50 px-2 py-1.5">
                  <span className="text-slate-700">{s}</span>
                  <button className="btn-ghost text-xs" disabled={busy} onClick={() => completeStep(s)}>
                    Mark complete
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-400">No pending steps.</p>
          )}
        </div>
      </div>
      <div className="flex justify-end mt-4">
        <button className="btn-ghost" onClick={onClose}>
          Close
        </button>
      </div>
    </ModalShell>
  );
}

function RequestDocsModal({ bundle, onClose, onChanged }: { bundle: InteractionBundle; onClose: () => void; onChanged: () => void }) {
  const { call } = useApi();
  const { show } = useToast();
  const [docName, setDocName] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!docName.trim()) return;
    setBusy(true);
    try {
      await call(`/api/core-applications/${bundle.coreApp!.appId}/action`, {
        method: "POST",
        body: JSON.stringify({ action: "REQUEST_DOC", docName }),
      });
      show(`Requested document: ${docName}`, "success");
      onClose();
      onChanged();
    } catch (e) {
      show(e instanceof Error ? e.message : "Failed to request document.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ModalShell title="Request Documents" onClose={onClose}>
      <label className="block text-xs font-medium text-slate-600 mb-1">Document name</label>
      <input value={docName} onChange={(e) => setDocName(e.target.value)} className="input mb-4" placeholder="e.g. Salary Certificate" />
      <div className="flex justify-end gap-2">
        <button className="btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button className="btn-primary" disabled={busy} onClick={submit}>
          Send Request
        </button>
      </div>
    </ModalShell>
  );
}

function UploadDocumentModal({ bundle, onClose, onChanged }: { bundle: InteractionBundle; onClose: () => void; onChanged: () => void }) {
  const { call } = useApi();
  const { show } = useToast();
  const outstanding = bundle.coreApp?.requiredDocs.filter((d) => d.status !== "RECEIVED") ?? [];
  const [docName, setDocName] = useState(outstanding[0]?.name ?? "");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!docName) return;
    setBusy(true);
    try {
      await call(`/api/core-applications/${bundle.coreApp!.appId}/action`, {
        method: "POST",
        body: JSON.stringify({ action: "MARK_RECEIVED", docName }),
      });
      show(`Document uploaded: ${docName}`, "success");
      onClose();
      onChanged();
    } catch (e) {
      show(e instanceof Error ? e.message : "Failed to upload document.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ModalShell title="Upload Document" onClose={onClose}>
      {outstanding.length ? (
        <>
          <label className="block text-xs font-medium text-slate-600 mb-1">Which document (simulated upload)?</label>
          <select value={docName} onChange={(e) => setDocName(e.target.value)} className="input mb-4">
            {outstanding.map((d) => (
              <option key={d.name} value={d.name}>
                {d.name} ({d.status})
              </option>
            ))}
          </select>
        </>
      ) : (
        <p className="text-sm text-slate-400 mb-4">All required documents are already on file.</p>
      )}
      <div className="flex justify-end gap-2">
        <button className="btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button className="btn-primary" disabled={busy || !docName} onClick={submit}>
          Upload
        </button>
      </div>
    </ModalShell>
  );
}

function ScheduleFollowupModal({ bundle, onClose, onChanged }: { bundle: InteractionBundle; onClose: () => void; onChanged: () => void }) {
  const { call } = useApi();
  const { show } = useToast();
  const [mode, setMode] = useState<"PHYSICAL" | "VIRTUAL">(bundle.interaction.mode);
  const [serviceName, setServiceName] = useState(bundle.interaction.serviceName + " — Follow-up");
  const [datetime, setDatetime] = useState(() => {
    const d = new Date(Date.now() + 24 * 3600 * 1000);
    return d.toISOString().slice(0, 16);
  });
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      await call("/api/appointments", {
        method: "POST",
        body: JSON.stringify({
          customerId: bundle.customer.customerId,
          mode,
          serviceName,
          datetime: new Date(datetime).toISOString(),
        }),
      });
      show("Follow-up appointment scheduled.", "success");
      onClose();
      onChanged();
    } catch (e) {
      show(e instanceof Error ? e.message : "Failed to schedule follow-up.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ModalShell title="Schedule Follow-up" onClose={onClose}>
      <div className="space-y-3 text-sm">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Mode</label>
          <select value={mode} onChange={(e) => setMode(e.target.value as "PHYSICAL" | "VIRTUAL")} className="input">
            <option value="PHYSICAL">Physical</option>
            <option value="VIRTUAL">Virtual</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Service</label>
          <input value={serviceName} onChange={(e) => setServiceName(e.target.value)} className="input" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Date &amp; time</label>
          <input type="datetime-local" value={datetime} onChange={(e) => setDatetime(e.target.value)} className="input" />
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button className="btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button className="btn-primary" disabled={busy} onClick={submit}>
          Schedule
        </button>
      </div>
    </ModalShell>
  );
}

function SendNotificationModal({ bundle, onClose, onChanged }: { bundle: InteractionBundle; onClose: () => void; onChanged: () => void }) {
  const { call } = useApi();
  const { show } = useToast();
  const [channel, setChannel] = useState<"EMAIL" | "CHAT">("EMAIL");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!message.trim()) return;
    setBusy(true);
    try {
      await call(`/api/interactions/${bundle.interaction.interactionId}/notify`, {
        method: "POST",
        body: JSON.stringify({ channel, message }),
      });
      show("Notification sent to customer.", "success");
      onClose();
      onChanged();
    } catch (e) {
      show(e instanceof Error ? e.message : "Failed to send notification.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ModalShell title="Send Notification" onClose={onClose}>
      <label className="block text-xs font-medium text-slate-600 mb-1">Channel</label>
      <select value={channel} onChange={(e) => setChannel(e.target.value as "EMAIL" | "CHAT")} className="input mb-3">
        <option value="EMAIL">Email</option>
        <option value="CHAT">SMS / Chat</option>
      </select>
      <label className="block text-xs font-medium text-slate-600 mb-1">Message</label>
      <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} className="input mb-4" />
      <div className="flex justify-end gap-2">
        <button className="btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button className="btn-primary" disabled={busy} onClick={submit}>
          Send
        </button>
      </div>
    </ModalShell>
  );
}

function CloseInteractionModal({ bundle, onClose, onChanged }: { bundle: InteractionBundle; onClose: () => void; onChanged: () => void }) {
  const { call } = useApi();
  const { show } = useToast();
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      await call(`/api/interactions/${bundle.interaction.interactionId}/status`, {
        method: "POST",
        body: JSON.stringify({ status: "COMPLETED" }),
      });
      show("Interaction closed.", "success");
      onClose();
      onChanged();
    } catch (e) {
      show(e instanceof Error ? e.message : "Failed to close interaction.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ModalShell title="Close Interaction" onClose={onClose}>
      <p className="text-sm text-slate-600 mb-4">
        This will mark interaction <span className="font-mono">{bundle.interaction.interactionId}</span> as COMPLETED.
      </p>
      <div className="flex justify-end gap-2">
        <button className="btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button className="btn-danger" disabled={busy} onClick={submit}>
          Confirm Close
        </button>
      </div>
    </ModalShell>
  );
}
