// Mock Sprinklr-shaped connector: surfaces social mentions/DMs for a customer.
import { listTimelineForCustomer } from "../store";
import { envelope } from "./envelope";

export interface SprinklrMention {
  messageId: string;
  platform: string;
  text: string;
  postedAt: string;
}

export function getSocialMentions(customerId: string) {
  const mentions: SprinklrMention[] = listTimelineForCustomer(customerId)
    .filter((e) => e.type === "SOCIAL")
    .map((e) => ({
      messageId: e.id,
      platform: e.title.split(" ")[0],
      text: e.details,
      postedAt: e.createdAt,
    }));
  return envelope("sprinklr", { mentions });
}
