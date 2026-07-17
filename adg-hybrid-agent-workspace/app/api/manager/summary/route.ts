import { NextRequest, NextResponse } from "next/server";
import { getActor } from "@/lib/requestContext";
import { forbidden, unauthorized } from "@/lib/apiHelpers";
import { getCustomer, listInteractions, listUsers } from "@/lib/store";
import { viewCustomer } from "@/lib/view";
import { InteractionStatus } from "@/lib/types";

export async function GET(req: NextRequest) {
  const actor = getActor(req);
  if (!actor) return unauthorized();
  if (actor.user.role !== "MANAGER") return forbidden("Manager dashboard is manager-only.");

  const interactions = listInteractions();
  const agents = listUsers().filter((u) => u.role === "AGENT");

  const liveQueue = interactions
    .filter((i) => ["ARRIVED", "CALLED", "IN_SERVICE"].includes(i.status))
    .map((interaction) => {
      const customer = getCustomer(interaction.customerId);
      return { interaction, customer: customer ? viewCustomer(customer, actor.user.role, actor.viewAsAgent) : null };
    });

  const statusCounts: Record<string, number> = {};
  for (const i of interactions) statusCounts[i.status] = (statusCounts[i.status] ?? 0) + 1;

  const slaByStatus = Object.entries(
    interactions.reduce<Record<string, { count: number; totalSla: number; breached: number }>>((acc, i) => {
      const bucket = acc[i.status] ?? { count: 0, totalSla: 0, breached: 0 };
      bucket.count += 1;
      bucket.totalSla += i.slaSecondsRemaining;
      if (i.slaSecondsRemaining <= 0 && !["COMPLETED", "CANCELLED", "NO_SHOW"].includes(i.status)) bucket.breached += 1;
      acc[i.status] = bucket;
      return acc;
    }, {})
  ).map(([status, v]) => ({
    status: status as InteractionStatus,
    count: v.count,
    avgSlaSeconds: Math.round(v.totalSla / v.count),
    breached: v.breached,
  }));

  const workload = agents.map((agent) => {
    const assigned = interactions.filter((i) => i.assignedTo === agent.userId);
    const active = assigned.filter((i) => !["COMPLETED", "CANCELLED", "NO_SHOW"].includes(i.status));
    return {
      agent,
      totalAssigned: assigned.length,
      active: active.length,
      inService: assigned.filter((i) => i.status === "IN_SERVICE").length,
      completed: assigned.filter((i) => i.status === "COMPLETED").length,
    };
  });

  const slaByAgent = agents.map((agent) => {
    const assigned = interactions.filter((i) => i.assignedTo === agent.userId);
    const totalSla = assigned.reduce((sum, i) => sum + i.slaSecondsRemaining, 0);
    return {
      agent,
      avgSlaSeconds: assigned.length ? Math.round(totalSla / assigned.length) : 0,
      breached: assigned.filter(
        (i) => i.slaSecondsRemaining <= 0 && !["COMPLETED", "CANCELLED", "NO_SHOW"].includes(i.status)
      ).length,
    };
  });

  const byChannel: Record<string, number> = {};
  const byType: Record<string, number> = {};
  for (const i of interactions) {
    byChannel[i.mode] = (byChannel[i.mode] ?? 0) + 1;
    byType[i.type] = (byType[i.type] ?? 0) + 1;
  }

  return NextResponse.json({
    liveQueue,
    statusCounts,
    slaByStatus,
    workload,
    slaByAgent,
    reports: { byChannel, byType, byStatus: statusCounts, total: interactions.length },
  });
}
