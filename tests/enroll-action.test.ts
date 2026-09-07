import { describe, it, expect, vi, beforeEach } from "vitest";

const { dbMock, redirectMock, sendEnrollmentNotificationMock, discardEnrollmentDraftMock, getSessionMock } = vi.hoisted(() => ({
  dbMock: { creative: { findMany: vi.fn(), create: vi.fn() } },
  redirectMock: vi.fn(),
  sendEnrollmentNotificationMock: vi.fn(async () => {}),
  discardEnrollmentDraftMock: vi.fn(async () => {}),
  getSessionMock: vi.fn(),
}));
vi.mock("@/lib/db", () => ({ db: dbMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/lib/email", () => ({ sendEnrollmentNotification: sendEnrollmentNotificationMock }));
vi.mock("@/lib/enroll-draft-actions", () => ({ discardEnrollmentDraft: discardEnrollmentDraftMock }));
vi.mock("@/lib/session", () => ({ getSession: getSessionMock }));

import { enrollAction, reportEnrollmentBlockers } from "@/lib/enroll-action";

const LONG_BIO = "A".repeat(120);

const SIGNED_IN_SESSION = { userId: "user-1", email: "sara@example.com", role: "UNPAID" as const };

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
  getSessionMock.mockResolvedValue(SIGNED_IN_SESSION);
});

describe("enrollAction", () => {
  it("rejects submission from a signed-out visitor", async () => {
    getSessionMock.mockResolvedValue(null);

    const result = await enrollAction(
      null,
      formData({
        firstName: "Sara",
        lastName: "Khan",
        email: "sara@example.com",
        headshotLink: "https://example.com/headshot.jpg",
        bio: LONG_BIO,
        experienceLevel: "Established (5–8 years)",
      })
    );

    // Asserted on intent, not on the exact sentence: what matters is that the
    // applicant is told their sign-in is the problem and that nothing was
    // written, not the wording, which is copy we tune.
    expect(result).toEqual({ error: expect.stringMatching(/sign.?in/i) });
    expect(dbMock.creative.create).not.toHaveBeenCalled();
  });

  // A failed write used to throw straight out of the action, which reaches the
  // applicant as a submit that does nothing at all — the 09/01 report. It has to
  // come back as something they can read.
  it("reports a database failure instead of throwing", async () => {
    dbMock.creative.create.mockRejectedValue(new Error("connection lost"));

    const result = await enrollAction(
      null,
      formData({
        firstName: "Sara",
        lastName: "Khan",
        email: "sara@example.com",
        headshotLink: "data:image/jpeg;base64,AAAA",
        bio: LONG_BIO,
        experienceLevel: "Established (5-8 years)",
      })
    );

    expect(result).toEqual({ error: expect.stringContaining("nothing you typed has been lost") });
    // The draft is deliberately left alone so they can retry.
    expect(discardEnrollmentDraftMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  // Fixing one problem only to be told about the next is what makes a form feel
  // broken, so every failing rule comes back at once.
  it("reports every validation problem at once, not just the first", async () => {
    const result = await enrollAction(
      null,
      formData({
        firstName: "",
        lastName: "Khan",
        email: "not-an-email",
        headshotLink: "",
        bio: "too short",
        experienceLevel: "",
      })
    );

    const message = (result as { error: string }).error;
    expect(message).toContain("First name");
    expect(message).toContain("valid email");
    expect(message).toContain("headshot");
    expect(message).toContain("experience level");
  });

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

  // These five fields are captured by the form and validated by the schema but
  // were never wired into db.creative.create — silently dropped on every
  // application until this test was added to pin the fix in place.
  it("persists howHeard, specialSkills, additionalNotes, yearsExperience, and completedProjects", async () => {
    dbMock.creative.create.mockResolvedValue({});

    await enrollAction(
      null,
      formData({
        firstName: "Sara",
        lastName: "Khan",
        email: "sara@example.com",
        headshotLink: "data:image/jpeg;base64,AAAA",
        bio: LONG_BIO,
        experienceLevel: "Established (5–8 years)",
        howHeard: "Instagram",
        specialSkills: "Steadicam operation",
        additionalNotes: "Available weekends only",
        yearsExperience: "6",
        completedProjects: "14",
      })
    );

    expect(dbMock.creative.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          howHeard: "Instagram",
          specialSkills: "Steadicam operation",
          additionalNotes: "Available weekends only",
          yearsExperience: "6",
          completedProjects: "14",
        }),
      })
    );
  });

  // 09/06: two applicants filled out the entire application, including a
  // website like "www.example.com" with no scheme, and Submit silently did
  // nothing — no request ever reached this action (nothing in the server
  // logs), because the field was still `type="url"` at the time and browser
  // constraint validation refuses to submit an invalid, unfocusable control
  // sitting on a CSS-hidden step (gotcha #10's steps-stay-mounted pattern).
  // The field is plain text now, so the value always reaches here — this
  // pins the other half of the fix: a schemeless value must still resolve to
  // a real absolute URL wherever it's rendered as an <a href>, not the bare
  // domain (which would render as a broken relative link).
  it("adds a scheme to a website and work-sample link that arrive without one", async () => {
    dbMock.creative.create.mockResolvedValue({});

    await enrollAction(
      null,
      formData({
        firstName: "Ahmed",
        lastName: "Khan",
        email: "ahmed@example.com",
        headshotLink: "data:image/jpeg;base64,AAAA",
        bio: LONG_BIO,
        experienceLevel: "Accomplished Professional (7-12 years / 15+ projects)",
        website: "www.example.com",
        ws1Title: "Night Bus",
        ws1Link: "vimeo.com/12345",
      })
    );

    const { data } = dbMock.creative.create.mock.calls[0][0];
    expect(data.website).toBe("https://www.example.com");
    expect(data.workSamples[0].link).toBe("https://vimeo.com/12345");
  });

  // A link that already has a scheme (including a non-http one) must pass
  // through unchanged rather than getting a second "https://" prefixed.
  it("leaves a website that already has a scheme untouched", async () => {
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
        website: "http://example.com",
      })
    );

    const { data } = dbMock.creative.create.mock.calls[0][0];
    expect(data.website).toBe("http://example.com");
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

describe("reportEnrollmentBlockers", () => {
  it("logs only allow-listed field names and never applicant-provided values", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    await reportEnrollmentBlockers(["bio", "headshotLink", "private-email@example.com", "bio"]);

    expect(warn).toHaveBeenCalledWith(
      "[enroll] client blocked before submit: bio, headshotLink"
    );
    warn.mockRestore();
  });
});
