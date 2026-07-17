"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import LiveQueueTab from "@/components/manager/LiveQueueTab";
import SlaOverviewTab from "@/components/manager/SlaOverviewTab";
import WorkloadTab from "@/components/manager/WorkloadTab";
import ReassignPanel from "@/components/manager/ReassignPanel";
import ApprovalsInboxTab from "@/components/manager/ApprovalsInboxTab";
import AuditLogTab from "@/components/manager/AuditLogTab";
import ReportsTab from "@/components/manager/ReportsTab";

const TABS = [
  "Live Queue",
  "SLA Overview",
  "Agent Workload",
  "Reassign",
  "Approvals Inbox",
  "Audit Log",
  "Reports",
] as const;
type Tab = (typeof TABS)[number];

export default function ManagerDashboardPage() {
  const { currentUser } = useAuth();
  const [tab, setTab] = useState<Tab>("Live Queue");

  if (currentUser && currentUser.role !== "MANAGER") {
    return <div className="card p-8 text-center text-rose-600">Manager access only.</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-900">Manager Dashboard</h1>

      <div className="flex flex-wrap gap-1 border-b border-slate-200 pb-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pill ${tab === t ? "bg-brand-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Live Queue" && <LiveQueueTab />}
      {tab === "SLA Overview" && <SlaOverviewTab />}
      {tab === "Agent Workload" && <WorkloadTab />}
      {tab === "Reassign" && <ReassignPanel />}
      {tab === "Approvals Inbox" && <ApprovalsInboxTab />}
      {tab === "Audit Log" && <AuditLogTab />}
      {tab === "Reports" && <ReportsTab />}
    </div>
  );
}
