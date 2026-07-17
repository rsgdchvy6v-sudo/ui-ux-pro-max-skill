import { NextRequest, NextResponse } from "next/server";
import { getActor } from "@/lib/requestContext";
import { getCoreApplicationsByCustomer, getCustomer, listTimelineForCustomer } from "@/lib/store";
import { notFound, unauthorized } from "@/lib/apiHelpers";
import { viewCustomer, viewTimeline } from "@/lib/view";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const actor = getActor(req);
  if (!actor) return unauthorized();

  const customer = getCustomer(params.id);
  if (!customer) return notFound("Customer not found.");

  return NextResponse.json({
    customer: viewCustomer(customer),
    timeline: viewTimeline(listTimelineForCustomer(customer.customerId)),
    coreApplications: getCoreApplicationsByCustomer(customer.customerId),
  });
}
