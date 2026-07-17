import { Customer, TimelineEvent } from "./types";

// All fields are shown in full to every role — there is no data masking.
export type CustomerView = Customer;
export type TimelineEventView = TimelineEvent;

export function viewCustomer(customer: Customer): CustomerView {
  return customer;
}

export function viewTimelineEvent(event: TimelineEvent): TimelineEventView {
  return event;
}

export function viewTimeline(events: TimelineEvent[]): TimelineEventView[] {
  return events;
}
