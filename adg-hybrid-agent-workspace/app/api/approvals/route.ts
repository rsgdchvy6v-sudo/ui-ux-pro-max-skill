import { NextRequest, NextResponse } from "next/server";
import { getActor } from "@/lib/requestContext";
import { badRequest, forbidden, unauthorized } from "@/lib/apiHelpers";
import * as approvals from "@/lib/connectors/approvals";
import { getInteraction } from "@/lib/store";
import { ApprovalType } from "@/lib/types";

export async function GET(req: NextRequest) {
  const actor = getActor(req);
  if (!actor) return unauthorized();

  const { searchParams } = new URL(req.url);
  const interactionId = searchParams.get("interactionId");

  const all = approvals.list().data.approvals;

  if (interactionId) {
    return NextResponse.json({ approvals: all.filter((a) => a.interactionId === interactionId) });
  }

  // Full inbox (no interactionId scope) is manager-only.
  if (actor.user.role !== "MANAGER") return forbidden("Only managers can view the full approvals inbox.");
  return NextResponse.json({ approvals: all });
}

export async function POST(req: NextRequest) {
  const actor = getActor(req);
  if (!actor) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const { interactionId, type, title, justification, payload } = body as {
    interactionId?: string;
    type?: ApprovalType;
    title?: string;
    justification?: string;
    payload?: Record<string, unknown>;
  };
  if (!interactionId || !type || !title || !justification) {
    return badRequest("interactionId, type, title and justification are required.");
  }
  const interaction = getInteraction(interactionId);
  if (!interaction) return badRequest("Unknown interactionId.");

  const result = approvals.create({
    interactionId,
    customerId: interaction.customerId,
    requestedByUserId: actor.user.userId,
    type,
    title,
    justification,
    payload: payload ?? {},
  });

  return NextResponse.json(result);
}
