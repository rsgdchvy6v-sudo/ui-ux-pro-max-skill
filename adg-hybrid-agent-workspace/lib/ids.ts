import { randomUUID } from "crypto";

export function genId(prefix: string): string {
  return `${prefix}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
