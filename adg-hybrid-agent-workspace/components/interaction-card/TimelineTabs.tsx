"use client";

import { useState } from "react";
import { TimelineEventView } from "@/lib/view";
import { TimelineEventType } from "@/lib/types";
import { formatDateTime, timeAgo } from "@/lib/format";

const TABS: { label: string; type: TimelineEventType | "ALL" }[] = [
  { label: "All", type: "ALL" },
  { label: "Cases", type: "CASE" },
  { label: "Appointments", type: "APPOINTMENT" },
  { label: "Complaints", type: "COMPLAINT" },
  { label: "Visits", type: "VISIT" },
  { label: "Calls", type: "CALL" },
  { label: "Emails", type: "EMAIL" },
  { label: "Chats", type: "CHAT" },
  { label: "Social", type: "SOCIAL" },
];

const typeIcon: Record<TimelineEventType, string> = {
  CASE: "🗂️",
  COMPLAINT: "⚠️",
  VISIT: "🏢",
  CALL: "📞",
  EMAIL: "✉️",
  CHAT: "💬",
  SOCIAL: "📣",
  APPOINTMENT: "📅",
};

export default function TimelineTabs({ timeline }: { timeline: TimelineEventView[] }) {
  const [active, setActive] = useState<TimelineEventType | "ALL">("ALL");

  const filtered = active === "ALL" ? timeline : timeline.filter((e) => e.type === active);

  return (
    <div className="card p-4">
      <h3 className="font-semibold text-slate-900 mb-3">Customer 360 Timeline</h3>
      <div className="flex flex-wrap gap-1 mb-4 border-b border-slate-200 pb-3">
        {TABS.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setActive(tab.type)}
            className={`pill ${active === tab.type ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
        {filtered.length === 0 && <p className="text-slate-400 text-sm text-center py-6">No events in this category.</p>}
        {filtered.map((event) => (
          <div
            key={event.id}
            className={`rounded-lg border p-3 text-sm ${
              event.redacted ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span>{typeIcon[event.type]}</span>
                <span className="font-medium text-slate-800">{event.title}</span>
                {event.redacted && <span className="pill bg-amber-200 text-amber-800">Redacted</span>}
              </div>
              <span className="text-xs text-slate-400 shrink-0" title={formatDateTime(event.createdAt)}>
                {timeAgo(event.createdAt)}
              </span>
            </div>
            <p className={`mt-1 ${event.redacted ? "italic text-amber-700" : "text-slate-600"}`}>{event.details}</p>
            <div className="text-xs text-slate-400 mt-1">Source: {event.source}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
