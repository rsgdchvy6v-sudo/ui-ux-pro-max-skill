import { NextRequest, NextResponse } from "next/server";
import { getActor } from "@/lib/requestContext";
import { badRequest, unauthorized } from "@/lib/apiHelpers";
import { createAppointment, getCustomer, listInteractions } from "@/lib/store";
import { viewCustomer } from "@/lib/view";

export async function GET(req: NextRequest) {
  const actor = getActor(req);
  if (!actor) return unauthorized();

  const appointments = listInteractions()
    .filter((i) => i.type === "APPOINTMENT")
    .sort((a, b) => new Date(a.appointment?.datetime ?? 0).getTime() - new Date(b.appointment?.datetime ?? 0).getTime())
    .map((interaction) => {
      const customer = getCustomer(interaction.customerId);
      return { interaction, customer: customer ? viewCustomer(customer, actor.user.role, actor.viewAsAgent) : null };
    });

  return NextResponse.json({ appointments });
}

export async function POST(req: NextRequest) {
  const actor = getActor(req);
  if (!actor) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const { customerId, mode, serviceName, datetime } = body as {
    customerId?: string;
    mode?: "PHYSICAL" | "VIRTUAL";
    serviceName?: string;
    datetime?: string;
  };
  if (!customerId || !mode || !serviceName || !datetime) {
    return badRequest("customerId, mode, serviceName and datetime are required.");
  }
  if (!getCustomer(customerId)) return badRequest("Unknown customerId.");

  const interaction = createAppointment({ customerId, mode, serviceName, datetime });
  return NextResponse.json({ interaction });
}
