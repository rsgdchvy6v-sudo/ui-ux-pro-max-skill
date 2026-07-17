import { NextRequest, NextResponse } from "next/server";
import { getActor } from "@/lib/requestContext";
import { badRequest, forbidden, notFound, unauthorized } from "@/lib/apiHelpers";
import { addAudit, addTimelineEvent, getInteraction } from "@/lib/store";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const actor = getActor(req);
  if (!actor) return unauthorized();

  const interaction = getInteraction(params.id);
  if (!interaction) return notFound("Interaction not found.");
  if (actor.user.role === "AGENT" && interaction.assignedTo !== actor.user.userId) {
    return forbidden("This interaction is not assigned to you.");
  }

  const body = await req.json().catch(() => ({}));
  const message = (body.message as string)?.trim();
  const channel = (body.channel as "EMAIL" | "CHAT") ?? "EMAIL";
  if (!message) return badRequest("message is required.");

  const event = addTimelineEvent({
    customerId: interaction.customerId,
    interactionId: interaction.interactionId,
    type: channel,
    title: `Notification sent (${channel === "EMAIL" ? "Email" : "SMS/Chat"})`,
    details: message,
    source: actor.user.name,
  });

  addAudit({
    actorUserId: actor.user.userId,
    actorRole: actor.user.role,
    actionType: "NOTIFICATION_SENT",
    entityType: "INTERACTION",
    entityId: interaction.interactionId,
    interactionId: interaction.interactionId,
    customerId: interaction.customerId,
    summary: `${actor.user.name} sent a ${channel} notification for ${interaction.interactionId}.`,
    after: event,
    channel: actor.user.role === "MANAGER" ? "MANAGER_UI" : "API",
  });

  return NextResponse.json({ event });
}
