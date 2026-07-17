// Mock Audit connector: log/list audit entries.
import { AuditEntityType, AuditSeverity, Role } from "../types";
import { addAudit, listAudit } from "../store";
import { envelope } from "./envelope";

export function list() {
  return envelope("audit", { entries: listAudit() });
}

export function log(entry: {
  actorUserId: string;
  actorRole: Role;
  actionType: string;
  entityType: AuditEntityType;
  entityId: string;
  interactionId?: string;
  customerId?: string;
  summary: string;
  before?: unknown;
  after?: unknown;
  channel?: "MANAGER_UI" | "SYSTEM" | "API";
  severity?: AuditSeverity;
}) {
  return envelope("audit", { entry: addAudit(entry) });
}
