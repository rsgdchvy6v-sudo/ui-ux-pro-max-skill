// Mock Core Applications connector: eligibility, required documents, and status.
import { getCoreApplicationByInteraction, getCoreApplicationsByCustomer } from "../store";
import { envelope } from "./envelope";

export function getApplicationByInteraction(interactionId: string) {
  return envelope("coreApp", { application: getCoreApplicationByInteraction(interactionId) ?? null });
}

export function getApplicationsByCustomer(customerId: string) {
  return envelope("coreApp", { applications: getCoreApplicationsByCustomer(customerId) });
}
