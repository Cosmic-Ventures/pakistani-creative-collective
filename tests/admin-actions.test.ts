import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  dbMock,
  sendApprovalEmailMock,
  sendRejectionEmailMock,
  sendFeatureNotificationMock,
  sendContactRequestNotificationMock,
} = vi.hoisted(() => ({
  dbMock: {
    creative: { update: vi.fn() },
    contactRequest: { update: vi.fn() },
    featureRequest: { update: vi.fn() },
  },
  sendApprovalEmailMock: vi.fn(async () => {}),
  sendRejectionEmailMock: vi.fn(async () => {}),
  sendFeatureNotificationMock: vi.fn(async () => {}),
  sendContactRequestNotificationMock: vi.fn(async () => {}),
}));
vi.mock("@/lib/db", () => ({ db: dbMock }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/email", () => ({
  sendApprovalEmail: sendApprovalEmailMock,
  sendRejectionEmail: sendRejectionEmailMock,
  sendFeatureNotification: sendFeatureNotificationMock,
  sendContactRequestNotification: sendContactRequestNotificationMock,
}));

import {
  approveCreative,
  rejectCreative,
  forwardContactRequest,
  approveFeatureRequest,
  rejectFeatureRequest,
} from "@/lib/admin-actions";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("approveCreative", () => {
  it("sets status to APPROVED and sends the approval email", async () => {
    dbMock.creative.update.mockResolvedValue({
      firstName: "Sara",
      email: "sara@example.com",
      slug: "sara-khan",
    });

    await approveCreative("creative-1");

    expect(dbMock.creative.update).toHaveBeenCalledWith({
      where: { id: "creative-1" },
      data: { status: "APPROVED" },
    });
    expect(sendApprovalEmailMock).toHaveBeenCalledWith("Sara", "sara@example.com", "sara-khan");
  });
});

describe("rejectCreative", () => {
  it("sets status to REJECTED and sends the rejection email", async () => {
    dbMock.creative.update.mockResolvedValue({ firstName: "Sara", email: "sara@example.com" });

    await rejectCreative("creative-1", "Not a fit right now");

    expect(dbMock.creative.update).toHaveBeenCalledWith({
      where: { id: "creative-1" },
      data: { status: "REJECTED", adminNotes: "Not a fit right now" },
    });
    expect(sendRejectionEmailMock).toHaveBeenCalledWith("Sara", "sara@example.com");
  });
});

describe("forwardContactRequest", () => {
  it("marks the request FORWARDED and notifies the creative", async () => {
    dbMock.contactRequest.update.mockResolvedValue({
      creative: { firstName: "Sara", lastName: "Khan" },
      requesterName: "Jordan Lee",
      requestType: "Collaboration Opportunity",
      requestTypeOther: null,
      message: "Let's talk",
      timeline: "Within the next month",
    });

    await forwardContactRequest("request-1");

    expect(dbMock.contactRequest.update).toHaveBeenCalledWith({
      where: { id: "request-1" },
      data: { status: "FORWARDED" },
      include: { creative: true, user: true },
    });
    expect(sendContactRequestNotificationMock).toHaveBeenCalledWith(
      "Sara Khan",
      "Jordan Lee",
      "Collaboration Opportunity",
      "Let's talk",
      "Within the next month",
      expect.stringContaining("/admin/contact-requests")
    );
  });

  it("labels an 'Other' request type with its free-text reason", async () => {
    dbMock.contactRequest.update.mockResolvedValue({
      creative: { firstName: "Sara", lastName: "Khan" },
      requesterName: "Jordan Lee",
      requestType: "Other",
      requestTypeOther: "Podcast feature",
      message: "Let's talk",
      timeline: "No set timeline",
    });

    await forwardContactRequest("request-1");

    expect(sendContactRequestNotificationMock).toHaveBeenCalledWith(
      "Sara Khan",
      "Jordan Lee",
      "Other — Podcast feature",
      "Let's talk",
      "No set timeline",
      expect.anything()
    );
  });
});

describe("approveFeatureRequest", () => {
  it("approves the request and marks the creative as featured", async () => {
    dbMock.featureRequest.update.mockResolvedValue({
      creativeId: "creative-1",
      creative: { firstName: "Sara", email: "sara@example.com", slug: "sara-khan" },
    });
    dbMock.creative.update.mockResolvedValue({});

    const until = new Date("2026-08-01");
    await approveFeatureRequest("request-1", until);

    expect(dbMock.creative.update).toHaveBeenCalledWith({
      where: { id: "creative-1" },
      data: { featured: true, featuredUntil: until },
    });
    expect(sendFeatureNotificationMock).toHaveBeenCalledWith("Sara", "sara@example.com", "sara-khan");
  });
});

describe("rejectFeatureRequest", () => {
  it("sets status to REJECTED with notes", async () => {
    dbMock.featureRequest.update.mockResolvedValue({});
    await rejectFeatureRequest("request-1", "Not this month");
    expect(dbMock.featureRequest.update).toHaveBeenCalledWith({
      where: { id: "request-1" },
      data: { status: "REJECTED", adminNotes: "Not this month" },
    });
  });
});
