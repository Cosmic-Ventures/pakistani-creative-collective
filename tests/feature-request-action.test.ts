import { describe, it, expect, vi, beforeEach } from "vitest";

const { dbMock } = vi.hoisted(() => ({
  dbMock: { featureRequest: { findFirst: vi.fn(), create: vi.fn() } },
}));
vi.mock("@/lib/db", () => ({ db: dbMock }));

import { submitFeatureRequest } from "@/lib/feature-request-action";

function formData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
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
