import { NextRequest, NextResponse } from "next/server";
import { getActor } from "@/lib/requestContext";
import { getInteraction, setInteractionStatus } from "@/lib/store";
import { badRequest, forbidden, notFound, unauthorized } from "@/lib/apiHelpers";
import { InteractionStatus } from "@/lib/types";

const VALID: InteractionStatus[] = [
  "BOOKED",
  "ARRIVED",
  "CALLED",
  "IN_SERVICE",
  "COMPLETED",
  "NO_SHOW",
  "CANCELLED",
];

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const actor = getActor(req);
  if (!actor) return unauthorized();

  const interaction = getInteraction(params.id);
  if (!interaction) return notFound("Interaction not found.");
  if (actor.user.role === "AGENT" && interaction.assignedTo !== actor.user.userId) {
    return forbidden("This interaction is not assigned to you.");
  }

  const body = await req.json().catch(() => ({}));
  const status = body.status as InteractionStatus;
  if (!VALID.includes(status)) return badRequest("Invalid status.");

  const result = setInteractionStatus(params.id, status, actor.user.userId);
  if ("error" in result) return badRequest(result.error);
  return NextResponse.json(result);
}
