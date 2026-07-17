import { Interaction, InteractionStatus, User } from "./types";
import { CustomerView } from "./view";

export interface ManagerSummary {
  liveQueue: { interaction: Interaction; customer: CustomerView | null }[];
  statusCounts: Record<string, number>;
  slaByStatus: { status: InteractionStatus; count: number; avgSlaSeconds: number; breached: number }[];
  workload: { agent: User; totalAssigned: number; active: number; inService: number; completed: number }[];
  slaByAgent: { agent: User; avgSlaSeconds: number; breached: number }[];
  reports: { byChannel: Record<string, number>; byType: Record<string, number>; byStatus: Record<string, number>; total: number };
}
