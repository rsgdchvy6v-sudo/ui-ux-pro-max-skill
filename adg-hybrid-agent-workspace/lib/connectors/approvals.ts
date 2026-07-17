// Mock Approvals connector: create/decide/list approval requests.
import { ApprovalType } from "../types";
import { createApproval, decideApproval, listApprovals } from "../store";
import { envelope } from "./envelope";

export function list() {
  return envelope("approvals", { approvals: listApprovals() });
}

export function create(input: {
  interactionId: string;
  customerId: string;
  requestedByUserId: string;
  type: ApprovalType;
  title: string;
  justification: string;
  payload: Record<string, unknown>;
}) {
  return envelope("approvals", { approval: createApproval(input) });
}

export function decide(
  approvalId: string,
  decision: "APPROVED" | "REJECTED",
  decidedByUserId: string,
  decisionNotes: string
) {
  const result = decideApproval(approvalId, decision, decidedByUserId, decisionNotes);
  if (!result) {
    return { status: "error" as const, source: "approvals", timestamp: new Date().toISOString(), data: { error: "Approval not found." } };
  }
  return envelope("approvals", result);
}
