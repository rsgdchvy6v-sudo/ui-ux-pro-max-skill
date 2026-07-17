import { Role, TimelineEvent } from "./types";

// Central policy for masking sensitive customer data based on viewer role.
// Managers always see full values. Agents (and Managers using "View as Agent")
// see masked values. This is the single source of truth for masking — every
// API route and UI surface should route sensitive fields through here rather
// than re-implementing ad-hoc masking.

export type FieldName =
  | "emiratesId"
  | "uid"
  | "email"
  | "phone"
  | "timelineDetails";

export function maskEmiratesId(value: string): string {
  // 784-1985-1234567-1 -> 784-****-*****67-1
  const parts = value.split("-");
  if (parts.length !== 4) return "***-****-*******-*";
  const [area, year, serial, check] = parts;
  const maskedSerial = serial.length > 2 ? "*".repeat(serial.length - 2) + serial.slice(-2) : serial;
  return `${area}-****-${maskedSerial}-${check}`;
}

export function maskUid(value: string): string {
  if (value.length <= 3) return "*".repeat(value.length);
  return "*".repeat(value.length - 3) + value.slice(-3);
}

export function maskEmail(value: string): string {
  const [user, domain] = value.split("@");
  if (!domain) return "****";
  const visible = user.slice(0, 1);
  return `${visible}${"*".repeat(Math.max(user.length - 1, 3))}@${domain}`;
}

export function maskPhone(value: string): string {
  const digits = value.replace(/[^0-9]/g, "");
  const last2 = digits.slice(-2);
  return value.replace(/\d/g, "•").replace(/•{2}$/, last2);
}

const SENSITIVE_DETAILS_REDACTED =
  "[Redacted — sensitive event. Manager review required for full details.]";

export function maskTimelineDetails(event: Pick<TimelineEvent, "details" | "sensitivity">): string {
  if (event.sensitivity === "SENSITIVE") return SENSITIVE_DETAILS_REDACTED;
  return event.details;
}

/**
 * Central masking entry point: (role, fieldName, value) -> masked/unmasked output.
 * `role` should already reflect any "View as Agent" impersonation applied by the caller.
 */
export function applyVisibility(
  role: Role,
  fieldName: FieldName,
  value: string,
  opts?: { sensitivity?: TimelineEvent["sensitivity"] }
): string {
  if (role === "MANAGER") return value;

  switch (fieldName) {
    case "emiratesId":
      return maskEmiratesId(value);
    case "uid":
      return maskUid(value);
    case "email":
      return maskEmail(value);
    case "phone":
      return maskPhone(value);
    case "timelineDetails":
      return maskTimelineDetails({ details: value, sensitivity: opts?.sensitivity });
    default:
      return value;
  }
}

export function effectiveRole(actualRole: Role, viewAsAgent: boolean): Role {
  return actualRole === "MANAGER" && viewAsAgent ? "AGENT" : actualRole;
}
