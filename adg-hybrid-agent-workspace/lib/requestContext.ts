import { NextRequest } from "next/server";
import { getUser } from "./store";
import { User } from "./types";

export interface Actor {
  user: User;
}

export function getActor(req: NextRequest): Actor | null {
  const userId = req.headers.get("x-user-id");
  if (!userId) return null;
  const user = getUser(userId);
  if (!user) return null;
  return { user };
}
