export function eventFingerprint(source: string, title: string): string {
  return `${source.toLowerCase()}|${title.trim().toLowerCase()}`;
}

export function shouldOpenIncident(eventCount: number, threshold: number): boolean {
  return eventCount >= threshold;
}

export const STATUSES = ["open", "acknowledged", "resolved"] as const;
export type IncidentStatus = (typeof STATUSES)[number];

export function nextStatus(current: IncidentStatus, action: "ack" | "resolve" | "reopen"): IncidentStatus {
  if (action === "ack" && current === "open") return "acknowledged";
  if (action === "resolve") return "resolved";
  if (action === "reopen") return "open";
  return current;
}
