import { describe, it, expect, vi, beforeEach } from "vitest";

const { dbMock, getSessionMock } = vi.hoisted(() => ({
  dbMock: {
    featureRequest: { findFirst: vi.fn(), create: vi.fn() },
    creative: { findFirst: vi.fn() },
  },
  getSessionMock: vi.fn(),
}));
vi.mock("@/lib/db", () => ({ db: dbMock }));
vi.mock("@/lib/session", () => ({ getSession: getSessionMock }));

import { submitFeatureRequest } from "@/lib/feature-request-action";

function formData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  // Signed in, and "creative-1" is this member's own approved listing.
  getSessionMock.mockResolvedValue({ userId: "user-1", email: "sara@example.com", role: "PAID" });
  dbMock.creative.findFirst.mockResolvedValue({ id: "creative-1", status: "APPROVED" });
});

describe("submitFeatureRequest authorization", () => {
  it("refuses an anonymous caller", async () => {
    getSessionMock.mockResolvedValue(null);
    const result = await submitFeatureRequest("creative-1", null, formData({ reason: "Please feature my festival run this month." }));
    expect(result).toEqual({ error: expect.stringContaining("sign-in") });
    expect(dbMock.featureRequest.create).not.toHaveBeenCalled();
  });

  it("refuses a request for somebody else's profile", async () => {
    // Signed in as the owner of creative-1, asking to feature creative-2.
    const result = await submitFeatureRequest("creative-2", null, formData({ reason: "Please feature my festival run this month." }));
    expect(result).toEqual({ error: expect.stringContaining("your own profile") });
    expect(dbMock.featureRequest.create).not.toHaveBeenCalled();
  });

  it("refuses a member with no linked creative listing", async () => {
    dbMock.creative.findFirst.mockResolvedValue(null);
    const result = await submitFeatureRequest("creative-1", null, formData({ reason: "Please feature my festival run this month." }));
    expect(result).toEqual({ error: expect.stringContaining("your own profile") });
    expect(dbMock.featureRequest.create).not.toHaveBeenCalled();
  });

  it("refuses a listing that hasn't been approved yet", async () => {
    dbMock.creative.findFirst.mockResolvedValue({ id: "creative-1", status: "PENDING" });
    const result = await submitFeatureRequest("creative-1", null, formData({ reason: "Please feature my festival run this month." }));
    expect(result).toEqual({ error: expect.stringContaining("approved") });
    expect(dbMock.featureRequest.create).not.toHaveBeenCalled();
  });
});

describe("submitFeatureRequest", () => {
  it("rejects a reason that's too short", async () => {
    const result = await submitFeatureRequest("creative-1", null, formData({ reason: "too short" }));
    expect(result).toEqual({ error: expect.stringContaining("20 characters") });
    expect(dbMock.featureRequest.create).not.toHaveBeenCalled();
  });

  it("blocks a second request while one is already pending", async () => {
    dbMock.featureRequest.findFirst.mockResolvedValue({ id: "existing-request" });
    const result = await submitFeatureRequest(
      "creative-1",
      null,
      formData({ reason: "I'd love to be featured this month for our festival run." })
    );
    expect(result).toEqual({ error: expect.stringContaining("already have a pending") });
    expect(dbMock.featureRequest.create).not.toHaveBeenCalled();
  });

  it("creates the request when none is pending", async () => {
    dbMock.featureRequest.findFirst.mockResolvedValue(null);
    dbMock.featureRequest.create.mockResolvedValue({});

    const result = await submitFeatureRequest(
      "creative-1",
      null,
      formData({ reason: "I'd love to be featured this month for our festival run." })
    );

    expect(result).toEqual({ success: true });
    expect(dbMock.featureRequest.create).toHaveBeenCalledWith({
      data: { creativeId: "creative-1", reason: "I'd love to be featured this month for our festival run." },
    });
  });
});
