// Mock ServiceNow-shaped connector: surfaces "work items" (cases/complaints) for a customer.
import { listTimelineForCustomer } from "../store";
import { envelope } from "./envelope";

export interface ServiceNowWorkItem {
  sys_id: string;
  short_description: string;
  category: "CASE" | "COMPLAINT";
  state: string;
  opened_at: string;
}

export function getWorkItems(customerId: string) {
  const items: ServiceNowWorkItem[] = listTimelineForCustomer(customerId)
    .filter((e) => (e.type === "CASE" || e.type === "COMPLAINT") && e.source === "ServiceNow")
    .map((e) => ({
      sys_id: e.id,
      short_description: e.title,
      category: e.type as "CASE" | "COMPLAINT",
      state: e.title.toLowerCase().includes("resolved") ? "Resolved" : "In Progress",
      opened_at: e.createdAt,
    }));
  return envelope("serviceNow", { workitems: items });
}
