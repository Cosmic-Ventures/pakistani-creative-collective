import { describe, it, expect, vi, beforeEach } from "vitest";

const { dbMock, redirectMock, sendEnrollmentNotificationMock } = vi.hoisted(() => ({
  dbMock: { creative: { findMany: vi.fn(), create: vi.fn() } },
  redirectMock: vi.fn(),
  sendEnrollmentNotificationMock: vi.fn(async () => {}),
}));
vi.mock("@/lib/db", () => ({ db: dbMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/lib/email", () => ({ sendEnrollmentNotification: sendEnrollmentNotificationMock }));

import { enrollAction } from "@/lib/enroll-action";

const LONG_BIO = "A".repeat(120);

function formData(fields: Record<string, string | string[]>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    if (Array.isArray(v)) v.forEach((val) => fd.append(k, val));
    else fd.set(k, v);
  }
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  dbMock.creative.findMany.mockResolvedValue([]);
});

describe("enrollAction", () => {
  it("rejects a bio that's too short", async () => {
    const result = await enrollAction(
      null,
      formData({
        firstName: "Sara",
        lastName: "Khan",
        email: "sara@example.com",
        headshotLink: "https://example.com/headshot.jpg",
        bio: "too short",
        experienceLevel: "Established (5–8 years)",
        availability: "Available now",
      })
    );
    expect(result).toEqual({ error: expect.stringContaining("100 characters") });
    expect(dbMock.creative.create).not.toHaveBeenCalled();
  });

  it("rejects an unselected experience level", async () => {
    const result = await enrollAction(
      null,
      formData({
        firstName: "Sara",
        lastName: "Khan",
        email: "sara@example.com",
        headshotLink: "https://example.com/headshot.jpg",
        bio: LONG_BIO,
        experienceLevel: "",
        availability: "Available now",
      })
    );
    expect(result).toEqual({ error: expect.stringContaining("experience level") });
  });

  it("creates a creative with a unique slug and notifies on success", async () => {
    dbMock.creative.create.mockResolvedValue({});

    await enrollAction(
      null,
      formData({
        firstName: "Sara",
        lastName: "Khan",
        email: "sara@example.com",
        headshotLink: "https://example.com/headshot.jpg",
        bio: LONG_BIO,
        experienceLevel: "Established (5–8 years)",
        availability: "Available now",
        location: "Los Angeles, CA",
        travel: "Will travel/open to international work",
        roles: ["Director", "Writer"],
        mediums: ["Short Film"],
        languagesCheck: ["English", "Urdu"],
        languages: "French",
        collaborationPreferences: ["Established Creative", "Veteran Creative"],
      })
    );

    expect(dbMock.creative.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          slug: "sara-khan",
          firstName: "Sara",
          lastName: "Khan",
          location: "Los Angeles, CA",
          travel: "Will travel/open to international work",
          roles: ["Director", "Writer"],
          mediums: ["Short Film"],
          languages: ["English", "Urdu", "French"],
          collaborationPreferences: "Established Creative, Veteran Creative",
        }),
      })
    );
    expect(sendEnrollmentNotificationMock).toHaveBeenCalledWith("Sara", "Khan", "sara@example.com");
    expect(redirectMock).toHaveBeenCalledWith("/enroll/success");
  });

  it("appends a numeric suffix when the slug is already taken", async () => {
    dbMock.creative.findMany.mockResolvedValue([{ slug: "sara-khan" }, { slug: "sara-khan-2" }]);
    dbMock.creative.create.mockResolvedValue({});

    await enrollAction(
      null,
      formData({
        firstName: "Sara",
        lastName: "Khan",
        email: "sara2@example.com",
        headshotLink: "https://example.com/headshot.jpg",
        bio: LONG_BIO,
        experienceLevel: "Established (5–8 years)",
        availability: "Available now",
      })
    );

    expect(dbMock.creative.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ slug: "sara-khan-3" }) })
    );
  });
});
