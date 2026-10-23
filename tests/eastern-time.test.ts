import { describe, expect, it } from "vitest";
import { dateToEastern, easternToDate } from "@/lib/eastern-time";

describe("eastern time", () => {
  it("reads Oct 25 9am as EDT (UTC-4)", () => {
    expect(easternToDate("2026-10-25T09:00")?.toISOString()).toBe("2026-10-25T13:00:00.000Z");
  });
  it("reads a winter time as EST (UTC-5)", () => {
    expect(easternToDate("2026-11-14T09:00")?.toISOString()).toBe("2026-11-14T14:00:00.000Z");
  });
  it("round-trips", () => {
    expect(dateToEastern(easternToDate("2026-10-25T09:00")!)).toBe("2026-10-25T09:00");
  });
  it("rejects junk", () => {
    expect(easternToDate("soon")).toBeNull();
  });
});
