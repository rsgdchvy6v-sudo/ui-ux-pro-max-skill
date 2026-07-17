import { NextRequest, NextResponse } from "next/server";
import { getActor } from "@/lib/requestContext";
import { forbidden, unauthorized } from "@/lib/apiHelpers";
import * as audit from "@/lib/connectors/audit";

export async function GET(req: NextRequest) {
  const actor = getActor(req);
  if (!actor) return unauthorized();
  if (actor.user.role !== "MANAGER") return forbidden("Only managers can view the audit log.");

  const { searchParams } = new URL(req.url);
  const actorFilter = searchParams.get("actor");
  const actionType = searchParams.get("actionType");
  const entityType = searchParams.get("entityType");
  const severity = searchParams.get("severity");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let entries = audit.list().data.entries;

  if (actorFilter) entries = entries.filter((e) => e.actorUserId === actorFilter);
  if (actionType) entries = entries.filter((e) => e.actionType === actionType);
  if (entityType) entries = entries.filter((e) => e.entityType === entityType);
  if (severity) entries = entries.filter((e) => e.severity === severity);
  if (from) entries = entries.filter((e) => new Date(e.timestamp).getTime() >= new Date(from).getTime());
  if (to) entries = entries.filter((e) => new Date(e.timestamp).getTime() <= new Date(to).getTime());

  return NextResponse.json({ entries });
}
