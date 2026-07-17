"use client";

import { useState } from "react";
import { InteractionBundle } from "@/app/interactions/[id]/page";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { formatDateTime, secondsToClock } from "@/lib/format";

const COUNTERS = ["Counter 1", "Counter 2", "Counter 3", "Counter 4"];

export default function SessionControls({ bundle, onChanged }: { bundle: InteractionBundle; onChanged: () => void }) {
  const { interaction } = bundle;
  const { currentUser } = useAuth();
  const { call } = useApi();
  const { show } = useToast();
  const [counter, setCounter] = useState(COUNTERS[0]);
  const [busy, setBusy] = useState(false);

  const canAct = currentUser && (currentUser.role === "MANAGER" || interaction.assignedTo === currentUser.userId);

  async function callToCounter() {
    setBusy(true);
    try {
      await call("/api/queue/call", {
        method: "POST",
        body: JSON.stringify({ interactionId: interaction.interactionId, counter }),
      });
      show(`Token ${interaction.queue?.token ?? ""} called to ${counter}.`, "success");
      onChanged();
    } catch (e) {
      show(e instanceof Error ? e.message : "Failed to call token.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function startService() {
    setBusy(true);
    try {
      await call("/api/queue/start", { method: "POST", body: JSON.stringify({ interactionId: interaction.interactionId }) });
      show("Service started.", "success");
      onChanged();
    } catch (e) {
      show(e instanceof Error ? e.message : "Failed to start service.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function completeService() {
    setBusy(true);
    try {
      await call("/api/queue/complete", { method: "POST", body: JSON.stringify({ interactionId: interaction.interactionId }) });
      show("Service completed.", "success");
      onChanged();
    } catch (e) {
      show(e instanceof Error ? e.message : "Failed to complete service.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="section-label !mb-0 !border-b-0 !pb-0">Session Controls</span>
        <span className="pill bg-stone-100 text-stone-600">{interaction.mode === "PHYSICAL" ? "Physical visit" : "Virtual session"}</span>
      </div>

      {interaction.appointment && (
        <div className="rounded-lg bg-stone-50 border border-stone-200 p-3 mb-3 text-sm">
          <div className="font-medium text-stone-800 mb-1">Appointment</div>
          <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1 text-stone-600">
            <span>Reference: <span className="font-mono">{interaction.appointment.referenceNo}</span></span>
            <span>When: {formatDateTime(interaction.appointment.datetime)}</span>
            <span>Booked via: {interaction.appointment.bookedVia}</span>
            {interaction.appointment.virtualJoinUrl && (
              <a
                className="text-brand-600 hover:underline"
                href={interaction.appointment.virtualJoinUrl}
                target="_blank"
                rel="noreferrer"
              >
                Join virtual session ↗
              </a>
            )}
          </div>
        </div>
      )}

      {interaction.mode === "PHYSICAL" ? (
        <div className="rounded-lg bg-stone-50 border border-stone-200 p-3 text-sm space-y-2">
          <div className="font-medium text-stone-800">Queue Token</div>
          {interaction.queue ? (
            <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1 text-stone-600">
              <span>Token: <span className="font-mono font-semibold text-stone-900">{interaction.queue.token}</span></span>
              <span>Counter: {interaction.queue.counter ?? "—"}</span>
              <span>Checked in: {interaction.queue.checkedInAt ? formatDateTime(interaction.queue.checkedInAt) : "—"}</span>
              <span>Called: {interaction.queue.calledAt ? formatDateTime(interaction.queue.calledAt) : "—"}</span>
              <span>Started: {interaction.queue.startedAt ? formatDateTime(interaction.queue.startedAt) : "—"}</span>
              <span>Completed: {interaction.queue.completedAt ? formatDateTime(interaction.queue.completedAt) : "—"}</span>
              {typeof interaction.queue.waitSeconds === "number" && (
                <span>Wait time: {secondsToClock(interaction.queue.waitSeconds)}</span>
              )}
            </div>
          ) : (
            <p className="text-stone-400">No queue token yet — check in via Kiosk.</p>
          )}
        </div>
      ) : (
        <div className="rounded-lg bg-stone-50 border border-stone-200 p-3 text-sm text-stone-600">
          Virtual session — use Join/Start/Complete controls below. No physical counter required.
        </div>
      )}

      {canAct && (
        <div className="flex items-center gap-2 flex-wrap mt-3">
          {interaction.status === "ARRIVED" && interaction.mode === "PHYSICAL" && (
            <>
              <select value={counter} onChange={(e) => setCounter(e.target.value)} className="input w-auto">
                {COUNTERS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <button className="btn-primary" disabled={busy} onClick={callToCounter}>
                Call to Counter
              </button>
            </>
          )}
          {(interaction.status === "CALLED" || (interaction.status === "BOOKED" && interaction.mode === "VIRTUAL")) && (
            <button className="btn-primary" disabled={busy} onClick={startService}>
              Start Service
            </button>
          )}
          {interaction.status === "IN_SERVICE" && (
            <button className="btn-primary" disabled={busy} onClick={completeService}>
              Complete Service
            </button>
          )}
        </div>
      )}
    </div>
  );
}
