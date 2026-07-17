import { NextRequest, NextResponse } from "next/server";
import { getActor } from "@/lib/requestContext";
import {
  getCoreApplicationByInteraction,
  getCustomer,
  getInteraction,
  listApprovals,
  listTimelineForCustomer,
} from "@/lib/store";
import { forbidden, notFound, unauthorized } from "@/lib/apiHelpers";
import { viewCustomer, viewTimeline } from "@/lib/view";
import * as serviceNow from "@/lib/connectors/serviceNow";
import * as m365 from "@/lib/connectors/m365";
import * as crm from "@/lib/connectors/crm";
import * as sprinklr from "@/lib/connectors/sprinklr";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const actor = getActor(req);
  if (!actor) return unauthorized();

  const interaction = getInteraction(params.id);
  if (!interaction) return notFound("Interaction not found.");

  if (actor.user.role === "AGENT" && interaction.assignedTo !== actor.user.userId) {
    return forbidden("This interaction is not assigned to you.");
  }

  const customer = getCustomer(interaction.customerId);
  if (!customer) return notFound("Customer not found.");

  const timeline = viewTimeline(listTimelineForCustomer(customer.customerId), actor.user.role, actor.viewAsAgent);
  const coreApp = getCoreApplicationByInteraction(interaction.interactionId);
  const approvals = listApprovals().filter((a) => a.interactionId === interaction.interactionId);

  const sources = {
    serviceNow: serviceNow.getWorkItems(customer.customerId).data.workitems.length,
    m365: m365.getMessages(customer.customerId).data.messages.length,
    crm: crm.getProfile(customer.customerId).data.profile !== null,
    sprinklr: sprinklr.getSocialMentions(customer.customerId).data.mentions.length,
  };

  return NextResponse.json({
    interaction,
    customer: viewCustomer(customer, actor.user.role, actor.viewAsAgent),
    timeline,
    coreApp: coreApp ?? null,
    approvals,
    sources,
  });
}
