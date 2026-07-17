// Mock Microsoft 365-shaped connector: surfaces emails/chat messages for a customer.
import { listTimelineForCustomer } from "../store";
import { envelope } from "./envelope";

export interface M365Message {
  id: string;
  subject: string;
  bodyPreview: string;
  receivedDateTime: string;
  channel: "EMAIL" | "CHAT";
}

export function getMessages(customerId: string) {
  const messages: M365Message[] = listTimelineForCustomer(customerId)
    .filter((e) => e.type === "EMAIL" || e.type === "CHAT")
    .map((e) => ({
      id: e.id,
      subject: e.title,
      bodyPreview: e.details,
      receivedDateTime: e.createdAt,
      channel: e.type as "EMAIL" | "CHAT",
    }));
  return envelope("m365", { messages });
}
