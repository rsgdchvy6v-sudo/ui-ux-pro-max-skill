import { NextRequest, NextResponse } from "next/server";
import { getActor } from "@/lib/requestContext";
import { badRequest, forbidden, notFound, unauthorized } from "@/lib/apiHelpers";
import { addAudit, addTimelineEvent, getCoreApplication, getInteraction, updateCoreApplication } from "@/lib/store";

type Action = "REQUEST_DOC" | "MARK_RECEIVED" | "SET_STATUS" | "COMPLETE_STEP";

export async function POST(req: NextRequest, { params }: { params: { appId: string } }) {
  const actor = getActor(req);
  if (!actor) return unauthorized();

  const app = getCoreApplication(params.appId);
  if (!app) return notFound("Core application not found.");
  const interaction = app.interactionId ? getInteraction(app.interactionId) : undefined;
  if (actor.user.role === "AGENT" && interaction && interaction.assignedTo !== actor.user.userId) {
    return forbidden("This case is not assigned to you.");
  }

  const body = await req.json().catch(() => ({}));
  const action = body.action as Action;

  let diff: { before: typeof app; after: typeof app } | undefined;
  let timelineTitle = "";
  let timelineDetails = "";

  switch (action) {
    case "REQUEST_DOC": {
      const docName = body.docName as string;
      if (!docName) return badRequest("docName is required.");
      const nextDocs = [...app.requiredDocs, { name: docName, status: "MISSING" as const }];
      diff = updateCoreApplication(app.appId, { requiredDocs: nextDocs });
      timelineTitle = "Document requested";
      timelineDetails = `Requested document: ${docName}.`;
      break;
    }
    case "MARK_RECEIVED": {
      const docName = body.docName as string;
      if (!docName) return badRequest("docName is required.");
      const nextDocs = app.requiredDocs.map((d) => (d.name === docName ? { ...d, status: "RECEIVED" as const } : d));
      diff = updateCoreApplication(app.appId, { requiredDocs: nextDocs });
      timelineTitle = "Document uploaded";
      timelineDetails = `Uploaded and verified document: ${docName}.`;
      break;
    }
    case "SET_STATUS": {
      const status = body.status as string;
      if (!status) return badRequest("status is required.");
      diff = updateCoreApplication(app.appId, { status });
      timelineTitle = "Application status updated";
      timelineDetails = `Core application status changed to ${status}.`;
      break;
    }
    case "COMPLETE_STEP": {
      const step = body.step as string;
      if (!step) return badRequest("step is required.");
      diff = updateCoreApplication(app.appId, { pendingSteps: app.pendingSteps.filter((s) => s !== step) });
      timelineTitle = "Step completed";
      timelineDetails = `Completed pending step: ${step}.`;
      break;
    }
    default:
      return badRequest("Unknown action.");
  }

  if (!diff) return badRequest("Update failed.");

  addTimelineEvent({
    customerId: app.customerId,
    interactionId: app.interactionId,
    type: "CASE",
    title: timelineTitle,
    details: timelineDetails,
    source: actor.user.name,
  });

  addAudit({
    actorUserId: actor.user.userId,
    actorRole: actor.user.role,
    actionType: `CORE_APP_${action}`,
    entityType: "CORE_APPLICATION",
    entityId: app.appId,
    interactionId: app.interactionId,
    customerId: app.customerId,
    summary: `${actor.user.name} performed ${action.replace(/_/g, " ").toLowerCase()} on ${app.appId}.`,
    before: diff.before,
    after: diff.after,
    channel: actor.user.role === "MANAGER" ? "MANAGER_UI" : "API",
  });

  return NextResponse.json(diff);
}
