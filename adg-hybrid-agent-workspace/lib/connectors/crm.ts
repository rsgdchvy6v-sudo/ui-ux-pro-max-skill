// Mock CRM-shaped connector: surfaces the core customer profile record.
import { getCustomer } from "../store";
import { envelope } from "./envelope";

export function getProfile(customerId: string) {
  const customer = getCustomer(customerId);
  if (!customer) return envelope("crm", { profile: null });
  return envelope("crm", {
    profile: {
      customer_id: customer.customerId,
      full_name: customer.name,
      segment: customer.segment,
      preferred_language: customer.language,
      flags: customer.flags,
    },
  });
}
