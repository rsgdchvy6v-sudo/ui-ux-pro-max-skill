import { NextRequest, NextResponse } from "next/server";
import { getActor } from "@/lib/requestContext";
import { listCustomers } from "@/lib/store";
import { unauthorized } from "@/lib/apiHelpers";
import { viewCustomer } from "@/lib/view";

export async function GET(req: NextRequest) {
  const actor = getActor(req);
  if (!actor) return unauthorized();

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").toLowerCase().trim();

  let customers = listCustomers();
  if (q) {
    customers = customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.emiratesId.replace(/-/g, "").includes(q.replace(/-/g, "")) ||
        c.customerId.toLowerCase().includes(q)
    );
  }

  return NextResponse.json({
    customers: customers.map((c) => viewCustomer(c)),
  });
}
