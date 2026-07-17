import { NextRequest, NextResponse } from "next/server";
import { getActor } from "@/lib/requestContext";
import { badRequest, unauthorized } from "@/lib/apiHelpers";
import * as queue from "@/lib/connectors/queue";

export async function POST(req: NextRequest) {
  const actor = getActor(req);
  if (!actor) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const { interactionId, counter } = body as { interactionId?: string; counter?: string };
  if (!interactionId || !counter) return badRequest("interactionId and counter are required.");

  const result = queue.callNext(interactionId, counter, actor.user.userId);
  if (result.status === "error") return badRequest((result.data as { error: string }).error);
  return NextResponse.json(result);
}
