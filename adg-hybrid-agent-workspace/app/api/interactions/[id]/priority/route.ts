import { NextRequest, NextResponse } from "next/server";
import { getActor } from "@/lib/requestContext";
import { overridePriority } from "@/lib/store";
import { badRequest, forbidden, unauthorized } from "@/lib/apiHelpers";
import { Priority } from "@/lib/types";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const actor = getActor(req);
  if (!actor) return unauthorized();
  if (actor.user.role !== "MANAGER") return forbidden("Only managers can override priority.");

  const body = await req.json().catch(() => ({}));
  const priority = body.priority as Priority;
  if (!["LOW", "MEDIUM", "HIGH"].includes(priority)) return badRequest("Invalid priority.");

  const result = overridePriority(params.id, priority, actor.user.userId);
  if ("error" in result) return badRequest(result.error);
  return NextResponse.json(result);
}
