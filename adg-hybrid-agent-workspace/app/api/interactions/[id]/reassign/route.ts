import { NextRequest, NextResponse } from "next/server";
import { getActor } from "@/lib/requestContext";
import { reassignInteraction } from "@/lib/store";
import { badRequest, forbidden, unauthorized } from "@/lib/apiHelpers";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const actor = getActor(req);
  if (!actor) return unauthorized();
  if (actor.user.role !== "MANAGER") return forbidden("Only managers can reassign interactions.");

  const body = await req.json().catch(() => ({}));
  const toUserId = body.toUserId as string;
  if (!toUserId) return badRequest("toUserId is required.");

  const result = reassignInteraction(params.id, toUserId, actor.user.userId);
  if ("error" in result) return badRequest(result.error);
  return NextResponse.json(result);
}
