// Every mock connector returns this envelope shape so the UI/API layer can be
// swapped for a real integration later without changing callers.
export interface ConnectorEnvelope<T> {
  status: "ok" | "error";
  source: string;
  timestamp: string;
  data: T;
}

export function envelope<T>(source: string, data: T): ConnectorEnvelope<T> {
  return { status: "ok", source, timestamp: new Date().toISOString(), data };
}
