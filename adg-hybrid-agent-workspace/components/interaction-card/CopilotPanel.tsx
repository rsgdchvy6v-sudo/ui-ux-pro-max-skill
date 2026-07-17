"use client";

import { useState } from "react";
import { InteractionBundle } from "@/app/interactions/[id]/page";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/contexts/ToastContext";
import { CopilotOutput } from "@/lib/copilotEngine";
import ApprovalsPanel from "@/components/interaction-card/ApprovalsPanel";

const TABS = ["Summary", "Eligibility", "Next Steps", "Pending"] as const;
type Tab = (typeof TABS)[number];

export default function CopilotPanel({ bundle, onChanged }: { bundle: InteractionBundle; onChanged: () => void }) {
  const { call } = useApi();
  const { show } = useToast();
  const [tab, setTab] = useState<Tab>("Summary");
  const [output, setOutput] = useState<CopilotOutput | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const data = await call("/api/copilot", {
        method: "POST",
        body: JSON.stringify({ interactionId: bundle.interaction.interactionId }),
      });
      setOutput(data.output);
    } catch (e) {
      show(e instanceof Error ? e.message : "Failed to generate summary.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-900">AI Copilot</h3>
          <button className="btn-primary" onClick={generate} disabled={loading}>
            {loading ? "Generating…" : output ? "Regenerate" : "Generate Summary"}
          </button>
        </div>

        <div className="flex gap-1 mb-3 border-b border-slate-200 pb-2">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pill ${tab === t ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {t}
            </button>
          ))}
        </div>

        {!output && <p className="text-sm text-slate-400 py-6 text-center">Click "Generate Summary" to run the local AI Copilot.</p>}

        {output && tab === "Summary" && (
          <ul className="text-sm text-slate-700 space-y-1.5 list-disc list-inside">
            {output.summary.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        )}

        {output && tab === "Eligibility" && (
          <div className="text-sm">
            <p className={`font-semibold mb-2 ${output.eligibility.isEligible ? "text-emerald-600" : "text-rose-600"}`}>
              {output.eligibility.isEligible ? "Eligible" : "Not eligible"}
            </p>
            {output.eligibility.reasons.length > 0 ? (
              <ul className="list-disc list-inside text-slate-600 space-y-1">
                {output.eligibility.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-400">No blocking reasons on file.</p>
            )}
          </div>
        )}

        {output && tab === "Next Steps" && (
          <ol className="text-sm text-slate-700 space-y-1.5 list-decimal list-inside">
            {output.nextSteps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        )}

        {output && tab === "Pending" && (
          <div className="text-sm space-y-3">
            <div>
              <div className="font-medium text-slate-800">Missing documents</div>
              {output.pending.missingDocs.length ? (
                <ul className="list-disc list-inside text-slate-600">
                  {output.pending.missingDocs.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-400">None</p>
              )}
            </div>
            <div>
              <div className="font-medium text-slate-800">Invalid documents</div>
              {output.pending.invalidDocs.length ? (
                <ul className="list-disc list-inside text-slate-600">
                  {output.pending.invalidDocs.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-400">None</p>
              )}
            </div>
            {output.pending.waivedDocs.length > 0 && (
              <div>
                <div className="font-medium text-slate-800">Waived documents</div>
                <ul className="list-disc list-inside text-slate-600">
                  {output.pending.waivedDocs.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <div className="font-medium text-slate-800">Pending steps</div>
              {output.pending.pendingSteps.length ? (
                <ul className="list-disc list-inside text-slate-600">
                  {output.pending.pendingSteps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-400">None</p>
              )}
            </div>
          </div>
        )}
      </div>

      <ApprovalsPanel bundle={bundle} onChanged={onChanged} />
    </div>
  );
}
