import { NextRequest, NextResponse } from "next/server";
import { getActor } from "@/lib/requestContext";
import { badRequest, forbidden, notFound, unauthorized } from "@/lib/apiHelpers";
import { getCoreApplicationByInteraction, getCustomer, getInteraction, listTimelineForCustomer } from "@/lib/store";
import { viewCustomer, viewTimeline } from "@/lib/view";
import { generateCopilotOutput } from "@/lib/copilotEngine";

export async function POST(req: NextRequest) {
  const actor = getActor(req);
  if (!actor) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const interactionId = body.interactionId as string;
  if (!interactionId) return badRequest("interactionId is required.");

  const interaction = getInteraction(interactionId);
  if (!interaction) return notFound("Interaction not found.");
  if (actor.user.role === "AGENT" && interaction.assignedTo !== actor.user.userId) {
    return forbidden("This interaction is not assigned to you.");
  }

  const customer = getCustomer(interaction.customerId);
  if (!customer) return notFound("Customer not found.");

  const customerView = viewCustomer(customer);
  const timelineViews = viewTimeline(listTimelineForCustomer(customer.customerId));
  const coreApp = getCoreApplicationByInteraction(interactionId);

  const output = generateCopilotOutput({
    customer: customerView,
    interaction,
    coreApp,
    recentEvents: timelineViews,
  });

  return NextResponse.json({ output });
}
