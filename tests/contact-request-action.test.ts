import { describe, it, expect, vi, beforeEach } from "vitest";

const { dbMock, sendContactRequestNotificationMock, getSessionMock } = vi.hoisted(() => ({
  dbMock: {
    contactRequest: { create: vi.fn() },
    creative: { findFirst: vi.fn() },
  },
  sendContactRequestNotificationMock: vi.fn(async () => {}),
  getSessionMock: vi.fn(),
}));
vi.mock("@/lib/db", () => ({ db: dbMock }));
vi.mock("@/lib/email", () => ({
  sendContactRequestNotification: sendContactRequestNotificationMock,
}));
vi.mock("@/lib/session", () => ({ getSession: getSessionMock }));

import { submitContactRequest } from "@/lib/contact-request-action";

function formData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

const VALID_FIELDS = {
  requesterName: "Jordan Lee",
  requesterEmail: "jordan@studio.com",
  company: "Lee Studios",
  experienceLevel: "Established Creative (4-7 years / 10+ projects)",
  requestType: "Collaboration Opportunity",
  message: "We would love to discuss a potential collaboration on an upcoming feature film project.",
  timeline: "Within the next month",
  consentAccurate: "on",
  consentRouting: "on",
  consentDiscretion: "on",
};

beforeEach(() => {
  vi.clearAllMocks();
  // A signed-in paid member contacting an approved creative — the happy path
  // the validation tests below are about.
  getSessionMock.mockResolvedValue({ userId: "user-1", email: "jordan@studio.com", role: "PAID" });
  dbMock.creative.findFirst.mockResolvedValue({ id: "creative-1" });
});

describe("submitContactRequest authorization", () => {
  it("refuses an anonymous caller even with a valid body", async () => {
    getSessionMock.mockResolvedValue(null);
    const result = await submitContactRequest("creative-1", null, formData(VALID_FIELDS));
    expect(result).toEqual({ error: expect.stringContaining("sign-in") });
    expect(dbMock.contactRequest.create).not.toHaveBeenCalled();
  });

  it("refuses an unpaid member", async () => {
    getSessionMock.mockResolvedValue({ userId: "user-9", email: "free@demo.test", role: "UNPAID" });
    const result = await submitContactRequest("creative-1", null, formData(VALID_FIELDS));
    expect(result).toEqual({ error: expect.stringContaining("paid membership") });
    expect(dbMock.contactRequest.create).not.toHaveBeenCalled();
  });

  it("refuses a creative who isn't approved/published", async () => {
    dbMock.creative.findFirst.mockResolvedValue(null);
    const result = await submitContactRequest("creative-pending", null, formData(VALID_FIELDS));
    expect(result).toEqual({ error: expect.stringContaining("isn't available") });
    expect(dbMock.contactRequest.create).not.toHaveBeenCalled();
  });

  it("attributes the request to the session, not to a caller-supplied id", async () => {
    getSessionMock.mockResolvedValue({ userId: "real-user", email: "jordan@studio.com", role: "PAID" });
    dbMock.contactRequest.create.mockResolvedValue({
      creative: { firstName: "Sara", lastName: "Khan", email: "sara@example.com" },
    });

    // "userId" in the body is exactly what an attacker would try to set.
    await submitContactRequest("creative-1", null, formData({ ...VALID_FIELDS, userId: "victim-user" }));

    expect(dbMock.contactRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: "real-user" }) })
    );
  });
});

describe("submitContactRequest", () => {
  it("rejects when consent checkboxes are missing", async () => {
    const { consentAccurate: _consentAccurate, ...withoutConsent } = VALID_FIELDS;
    const result = await submitContactRequest(
      "creative-1",
      null,
      formData(withoutConsent)
    );
    expect(result).toEqual({ error: expect.stringContaining("consent") });
    expect(dbMock.contactRequest.create).not.toHaveBeenCalled();
  });

  it("rejects a message that's too short", async () => {
    const result = await submitContactRequest(
      "creative-1",
      null,
      formData({ ...VALID_FIELDS, message: "too short" })
    );
    expect(result).toEqual({ error: expect.stringContaining("connect") });
  });

  it("creates the request and notifies on success", async () => {
    dbMock.contactRequest.create.mockResolvedValue({
      creative: { firstName: "Sara", lastName: "Khan", email: "sara@example.com" },
    });

    const result = await submitContactRequest(
      "creative-1",
      null,
      formData(VALID_FIELDS)
    );

    expect(result).toEqual({ success: true });
    expect(dbMock.contactRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "user-1",
          creativeId: "creative-1",
          requesterName: "Jordan Lee",
          requestType: "Collaboration Opportunity",
        }),
      })
    );
    expect(sendContactRequestNotificationMock).toHaveBeenCalledWith(
      "Sara Khan",
      "Jordan Lee",
      "Collaboration Opportunity",
      VALID_FIELDS.message,
      "Within the next month",
      expect.stringContaining("/admin/contact-requests")
    );
  });

  it("captures the free-text reason when request type is Other", async () => {
    dbMock.contactRequest.create.mockResolvedValue({
      creative: { firstName: "Sara", lastName: "Khan", email: "sara@example.com" },
    });

    await submitContactRequest(
      "creative-1",
      null,
      formData({ ...VALID_FIELDS, requestType: "Other", requestTypeOther: "Podcast feature" })
    );

    expect(dbMock.contactRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ requestType: "Other", requestTypeOther: "Podcast feature" }),
      })
    );
    expect(sendContactRequestNotificationMock).toHaveBeenCalledWith(
      "Sara Khan",
      "Jordan Lee",
      "Other — Podcast feature",
      expect.anything(),
      expect.anything(),
      expect.anything()
    );
  });
});
