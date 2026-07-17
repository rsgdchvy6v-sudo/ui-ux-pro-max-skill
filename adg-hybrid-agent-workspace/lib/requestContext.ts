import { NextRequest } from "next/server";
import { getUser } from "./store";
import { effectiveRole } from "./visibilityPolicy";
import { Role, User } from "./types";

export interface Actor {
  user: User;
  viewAsAgent: boolean;
  role: Role; // effective role after impersonation
}

export function getActor(req: NextRequest): Actor | null {
  const userId = req.headers.get("x-user-id");
  if (!userId) return null;
  const user = getUser(userId);
  if (!user) return null;
  const viewAsAgent = req.headers.get("x-view-as-agent") === "true";
  return { user, viewAsAgent, role: effectiveRole(user.role, viewAsAgent) };
}
