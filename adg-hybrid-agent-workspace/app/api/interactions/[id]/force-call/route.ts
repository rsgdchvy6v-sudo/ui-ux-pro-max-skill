import { NextRequest, NextResponse } from "next/server";
import { getActor } from "@/lib/requestContext";
import { forceCallToken } from "@/lib/store";
import { badRequest, forbidden, unauthorized } from "@/lib/apiHelpers";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const actor = getActor(req);
  if (!actor) return unauthorized();
  if (actor.user.role !== "MANAGER") return forbidden("Only managers can force-call a token.");

  const body = await req.json().catch(() => ({}));
  const counter = body.counter as string;
  const toUserId = body.toUserId as string;
  if (!counter || !toUserId) return badRequest("counter and toUserId are required.");

  const result = forceCallToken(params.id, counter, toUserId, actor.user.userId);
  if ("error" in result) return badRequest(result.error);
  return NextResponse.json(result);
}
