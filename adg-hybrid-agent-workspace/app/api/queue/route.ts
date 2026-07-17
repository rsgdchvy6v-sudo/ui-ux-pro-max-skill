import { NextRequest, NextResponse } from "next/server";
import { getActor } from "@/lib/requestContext";
import { unauthorized } from "@/lib/apiHelpers";
import * as queue from "@/lib/connectors/queue";
import { getCustomer } from "@/lib/store";
import { viewCustomer } from "@/lib/view";

export async function GET(req: NextRequest) {
  const actor = getActor(req);
  if (!actor) return unauthorized();

  const result = queue.listWaiting();
  const waiting = result.data.waiting.map((interaction) => {
    const customer = getCustomer(interaction.customerId);
    return {
      interaction,
      customer: customer ? viewCustomer(customer) : null,
    };
  });
  return NextResponse.json({ waiting });
}
