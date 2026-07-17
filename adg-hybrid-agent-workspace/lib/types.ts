// Core domain types for the ADG Unified Hybrid Agent Workspace demo.
// Everything here is mock/local data — no external systems are involved.

export type Role = "AGENT" | "MANAGER";
export type Presence = "AVAILABLE" | "BUSY";

export interface User {
  userId: string;
  name: string;
  role: Role;
  presence: Presence;
}

export interface Customer {
  customerId: string;
  emiratesId: string; // realistic fake, e.g. 784-1985-1234567-1
  uid?: string;
  name: string;
  phone: string;
  email: string;
  language: string;
  segment: string;
  flags: string[];
}

export type InteractionMode = "PHYSICAL" | "VIRTUAL";
export type InteractionType = "APPOINTMENT" | "WALKIN";
export type Priority = "LOW" | "MEDIUM" | "HIGH";
export type InteractionStatus =
  | "BOOKED"
  | "ARRIVED"
  | "CALLED"
  | "IN_SERVICE"
  | "COMPLETED"
  | "NO_SHOW"
  | "CANCELLED";

export interface AppointmentInfo {
  id: string;
  datetime: string; // ISO
  bookedVia: string; // e.g. "Mobile App"
  referenceNo: string;
  virtualJoinUrl?: string;
}

export interface QueueInfo {
  token?: string;
  counter?: string;
  checkedInAt?: string;
  calledAt?: string;
  startedAt?: string;
  completedAt?: string;
  waitSeconds?: number;
  servedByUserId?: string;
}

export interface Interaction {
  interactionId: string;
  customerId: string;
  mode: InteractionMode;
  type: InteractionType;
  assignedTo?: string;
  serviceName: string;
  priority: Priority;
  slaSecondsRemaining: number;
  status: InteractionStatus;
  appointment?: AppointmentInfo;
  queue?: QueueInfo;
  createdAt: string;
  updatedAt: string;
}

export type TimelineEventType =
  | "CASE"
  | "COMPLAINT"
  | "VISIT"
  | "CALL"
  | "EMAIL"
  | "CHAT"
  | "SOCIAL"
  | "APPOINTMENT";

export type Sensitivity = "NORMAL" | "SENSITIVE";

export interface TimelineEvent {
  id: string;
  customerId: string;
  interactionId?: string;
  type: TimelineEventType;
  title: string;
  details: string;
  createdAt: string;
  source: string;
  sensitivity?: Sensitivity;
}

export type DocStatus = "RECEIVED" | "MISSING" | "INVALID";

export interface RequiredDoc {
  name: string;
  status: DocStatus;
  waived?: boolean;
  waiverReason?: string;
  waiverExpiry?: string;
}

export interface CoreApplication {
  appId: string;
  customerId: string;
  interactionId?: string;
  serviceName: string;
  status: string;
  eligibility: {
    isEligible: boolean;
    reasons: string[];
    exceptionGranted?: boolean;
    exceptionNote?: string;
  };
  requiredDocs: RequiredDoc[];
  pendingSteps: string[];
}

export type ApprovalType =
  | "PRIORITY_OVERRIDE"
  | "DOCUMENT_WAIVER"
  | "EXCEPTION_ELIGIBILITY"
  | "MANAGER_REVIEW"
  | "FAST_TRACK"
  | "TRANSFER_APPROVAL";

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface ApprovalRequest {
  approvalId: string;
  interactionId: string;
  customerId: string;
  requestedByUserId: string;
  type: ApprovalType;
  title: string;
  justification: string;
  payload: Record<string, unknown>;
  status: ApprovalStatus;
  createdAt: string;
  decidedAt?: string;
  decidedByUserId?: string;
  decisionNotes?: string;
}

export type AuditEntityType =
  | "APPROVAL"
  | "INTERACTION"
  | "QUEUE"
  | "CUSTOMER"
  | "CORE_APPLICATION";

export type AuditChannel = "MANAGER_UI" | "SYSTEM" | "API";
export type AuditSeverity = "INFO" | "SECURITY" | "RISK";

export interface AuditLogEntry {
  auditId: string;
  actorUserId: string;
  actorRole: Role;
  actionType: string;
  entityType: AuditEntityType;
  entityId: string;
  interactionId?: string;
  customerId?: string;
  timestamp: string;
  summary: string;
  before?: unknown;
  after?: unknown;
  ip?: string;
  channel?: AuditChannel;
  severity?: AuditSeverity;
}
