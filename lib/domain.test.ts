import { describe, expect, it } from "vitest";
      import { eventFingerprint, nextStatus, shouldOpenIncident } from "./domain";

describe("eventFingerprint", () => {
  it("is case-insensitive", () => {
    expect(eventFingerprint("nginx", "5xx burst")).toBe(eventFingerprint("NGINX", "5XX BURST"));
  });
});

describe("shouldOpenIncident", () => {
  it("opens at threshold", () => {
    expect(shouldOpenIncident(3, 3)).toBe(true);
    expect(shouldOpenIncident(2, 3)).toBe(false);
  });
});

describe("nextStatus", () => {
  it("does not ack a resolved row into acknowledged", () => {
    expect(nextStatus("resolved", "ack")).toBe("resolved");
  });
});
