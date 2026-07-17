import { NextRequest, NextResponse } from "next/server";
import { getActor } from "@/lib/requestContext";
import { unauthorized, badRequest } from "@/lib/apiHelpers";
import * as kiosk from "@/lib/connectors/kiosk";

export async function POST(req: NextRequest) {
  const actor = getActor(req);
  if (!actor) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const emiratesId = (body.emiratesId as string)?.trim();
  if (!emiratesId) return badRequest("emiratesId is required.");

  const result = kiosk.checkIn(emiratesId);
  if (result.status === "error") return NextResponse.json(result, { status: 404 });
  return NextResponse.json(result);
}
