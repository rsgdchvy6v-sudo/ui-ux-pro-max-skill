import { genId, nowIso } from "./ids";
import {
  seedApprovals,
  seedAudit,
  seedCoreApplications,
  seedCustomers,
  seedInteractions,
  seedTimeline,
  seedUsers,
} from "./seed";
import {
  ApprovalRequest,
  ApprovalStatus,
  ApprovalType,
  AuditEntityType,
  AuditLogEntry,
  AuditSeverity,
  CoreApplication,
  Customer,
  Interaction,
  InteractionStatus,
  Priority,
  Role,
  TimelineEvent,
  User,
} from "./types";

interface DB {
  users: User[];
  customers: Customer[];
  interactions: Interaction[];
  timeline: TimelineEvent[];
  coreApps: CoreApplication[];
  approvals: ApprovalRequest[];
  audit: AuditLogEntry[];
}

declare global {
  // eslint-disable-next-line no-var
  var __ADG_DB__: DB | undefined;
}

function seedDb(): DB {
  return {
    users: JSON.parse(JSON.stringify(seedUsers)),
    customers: JSON.parse(JSON.stringify(seedCustomers)),
    interactions: JSON.parse(JSON.stringify(seedInteractions)),
    timeline: JSON.parse(JSON.stringify(seedTimeline)),
    coreApps: JSON.parse(JSON.stringify(seedCoreApplications)),
    approvals: JSON.parse(JSON.stringify(seedApprovals)),
    audit: JSON.parse(JSON.stringify(seedAudit)),
  };
}

function db(): DB {
  if (!global.__ADG_DB__) {
    global.__ADG_DB__ = seedDb();
  }
  return global.__ADG_DB__;
}

export function resetDb(): void {
  global.__ADG_DB__ = seedDb();
}

// ---------- Users ----------
export function listUsers(): User[] {
  return db().users;
}
export function getUser(userId: string): User | undefined {
  return db().users.find((u) => u.userId === userId);
}

// ---------- Customers ----------
export function listCustomers(): Customer[] {
  return db().customers;
}
export function getCustomer(customerId: string): Customer | undefined {
  return db().customers.find((c) => c.customerId === customerId);
}

// ---------- Interactions ----------
export function listInteractions(): Interaction[] {
  return db().interactions;
}
export function getInteraction(interactionId: string): Interaction | undefined {
  return db().interactions.find((i) => i.interactionId === interactionId);
}

export function updateInteraction(
  interactionId: string,
  patch: Partial<Interaction>
): { before: Interaction; after: Interaction } | undefined {
  const list = db().interactions;
  const idx = list.findIndex((i) => i.interactionId === interactionId);
  if (idx === -1) return undefined;
  const before = JSON.parse(JSON.stringify(list[idx]));
  const merged: Interaction = {
    ...list[idx],
    ...patch,
    queue: patch.queue ? { ...list[idx].queue, ...patch.queue } : list[idx].queue,
    appointment: patch.appointment
      ? { ...list[idx].appointment, ...patch.appointment }
      : list[idx].appointment,
    updatedAt: nowIso(),
  };
  list[idx] = merged;
  return { before, after: JSON.parse(JSON.stringify(merged)) };
}

export function createInteraction(input: Omit<Interaction, "createdAt" | "updatedAt">): Interaction {
  const record: Interaction = { ...input, createdAt: nowIso(), updatedAt: nowIso() };
  db().interactions.push(record);
  return record;
}

