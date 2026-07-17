// Mock Queue connector: issue/call/start/complete tokens.
import { listWaitingTokens, queueCallNext, queueComplete, queueStart } from "../store";
import { envelope } from "./envelope";

export function listWaiting() {
  return envelope("queue", { waiting: listWaitingTokens() });
}

export function callNext(interactionId: string, counter: string, agentUserId: string) {
  const result = queueCallNext(interactionId, counter, agentUserId);
  if ("error" in result) {
    return { status: "error" as const, source: "queue", timestamp: new Date().toISOString(), data: result };
  }
  return envelope("queue", result);
}

export function start(interactionId: string, actorUserId: string) {
  const result = queueStart(interactionId, actorUserId);
  if ("error" in result) {
    return { status: "error" as const, source: "queue", timestamp: new Date().toISOString(), data: result };
  }
  return envelope("queue", result);
}

export function complete(interactionId: string, actorUserId: string) {
  const result = queueComplete(interactionId, actorUserId);
  if ("error" in result) {
    return { status: "error" as const, source: "queue", timestamp: new Date().toISOString(), data: result };
  }
  return envelope("queue", result);
}
