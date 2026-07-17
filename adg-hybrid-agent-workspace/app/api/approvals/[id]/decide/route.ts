import { NextRequest, NextResponse } from "next/server";
import { getActor } from "@/lib/requestContext";
import { badRequest, forbidden, unauthorized } from "@/lib/apiHelpers";
import * as approvals from "@/lib/connectors/approvals";
import { addAudit } from "@/lib/store";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const actor = getActor(req);
  if (!actor) return unauthorized();
  if (actor.user.role !== "MANAGER") return forbidden("Only managers can decide approval requests.");

  const body = await req.json().catch(() => ({}));
  const { decision, notes } = body as { decision?: "APPROVED" | "REJECTED"; notes?: string };
  if (decision !== "APPROVED" && decision !== "REJECTED") return badRequest("decision must be APPROVED or REJECTED.");

  const result = approvals.decide(params.id, decision, actor.user.userId, notes ?? "");
  if (result.status === "error") return badRequest((result.data as { error: string }).error);

  const { approvalBefore, approvalAfter, interactionBefore, interactionAfter, coreAppBefore, coreAppAfter } =
    result.data;

  addAudit({
    actorUserId: actor.user.userId,
    actorRole: "MANAGER",
    actionType: "APPROVAL_DECIDED",
    entityType: "APPROVAL",
    entityId: approvalAfter.approvalId,
    interactionId: approvalAfter.interactionId,
    customerId: approvalAfter.customerId,
    summary: `Khalifa Aldhaheri ${decision === "APPROVED" ? "approved" : "rejected"} "${approvalAfter.title}".`,
    before: approvalBefore,
    after: approvalAfter,
    channel: "MANAGER_UI",
    severity: decision === "REJECTED" ? "RISK" : "INFO",
  });

  if (interactionBefore && interactionAfter) {
    addAudit({
      actorUserId: actor.user.userId,
      actorRole: "MANAGER",
      actionType: `APPLIED_${approvalAfter.type}`,
      entityType: "INTERACTION",
      entityId: interactionAfter.interactionId,
      interactionId: interactionAfter.interactionId,
      customerId: approvalAfter.customerId,
      summary: `Approval ${approvalAfter.approvalId} applied changes to interaction ${interactionAfter.interactionId}.`,
      before: interactionBefore,
      after: interactionAfter,
      channel: "MANAGER_UI",
    });
  }

  if (coreAppBefore && coreAppAfter) {
    addAudit({
      actorUserId: actor.user.userId,
      actorRole: "MANAGER",
      actionType: `APPLIED_${approvalAfter.type}`,
      entityType: "CORE_APPLICATION",
      entityId: coreAppAfter.appId,
      interactionId: approvalAfter.interactionId,
      customerId: approvalAfter.customerId,
      summary: `Approval ${approvalAfter.approvalId} applied changes to core application ${coreAppAfter.appId}.`,
      before: coreAppBefore,
      after: coreAppAfter,
      channel: "MANAGER_UI",
    });
  }

  return NextResponse.json(result);
}
