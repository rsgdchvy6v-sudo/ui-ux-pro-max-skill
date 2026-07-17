import { applyVisibility, effectiveRole } from "./visibilityPolicy";
import { Customer, Role, TimelineEvent } from "./types";

export interface CustomerView extends Omit<Customer, "emiratesId" | "uid" | "email" | "phone"> {
  emiratesId: string;
  uid?: string;
  email: string;
  phone: string;
  masked: boolean;
}

export interface TimelineEventView extends Omit<TimelineEvent, "details"> {
  details: string;
  redacted: boolean;
}

/** Shapes a Customer for a given viewer, applying the central VisibilityPolicy. */
export function viewCustomer(customer: Customer, viewerRole: Role, viewAsAgent: boolean): CustomerView {
  const role = effectiveRole(viewerRole, viewAsAgent);
  return {
    ...customer,
    emiratesId: applyVisibility(role, "emiratesId", customer.emiratesId),
    uid: customer.uid ? applyVisibility(role, "uid", customer.uid) : undefined,
    email: applyVisibility(role, "email", customer.email),
    phone: applyVisibility(role, "phone", customer.phone),
    masked: role === "AGENT",
  };
}

export function viewTimelineEvent(event: TimelineEvent, viewerRole: Role, viewAsAgent: boolean): TimelineEventView {
  const role = effectiveRole(viewerRole, viewAsAgent);
  const details = applyVisibility(role, "timelineDetails", event.details, { sensitivity: event.sensitivity });
  return {
    ...event,
    details,
    redacted: event.sensitivity === "SENSITIVE" && role === "AGENT",
  };
}

export function viewTimeline(events: TimelineEvent[], viewerRole: Role, viewAsAgent: boolean): TimelineEventView[] {
  return events.map((e) => viewTimelineEvent(e, viewerRole, viewAsAgent));
}
