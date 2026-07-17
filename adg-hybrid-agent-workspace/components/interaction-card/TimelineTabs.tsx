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
      <span className="section-label !mb-0 !border-b-0 !pb-0">Customer 360 Timeline</span>
      <div className="flex flex-wrap gap-1 mb-4 mt-3 border-b border-stone-200 pb-3">
        {TABS.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setActive(tab.type)}
            className={`pill ${active === tab.type ? "bg-brand-600 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
        {filtered.length === 0 && <p className="text-stone-400 text-sm text-center py-6">No events in this category.</p>}
        {filtered.map((event) => (
          <div key={event.id} className="rounded-lg border border-l-4 border-stone-200 border-l-brand-400 bg-cream-50 p-3 text-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span>{typeIcon[event.type]}</span>
                <span className="font-medium text-stone-800">{event.title}</span>
              </div>
              <span className="text-xs font-medium text-gold-700 shrink-0" title={formatDateTime(event.createdAt)}>
                {timeAgo(event.createdAt)}
              </span>
            </div>
            <p className="mt-1 text-stone-600">{event.details}</p>
            <div className="text-xs text-stone-400 mt-1">Source: {event.source}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
