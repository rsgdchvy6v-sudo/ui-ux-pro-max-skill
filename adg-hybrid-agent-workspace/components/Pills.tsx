import { InteractionStatus, Priority } from "@/lib/types";
import { secondsToClock } from "@/lib/format";

const statusStyles: Record<InteractionStatus, string> = {
  BOOKED: "bg-stone-100 text-stone-700",
  ARRIVED: "bg-sky-100 text-sky-700",
  CALLED: "bg-gold-100 text-gold-700",
  IN_SERVICE: "bg-brand-100 text-brand-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  NO_SHOW: "bg-rose-100 text-rose-700",
  CANCELLED: "bg-stone-200 text-stone-500",
};

export function StatusPill({ status }: { status: InteractionStatus }) {
  return <span className={`pill ${statusStyles[status]}`}>{status.replace("_", " ")}</span>;
}

const priorityStyles: Record<Priority, string> = {
  LOW: "bg-stone-100 text-stone-600",
  MEDIUM: "bg-gold-100 text-gold-700",
  HIGH: "bg-rose-100 text-rose-700",
};

export function PriorityPill({ priority }: { priority: Priority }) {
  return <span className={`pill ${priorityStyles[priority]}`}>{priority}</span>;
}

export function SlaTimer({ seconds, status }: { seconds: number; status: InteractionStatus }) {
  const done = ["COMPLETED", "CANCELLED", "NO_SHOW"].includes(status);
  if (done) return <span className="text-xs text-stone-400">—</span>;
  const breached = seconds <= 0;
  const atRisk = seconds > 0 && seconds < 300;
  return (
    <span
      className={`pill font-mono ${
        breached ? "bg-rose-600 text-white" : atRisk ? "bg-gold-100 text-gold-700" : "bg-emerald-100 text-emerald-700"
      }`}
    >
      SLA {secondsToClock(seconds)}
    </span>
  );
}

export function ModePill({ mode }: { mode: "PHYSICAL" | "VIRTUAL" }) {
  return (
    <span className={`pill ${mode === "PHYSICAL" ? "bg-indigo-100 text-indigo-700" : "bg-teal-100 text-teal-700"}`}>
      {mode === "PHYSICAL" ? "Physical" : "Virtual"}
    </span>
  );
}
