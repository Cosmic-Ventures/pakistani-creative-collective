import { describe, it, expect, vi, beforeEach } from "vitest";

const { dbMock, redirectMock, sendEnrollmentNotificationMock, discardEnrollmentDraftMock } = vi.hoisted(() => ({
  dbMock: { creative: { findMany: vi.fn(), create: vi.fn() } },
  redirectMock: vi.fn(),
  sendEnrollmentNotificationMock: vi.fn(async () => {}),
  discardEnrollmentDraftMock: vi.fn(async () => {}),
}));
vi.mock("@/lib/db", () => ({ db: dbMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/lib/email", () => ({ sendEnrollmentNotification: sendEnrollmentNotificationMock }));
vi.mock("@/lib/enroll-draft-actions", () => ({ discardEnrollmentDraft: discardEnrollmentDraftMock }));

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
    expect(sendEnrollmentNotificationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: "Sara",
        lastName: "Khan",
        email: "sara@example.com",
        bio: LONG_BIO,
        location: "Los Angeles, CA",
        roles: ["Director", "Writer"],
        experienceLevel: "Established",
      })
    );
    expect(discardEnrollmentDraftMock).toHaveBeenCalled();
    expect(redirectMock).toHaveBeenCalledWith("/enroll/success");
  });

  // The client had to fill every field to get through the form. Only essentials
  // gate submission now (08/08 round): no portfolio URL, no availability, no
  // references and no work samples must still be a valid application.
  it("accepts an application with only the essential fields", async () => {
    dbMock.creative.create.mockResolvedValue({});

    const result = await enrollAction(
      null,
      formData({
        firstName: "Bilal",
        lastName: "Ahmed",
        email: "bilal@example.com",
        headshotLink: "data:image/jpeg;base64,AAAA",
        bio: LONG_BIO,
        experienceLevel: "Emerging Creative (0-2 years / 1-3 projects)",
        roles: ["Director"],
        mediums: ["Short Film"],
      })
    );

    expect(result).toBeUndefined();
    expect(dbMock.creative.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          slug: "bilal-ahmed",
          experienceLevel: "Emerging Creative",
          availability: undefined,
          website: undefined,
          references: undefined,
        }),
      })
    );
    expect(redirectMock).toHaveBeenCalledWith("/enroll/success");
  });

  // The portfolio URL is optional, so the review email falls back to whichever
  // link the applicant did give rather than showing nothing.
  it("falls back to another profile link when no website was given", async () => {
    dbMock.creative.create.mockResolvedValue({});

    await enrollAction(
      null,
      formData({
        firstName: "Hina",
        lastName: "Raza",
        email: "hina@example.com",
        headshotLink: "data:image/jpeg;base64,AAAA",
        bio: LONG_BIO,
        experienceLevel: "Developing Professional (2-4 years / 4-8 projects)",
        website: "",
        instagram: "@hinaraza",
      })
    );

    expect(sendEnrollmentNotificationMock).toHaveBeenCalledWith(
      expect.objectContaining({ portfolioLink: "@hinaraza" })
    );
  });

  // Blank optional fields must be stored as absent, not "", or the profile
  // page's `website ?? publicLink` fallback is shadowed by an empty string.
  it("stores skipped optional fields as undefined rather than empty strings", async () => {
    dbMock.creative.create.mockResolvedValue({});

    await enrollAction(
      null,
      formData({
        firstName: "Noor",
        lastName: "Siddiqui",
        email: "noor@example.com",
        headshotLink: "data:image/jpeg;base64,AAAA",
        bio: LONG_BIO,
        experienceLevel: "Veteran Creative (12+ years / 20+ projects)",
        website: "   ",
        instagram: "",
        phone: "",
        location: "  Karachi  ",
      })
    );

    const { data } = dbMock.creative.create.mock.calls[0][0];
    expect(data.website).toBeUndefined();
    expect(data.instagram).toBeUndefined();
    expect(data.phone).toBeUndefined();
    expect(data.location).toBe("Karachi");
  });

  // Work-sample roles come from a multi-select whose values contain spaces
  // ("Camera Operator"); they must survive round-tripping as separate entries.
  it("keeps multi-word work sample roles intact", async () => {
    dbMock.creative.create.mockResolvedValue({});

    await enrollAction(
      null,
      formData({
        firstName: "Sara",
        lastName: "Khan",
        email: "sara@example.com",
        headshotLink: "data:image/jpeg;base64,AAAA",
        bio: LONG_BIO,
        experienceLevel: "Established Creative (4-7 years / 10+ projects)",
        ws1Title: "Night Bus",
        ws1Medium: "Short Film",
        ws1RoleSelect: ["Camera Operator", "Director of Photography (DP/Cinematographer)"],
        ws1RoleOther: "Second Unit Lead",
      })
    );

    expect(dbMock.creative.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          workSamples: [
            expect.objectContaining({
              title: "Night Bus",
              role: "Camera Operator, Director of Photography (DP/Cinematographer), Second Unit Lead",
            }),
          ],
        }),
      })
    );
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
