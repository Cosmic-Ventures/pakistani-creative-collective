import { describe, it, expect, vi, beforeEach } from "vitest";

const { dbMock, sendContactRequestNotificationMock } = vi.hoisted(() => ({
  dbMock: { contactRequest: { create: vi.fn() } },
  sendContactRequestNotificationMock: vi.fn(async () => {}),
}));
vi.mock("@/lib/db", () => ({ db: dbMock }));
vi.mock("@/lib/email", () => ({
  sendContactRequestNotification: sendContactRequestNotificationMock,
}));

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
});

describe("submitContactRequest", () => {
  it("rejects when consent checkboxes are missing", async () => {
    const { consentAccurate: _consentAccurate, ...withoutConsent } = VALID_FIELDS;
    const result = await submitContactRequest(
      "creative-1",
      "user-1",
      "sara-khan",
      null,
      formData(withoutConsent)
    );
    expect(result).toEqual({ error: expect.stringContaining("consent") });
    expect(dbMock.contactRequest.create).not.toHaveBeenCalled();
  });

  it("rejects a message that's too short", async () => {
    const result = await submitContactRequest(
      "creative-1",
      "user-1",
      "sara-khan",
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
      "user-1",
      "sara-khan",
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
      "user-1",
      "sara-khan",
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