// ---------- Timeline ----------
export function listTimelineForCustomer(customerId: string): TimelineEvent[] {
  return db()
    .timeline.filter((t) => t.customerId === customerId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function addTimelineEvent(
  event: Omit<TimelineEvent, "id" | "createdAt"> & { createdAt?: string }
): TimelineEvent {
  const record: TimelineEvent = {
    id: genId("EVT"),
    createdAt: event.createdAt ?? nowIso(),
    ...event,
  };
  db().timeline.push(record);
  return record;
}

// ---------- Core Applications ----------
export function listCoreApplications(): CoreApplication[] {
  return db().coreApps;
}
export function getCoreApplication(appId: string): CoreApplication | undefined {
  return db().coreApps.find((a) => a.appId === appId);
}
export function getCoreApplicationByInteraction(interactionId: string): CoreApplication | undefined {
  return db().coreApps.find((a) => a.interactionId === interactionId);
}
export function getCoreApplicationsByCustomer(customerId: string): CoreApplication[] {
  return db().coreApps.filter((a) => a.customerId === customerId);
}
export function updateCoreApplication(
  appId: string,
  patch: Partial<CoreApplication>
): { before: CoreApplication; after: CoreApplication } | undefined {
  const list = db().coreApps;
  const idx = list.findIndex((a) => a.appId === appId);
  if (idx === -1) return undefined;
  const before = JSON.parse(JSON.stringify(list[idx]));
  const merged = { ...list[idx], ...patch };
  list[idx] = merged;
  return { before, after: JSON.parse(JSON.stringify(merged)) };
}

// ---------- Approvals ----------
export function listApprovals(): ApprovalRequest[] {
  return db().approvals.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
export function getApproval(approvalId: string): ApprovalRequest | undefined {
  return db().approvals.find((a) => a.approvalId === approvalId);
}

export function createApproval(input: {
  interactionId: string;
  customerId: string;
  requestedByUserId: string;
  type: ApprovalType;
  title: string;
  justification: string;
  payload: Record<string, unknown>;
}): ApprovalRequest {
  const record: ApprovalRequest = {
    approvalId: genId("APR"),
    status: "PENDING",
    createdAt: nowIso(),
    ...input,
  };
  db().approvals.push(record);
  const requester = getUser(input.requestedByUserId);
  addAudit({
    actorUserId: input.requestedByUserId,
    actorRole: requester?.role ?? "AGENT",
    actionType: "APPROVAL_REQUESTED",
    entityType: "APPROVAL",
    entityId: record.approvalId,
    interactionId: input.interactionId,
    customerId: input.customerId,
    summary: `${requester?.name ?? input.requestedByUserId} requested ${input.type.replace(/_/g, " ")}: "${input.title}".`,
    after: record,
    channel: "API",
  });
  return record;
}

export interface ApprovalApplyResult {
  approvalBefore: ApprovalRequest;
  approvalAfter: ApprovalRequest;
  interactionBefore?: Interaction;
  interactionAfter?: Interaction;
  coreAppBefore?: CoreApplication;
  coreAppAfter?: CoreApplication;
}

export function decideApproval(
  approvalId: string,
  decision: Extract<ApprovalStatus, "APPROVED" | "REJECTED">,
  decidedByUserId: string,
  decisionNotes: string
): ApprovalApplyResult | undefined {
  const list = db().approvals;
  const idx = list.findIndex((a) => a.approvalId === approvalId);
  if (idx === -1) return undefined;
  const approvalBefore = JSON.parse(JSON.stringify(list[idx]));

  const updated: ApprovalRequest = {
    ...list[idx],
    status: decision,
    decidedAt: nowIso(),
    decidedByUserId,
    decisionNotes,
  };
  list[idx] = updated;

  const result: ApprovalApplyResult = {
    approvalBefore,
    approvalAfter: JSON.parse(JSON.stringify(updated)),
  };

  if (decision === "APPROVED") {
    const interaction = getInteraction(updated.interactionId);
    switch (updated.type) {
      case "PRIORITY_OVERRIDE": {
        const to = (updated.payload.to as Priority) ?? "HIGH";
        const diff = updateInteraction(updated.interactionId, { priority: to });
        if (diff) {
          result.interactionBefore = diff.before;
          result.interactionAfter = diff.after;
        }
        break;
      }
      case "DOCUMENT_WAIVER": {
        const app = getCoreApplicationByInteraction(updated.interactionId);
        if (app) {
          const docName = updated.payload.docName as string;
          const reason = (updated.payload.reason as string) ?? updated.justification;
          const expiryDays = (updated.payload.expiryDays as number) ?? 30;
          const waiverExpiry = new Date(Date.now() + expiryDays * 86400000).toISOString();
          const nextDocs = app.requiredDocs.map((d) =>
            d.name === docName
              ? { ...d, status: "RECEIVED" as const, waived: true, waiverReason: reason, waiverExpiry }
              : d
          );
          const diff = updateCoreApplication(app.appId, { requiredDocs: nextDocs });
          if (diff) {
            result.coreAppBefore = diff.before;
            result.coreAppAfter = diff.after;
          }
        }
        break;
      }
      case "EXCEPTION_ELIGIBILITY": {
        const app = getCoreApplicationByInteraction(updated.interactionId);
        if (app) {
          const diff = updateCoreApplication(app.appId, {
            eligibility: {
              ...app.eligibility,
              isEligible: true,
              exceptionGranted: true,
              exceptionNote: updated.decisionNotes,
            },
          });
          if (diff) {
            result.coreAppBefore = diff.before;
            result.coreAppAfter = diff.after;
          }
        }
        break;
      }
      case "FAST_TRACK": {
        const app = getCoreApplicationByInteraction(updated.interactionId);
        const skipSteps = (updated.payload.skipSteps as string[]) ?? [];
        if (app) {
          const diff = updateCoreApplication(app.appId, {
            pendingSteps: app.pendingSteps.filter((s) => !skipSteps.includes(s)),
          });
          if (diff) {
            result.coreAppBefore = diff.before;
            result.coreAppAfter = diff.after;
          }
        }
        const diffI = updateInteraction(updated.interactionId, { priority: "HIGH" });
        if (diffI) {
          result.interactionBefore = diffI.before;
          result.interactionAfter = diffI.after;
        }
        break;
      }
      case "TRANSFER_APPROVAL": {
        const toUserId = updated.payload.toUserId as string;
        const diff = updateInteraction(updated.interactionId, { assignedTo: toUserId });
        if (diff) {
          result.interactionBefore = diff.before;
          result.interactionAfter = diff.after;
        }
        break;
      }
      case "MANAGER_REVIEW":
      default:
        break;
    }

    addTimelineEvent({
      customerId: updated.customerId,
      interactionId: updated.interactionId,
      type: "CASE",
      title: `Approval granted: ${updated.title}`,
      details: `Manager approved "${updated.title}". Notes: ${decisionNotes}`,
      source: "Manager",
      sensitivity: "NORMAL",
    });
  } else {
    addTimelineEvent({
      customerId: updated.customerId,
      interactionId: updated.interactionId,
      type: "CASE",
      title: `Approval rejected: ${updated.title}`,
      details: `Manager rejected "${updated.title}". Notes: ${decisionNotes}`,
      source: "Manager",
      sensitivity: "NORMAL",
    });
  }

  return result;
}

// ---------- Audit ----------
export function listAudit(): AuditLogEntry[] {
  return db().audit.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export function addAudit(entry: {
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
}): AuditLogEntry {
  const record: AuditLogEntry = {
    auditId: genId("AUD"),
    timestamp: nowIso(),
    ip: "DEMO_LOCAL",
    severity: entry.severity ?? "INFO",
    channel: entry.channel ?? "SYSTEM",
    ...entry,
  };
  db().audit.push(record);
  return record;
}

// ---------- Kiosk ----------
export interface KioskCheckinResult {
  interaction: Interaction;
  created: boolean;
  matchedAppointment: boolean;
}

export function kioskCheckin(emiratesId: string): KioskCheckinResult | { error: string } {
  const customer = db().customers.find((c) => c.emiratesId === emiratesId);
  if (!customer) {
    return { error: "No customer found for that Emirates ID." };
  }

  const now = Date.now();
  const twoHoursMs = 2 * 3600 * 1000;
  const candidate = db().interactions.find((i) => {
    if (i.customerId !== customer.customerId) return false;
    if (i.status !== "BOOKED") return false;
    if (!i.appointment) return false;
    const apptTime = new Date(i.appointment.datetime).getTime();
    return Math.abs(apptTime - now) <= twoHoursMs;
  });

  const token = `A-${Math.floor(100 + Math.random() * 900)}`;

  if (candidate) {
    const diff = updateInteraction(candidate.interactionId, {
      status: "ARRIVED",
      queue: { token, checkedInAt: nowIso() },
    });
    addTimelineEvent({
      customerId: customer.customerId,
      interactionId: candidate.interactionId,
      type: "APPOINTMENT",
      title: "Appointment Checked-in (Kiosk)",
      details: `Kiosk check-in matched existing appointment ${candidate.appointment?.referenceNo}. Queue token ${token} issued.`,
      source: "Kiosk",
    });
    addAudit({
      actorUserId: "SYSTEM",
      actorRole: "AGENT",
      actionType: "KIOSK_CHECKIN",
      entityType: "INTERACTION",
      entityId: candidate.interactionId,
      interactionId: candidate.interactionId,
      customerId: customer.customerId,
      summary: `Kiosk check-in matched appointment for ${customer.name}; interaction marked ARRIVED, token ${token} issued.`,
      before: diff?.before,
      after: diff?.after,
      channel: "SYSTEM",
    });
    return { interaction: diff!.after, created: false, matchedAppointment: true };
  }

  const newInteraction = createInteraction({
    interactionId: genId("INT"),
    customerId: customer.customerId,
    mode: "PHYSICAL",
    type: "WALKIN",
    serviceName: "General Service Request",
    priority: "MEDIUM",
    slaSecondsRemaining: 1800,
    status: "ARRIVED",
    queue: { token, checkedInAt: nowIso() },
  });
  addTimelineEvent({
    customerId: customer.customerId,
    interactionId: newInteraction.interactionId,
    type: "VISIT",
    title: "Walk-in Registered",
    details: `Kiosk registered a new walk-in. Queue token ${token} issued.`,
    source: "Kiosk",
  });
  addAudit({
    actorUserId: "SYSTEM",
    actorRole: "AGENT",
    actionType: "WALKIN_REGISTERED",
    entityType: "INTERACTION",
    entityId: newInteraction.interactionId,
    interactionId: newInteraction.interactionId,
    customerId: customer.customerId,
    summary: `Walk-in registered for ${customer.name} via kiosk; token ${token} issued.`,
    after: newInteraction,
    channel: "SYSTEM",
  });
  return { interaction: newInteraction, created: true, matchedAppointment: false };
}

// ---------- Queue ----------
export function listWaitingTokens(): Interaction[] {
  return db().interactions.filter((i) => i.status === "ARRIVED" && i.queue?.token);
}

export function queueCallNext(
  interactionId: string,
  counter: string,
  agentUserId: string
): { before: Interaction; after: Interaction } | { error: string } {
  const interaction = getInteraction(interactionId);
  if (!interaction) return { error: "Interaction not found." };
  const diff = updateInteraction(interactionId, {
    status: "CALLED",
    assignedTo: agentUserId,
    queue: { ...interaction.queue, counter, calledAt: nowIso() },
  });
  if (!diff) return { error: "Update failed." };
  const agent = getUser(agentUserId);
  addAudit({
    actorUserId: agentUserId,
    actorRole: agent?.role ?? "AGENT",
    actionType: "TOKEN_CALLED",
    entityType: "QUEUE",
    entityId: interaction.queue?.token ?? interactionId,
    interactionId,
    customerId: interaction.customerId,
    summary: `Token ${interaction.queue?.token} called to ${counter} by ${agent?.name ?? agentUserId}.`,
    before: diff.before,
    after: diff.after,
    channel: "SYSTEM",
  });
  return diff;
}

export function queueStart(
  interactionId: string,
  actorUserId: string
): { before: Interaction; after: Interaction } | { error: string } {
  const interaction = getInteraction(interactionId);
  if (!interaction) return { error: "Interaction not found." };
  const diff = updateInteraction(interactionId, {
    status: "IN_SERVICE",
    queue: { ...interaction.queue, startedAt: nowIso() },
  });
  if (!diff) return { error: "Update failed." };
  const actor = getUser(actorUserId);
  addAudit({
    actorUserId,
    actorRole: actor?.role ?? "AGENT",
    actionType: "SERVICE_STARTED",
    entityType: "INTERACTION",
    entityId: interactionId,
    interactionId,
    customerId: interaction.customerId,
    summary: `Service started for ${interactionId} by ${actor?.name ?? actorUserId}.`,
    before: diff.before,
    after: diff.after,
    channel: "SYSTEM",
  });
  return diff;
}

export function queueComplete(
  interactionId: string,
  actorUserId: string
): { before: Interaction; after: Interaction } | { error: string } {
  const interaction = getInteraction(interactionId);
  if (!interaction) return { error: "Interaction not found." };
  const diff = updateInteraction(interactionId, {
    status: "COMPLETED",
    queue: { ...interaction.queue, completedAt: nowIso() },
  });
  if (!diff) return { error: "Update failed." };
  const actor = getUser(actorUserId);
  addTimelineEvent({
    customerId: interaction.customerId,
    interactionId,
    type: "CASE",
    title: "Interaction Completed",
    details: `Service "${interaction.serviceName}" completed by ${actor?.name ?? actorUserId}.`,
    source: actor?.name ?? "Agent",
  });
  addAudit({
    actorUserId,
    actorRole: actor?.role ?? "AGENT",
    actionType: "SERVICE_COMPLETED",
    entityType: "INTERACTION",
    entityId: interactionId,
    interactionId,
    customerId: interaction.customerId,
    summary: `${interactionId} completed by ${actor?.name ?? actorUserId}.`,
    before: diff.before,
    after: diff.after,
    channel: "SYSTEM",
  });
  return diff;
}

// ---------- Appointments ----------
export function createAppointment(input: {
  customerId: string;
  mode: "PHYSICAL" | "VIRTUAL";
  serviceName: string;
  datetime: string;
}): Interaction {
  const referenceNo = `REF-${Math.floor(10000 + Math.random() * 89999)}`;
  const interaction = createInteraction({
    interactionId: genId("INT"),
    customerId: input.customerId,
    mode: input.mode,
    type: "APPOINTMENT",
    serviceName: input.serviceName,
    priority: "MEDIUM",
    slaSecondsRemaining: 3600,
    status: "BOOKED",
    appointment: {
      id: genId("APT"),
      datetime: input.datetime,
      bookedVia: "Mobile App",
      referenceNo,
      virtualJoinUrl:
        input.mode === "VIRTUAL" ? `https://meet.demo.local/session/${referenceNo.toLowerCase()}` : undefined,
    },
  });
  addTimelineEvent({
    customerId: input.customerId,
    interactionId: interaction.interactionId,
    type: "APPOINTMENT",
    title: `${input.mode === "VIRTUAL" ? "Virtual" : "Physical"} appointment booked`,
    details: `${input.serviceName} appointment booked via mobile app for ${new Date(
      input.datetime
    ).toLocaleString()}. Reference ${referenceNo}.`,
    source: "Mobile App",
  });
  addAudit({
    actorUserId: "SYSTEM",
    actorRole: "AGENT",
    actionType: "APPOINTMENT_CREATED",
    entityType: "INTERACTION",
    entityId: interaction.interactionId,
    interactionId: interaction.interactionId,
    customerId: input.customerId,
    summary: `${input.mode} appointment booked via mobile app for ${input.serviceName} (ref ${referenceNo}).`,
    after: interaction,
    channel: "API",
  });
  return interaction;
}

// ---------- Reassign / Priority / Reporting helpers ----------
export function reassignInteraction(
  interactionId: string,
  toUserId: string,
  actorUserId: string
): { before: Interaction; after: Interaction } | { error: string } {
  const interaction = getInteraction(interactionId);
  if (!interaction) return { error: "Interaction not found." };
  const diff = updateInteraction(interactionId, { assignedTo: toUserId });
  if (!diff) return { error: "Update failed." };
  const actor = getUser(actorUserId);
  const toUser = getUser(toUserId);
  addAudit({
    actorUserId,
    actorRole: actor?.role ?? "MANAGER",
    actionType: "INTERACTION_REASSIGNED",
    entityType: "INTERACTION",
    entityId: interactionId,
    interactionId,
    customerId: interaction.customerId,
    summary: `${actor?.name ?? actorUserId} reassigned ${interactionId} to ${toUser?.name ?? toUserId}.`,
    before: diff.before,
    after: diff.after,
    channel: "MANAGER_UI",
  });
  return diff;
}

export function overridePriority(
  interactionId: string,
  priority: Priority,
  actorUserId: string
): { before: Interaction; after: Interaction } | { error: string } {
  const interaction = getInteraction(interactionId);
  if (!interaction) return { error: "Interaction not found." };
  const diff = updateInteraction(interactionId, { priority });
  if (!diff) return { error: "Update failed." };
  const actor = getUser(actorUserId);
  addAudit({
    actorUserId,
    actorRole: actor?.role ?? "MANAGER",
    actionType: "PRIORITY_OVERRIDE",
    entityType: "INTERACTION",
    entityId: interactionId,
    interactionId,
    customerId: interaction.customerId,
    summary: `${actor?.name ?? actorUserId} overrode priority on ${interactionId} to ${priority}.`,
    before: diff.before,
    after: diff.after,
    channel: "MANAGER_UI",
  });
  return diff;
}

export function forceCallToken(
  interactionId: string,
  counter: string,
  toUserId: string,
  actorUserId: string
): { before: Interaction; after: Interaction } | { error: string } {
  const interaction = getInteraction(interactionId);
  if (!interaction) return { error: "Interaction not found." };
  const diff = updateInteraction(interactionId, {
    status: "CALLED",
    assignedTo: toUserId,
    queue: { ...interaction.queue, counter, calledAt: nowIso() },
  });
  if (!diff) return { error: "Update failed." };
  const actor = getUser(actorUserId);
  const toUser = getUser(toUserId);
  addAudit({
    actorUserId,
    actorRole: actor?.role ?? "MANAGER",
    actionType: "FORCE_CALL_TOKEN",
    entityType: "QUEUE",
    entityId: interaction.queue?.token ?? interactionId,
    interactionId,
    customerId: interaction.customerId,
    summary: `${actor?.name ?? actorUserId} force-called token ${interaction.queue?.token} to ${counter} for ${
      toUser?.name ?? toUserId
    }.`,
    before: diff.before,
    after: diff.after,
    channel: "MANAGER_UI",
    severity: "RISK",
  });
  return diff;
}

export function setInteractionStatus(
  interactionId: string,
  status: InteractionStatus,
  actorUserId: string
): { before: Interaction; after: Interaction } | { error: string } {
  const interaction = getInteraction(interactionId);
  if (!interaction) return { error: "Interaction not found." };
  const diff = updateInteraction(interactionId, { status });
  if (!diff) return { error: "Update failed." };
  const actor = getUser(actorUserId);
  addAudit({
    actorUserId,
    actorRole: actor?.role ?? "AGENT",
    actionType: "INTERACTION_STATUS_CHANGED",
    entityType: "INTERACTION",
    entityId: interactionId,
    interactionId,
    customerId: interaction.customerId,
    summary: `${actor?.name ?? actorUserId} changed ${interactionId} status to ${status}.`,
    before: diff.before,
    after: diff.after,
    channel: actor?.role === "MANAGER" ? "MANAGER_UI" : "SYSTEM",
  });
  return diff;
}
