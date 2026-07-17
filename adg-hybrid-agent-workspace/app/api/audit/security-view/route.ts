import { NextRequest, NextResponse } from "next/server";
import { getActor } from "@/lib/requestContext";
import { forbidden, unauthorized } from "@/lib/apiHelpers";
import { logSecurityView } from "@/lib/store";

export async function POST(req: NextRequest) {
  const actor = getActor(req);
  if (!actor) return unauthorized();
  if (actor.user.role !== "MANAGER") return forbidden("Only managers can trigger security-visibility logging.");

  const body = await req.json().catch(() => ({}));
  const { actionType, customerId, summary } = body as {
    actionType?: "VIEW_AS_AGENT_TOGGLED" | "VIEW_FULL_SENSITIVE_DATA";
    customerId?: string;
    summary?: string;
  };
  if (actionType !== "VIEW_AS_AGENT_TOGGLED" && actionType !== "VIEW_FULL_SENSITIVE_DATA") {
    return NextResponse.json({ error: "Invalid actionType." }, { status: 400 });
  }

  const entry = logSecurityView(
    actor.user.userId,
    actionType,
    customerId,
    summary ?? `${actor.user.name} triggered ${actionType}.`
  );
  return NextResponse.json({ entry });
}
