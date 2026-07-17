import { NextRequest, NextResponse } from "next/server";
import { getActor } from "@/lib/requestContext";
import { getCustomer, getUser, listInteractions } from "@/lib/store";
import { unauthorized } from "@/lib/apiHelpers";
import { viewCustomer } from "@/lib/view";

export async function GET(req: NextRequest) {
  const actor = getActor(req);
  if (!actor) return unauthorized();

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status");
  const assignedToFilter = searchParams.get("assignedTo");

  let interactions = listInteractions();

  // Agents (actual role — impersonation does not change what data exists,
  // only how identifiers are masked) only see interactions assigned to them.
  if (actor.user.role === "AGENT") {
    interactions = interactions.filter((i) => i.assignedTo === actor.user.userId);
  } else if (assignedToFilter) {
    interactions = interactions.filter((i) => i.assignedTo === assignedToFilter);
  }

  if (statusFilter) {
    const statuses = statusFilter.split(",");
    interactions = interactions.filter((i) => statuses.includes(i.status));
  }

  const items = interactions
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .map((interaction) => {
      const customer = getCustomer(interaction.customerId);
      const assignedAgent = interaction.assignedTo ? getUser(interaction.assignedTo) : undefined;
      return {
        interaction,
        customer: customer ? viewCustomer(customer, actor.user.role, actor.viewAsAgent) : null,
        assignedAgentName: assignedAgent?.name ?? null,
      };
    });

  return NextResponse.json({ items });
}
