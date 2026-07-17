"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { Interaction } from "@/lib/types";
import { CustomerView } from "@/lib/view";
import { ModePill, StatusPill } from "@/components/Pills";
import { formatDateTime } from "@/lib/format";

interface AppointmentItem {
  interaction: Interaction;
  customer: CustomerView | null;
}

export default function AppointmentsPage() {
  const { call } = useApi();
  const { currentUser } = useAuth();
  const { show } = useToast();
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [customers, setCustomers] = useState<CustomerView[]>([]);
  const [loading, setLoading] = useState(true);

  const [customerId, setCustomerId] = useState("");
  const [mode, setMode] = useState<"PHYSICAL" | "VIRTUAL">("PHYSICAL");
  const [serviceName, setServiceName] = useState("Emirates ID Renewal");
  const [datetime, setDatetime] = useState(() => new Date(Date.now() + 2 * 3600 * 1000).toISOString().slice(0, 16));
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [apptData, custData] = await Promise.all([call("/api/appointments"), call("/api/customers")]);
      setAppointments(apptData.appointments ?? []);
      setCustomers(custData.customers ?? []);
      if (!customerId && custData.customers?.length) setCustomerId(custData.customers[0].customerId);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call, currentUser]);

  useEffect(() => {
    load();
  }, [load]);

  async function submit() {
    if (!customerId || !serviceName.trim()) return;
    setSubmitting(true);
    try {
      await call("/api/appointments", {
        method: "POST",
        body: JSON.stringify({ customerId, mode, serviceName, datetime: new Date(datetime).toISOString() }),
      });
      show("Appointment booked via mobile app.", "success");
      load();
    } catch (e) {
      show(e instanceof Error ? e.message : "Failed to book appointment.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Appointment Simulator</h1>
        <p className="text-sm text-slate-500">Simulates a customer booking a physical or virtual appointment via the mobile app.</p>
      </div>

      <div className="card p-5 grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Customer</label>
          <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="input">
            {customers.map((c) => (
              <option key={c.customerId} value={c.customerId}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
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
        <div className="sm:col-span-2">
          <button className="btn-primary" disabled={submitting} onClick={submit}>
            {submitting ? "Booking…" : "Book Appointment"}
          </button>
        </div>
      </div>

      <div>
        <h2 className="font-semibold text-slate-800 mb-2">All Appointments</h2>
        <div className="card divide-y divide-slate-100">
          {loading && <p className="p-4 text-slate-400 text-sm">Loading…</p>}
          {!loading && appointments.length === 0 && <p className="p-4 text-slate-400 text-sm">No appointments yet.</p>}
          {appointments.map(({ interaction, customer }) => (
            <div key={interaction.interactionId} className="p-3 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <Link href={`/interactions/${interaction.interactionId}`} className="font-medium text-brand-700 hover:underline">
                  {customer?.name}
                </Link>
                <div className="text-xs text-slate-500 mt-0.5">
                  {interaction.serviceName} · {interaction.appointment && formatDateTime(interaction.appointment.datetime)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ModePill mode={interaction.mode} />
                <StatusPill status={interaction.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
