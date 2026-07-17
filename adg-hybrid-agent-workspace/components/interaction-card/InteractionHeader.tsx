"use client";

import { useEffect, useState } from "react";
import { InteractionBundle } from "@/app/interactions/[id]/page";
import { ModePill, PriorityPill, SlaTimer, StatusPill } from "@/components/Pills";
import { formatDateTime } from "@/lib/format";

export default function InteractionHeader({ bundle }: { bundle: InteractionBundle; onChanged: () => void }) {
  const { interaction } = bundle;
  const [sla, setSla] = useState(interaction.slaSecondsRemaining);

  useEffect(() => {
    setSla(interaction.slaSecondsRemaining);
    const done = ["COMPLETED", "CANCELLED", "NO_SHOW"].includes(interaction.status);
    if (done) return;
    const t = setInterval(() => setSla((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [interaction.slaSecondsRemaining, interaction.status]);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-slate-900">{interaction.serviceName}</h3>
            <span className="text-xs text-slate-400 font-mono">{interaction.interactionId}</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {interaction.type === "APPOINTMENT" ? "Appointment" : "Walk-in"} · Created {formatDateTime(interaction.createdAt)}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ModePill mode={interaction.mode} />
          <PriorityPill priority={interaction.priority} />
          <StatusPill status={interaction.status} />
          <SlaTimer seconds={sla} status={interaction.status} />
        </div>
      </div>
    </div>
  );
}
