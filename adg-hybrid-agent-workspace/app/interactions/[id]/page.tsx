"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { CoreApplication, Interaction } from "@/lib/types";
import { CustomerView, TimelineEventView } from "@/lib/view";
import { ApprovalRequest } from "@/lib/types";
import CustomerHeader from "@/components/interaction-card/CustomerHeader";
import InteractionHeader from "@/components/interaction-card/InteractionHeader";
import SessionControls from "@/components/interaction-card/SessionControls";
import TimelineTabs from "@/components/interaction-card/TimelineTabs";
import ActionBar from "@/components/interaction-card/ActionBar";
import CopilotPanel from "@/components/interaction-card/CopilotPanel";

export interface InteractionBundle {
  interaction: Interaction;
  customer: CustomerView;
  timeline: TimelineEventView[];
  coreApp: CoreApplication | null;
  approvals: ApprovalRequest[];
  sources: { serviceNow: number; m365: number; crm: boolean; sprinklr: number };
}

export default function InteractionCardPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { call } = useApi();
  const { currentUser } = useAuth();
  const { show } = useToast();
  const [bundle, setBundle] = useState<InteractionBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!currentUser) return;
    try {
      const data = await call(`/api/interactions/${params.id}`);
      setBundle(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load interaction.");
    } finally {
      setLoading(false);
    }
  }, [call, currentUser, params.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (loading) return <div className="text-center text-stone-400 py-16">Loading interaction…</div>;
  if (error || !bundle)
    return (
      <div className="card p-8 text-center">
        <p className="text-rose-600 font-medium">{error ?? "Interaction not found."}</p>
        <button className="btn-secondary mt-4" onClick={() => router.push("/interactions")}>
          Back to Interactions
        </button>
      </div>
    );

  return (
    <div className="space-y-4 pb-24">
      <button onClick={() => router.push("/interactions")} className="text-sm text-stone-500 hover:underline">
        ← Back to Interactions
      </button>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <CustomerHeader bundle={bundle} />
          <InteractionHeader bundle={bundle} onChanged={refresh} />
          <SessionControls bundle={bundle} onChanged={refresh} />
          <TimelineTabs timeline={bundle.timeline} />
        </div>
        <div className="lg:col-span-1">
          <CopilotPanel bundle={bundle} onChanged={refresh} />
        </div>
      </div>

      <ActionBar bundle={bundle} onChanged={refresh} />
    </div>
  );
}
