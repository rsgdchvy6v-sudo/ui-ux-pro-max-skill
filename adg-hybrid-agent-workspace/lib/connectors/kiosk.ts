// Mock Kiosk connector: Emirates ID scan -> check-in.
import { kioskCheckin } from "../store";
import { envelope } from "./envelope";

export function checkIn(emiratesId: string) {
  const result = kioskCheckin(emiratesId);
  if ("error" in result) {
    return { status: "error" as const, source: "kiosk", timestamp: new Date().toISOString(), data: result };
  }
  return envelope("kiosk", result);
}
