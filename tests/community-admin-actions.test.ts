import { describe, it, expect, vi, beforeEach } from "vitest";

const { dbMock, sendPostDecisionEmailMock, sendCommentRemovedEmailMock, sendBulkCommunityNotificationMock } = vi.hoisted(() => ({
  dbMock: {
    post: { update: vi.fn(), delete: vi.fn(), findUnique: vi.fn() },
    comment: { update: vi.fn(), count: vi.fn() },
    commentReport: { update: vi.fn() },
    creative: { update: vi.fn(), findMany: vi.fn() },
  },
  sendPostDecisionEmailMock: vi.fn(async () => {}),
  sendCommentRemovedEmailMock: vi.fn(async () => {}),
  sendBulkCommunityNotificationMock: vi.fn(async () => {}),
}));
vi.mock("@/lib/db", () => ({ db: dbMock }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/email", () => ({
  sendPostDecisionEmail: sendPostDecisionEmailMock,
  sendCommentRemovedEmail: sendCommentRemovedEmailMock,
  sendBulkCommunityNotification: sendBulkCommunityNotificationMock,
}));

import {
  approvePost,
  rejectPost,
  removeReportedComment,
  removeComment,
  suspendMemberComments,
  sendBulkPostNotification,
} from "@/lib/community-admin-actions";

beforeEach(() => {
  vi.clearAllMocks();
  dbMock.comment.count.mockResolvedValue(0);
});

describe("approvePost", () => {
  it("sets status APPROVED and emails the member", async () => {
    dbMock.post.update.mockResolvedValue({
      title: "Wrapped a shoot",
      creative: { firstName: "Zain", email: "zain@example.com" },
    });

    await approvePost("post-1");

    expect(dbMock.post.update).toHaveBeenCalledWith({
      where: { id: "post-1" },
      data: { status: "APPROVED" },
      include: { creative: true },
    });
    expect(sendPostDecisionEmailMock).toHaveBeenCalledWith("Zain", "zain@example.com", "Wrapped a shoot", true);
  });
});

describe("rejectPost", () => {
  it("sets status REJECTED with notes and emails the member", async () => {
    dbMock.post.update.mockResolvedValue({
      title: "Wrapped a shoot",
      creative: { firstName: "Zain", email: "zain@example.com" },
    });

    await rejectPost("post-1", "Not a fit");

    expect(dbMock.post.update).toHaveBeenCalledWith({
      where: { id: "post-1" },
      data: { status: "REJECTED", adminNotes: "Not a fit" },
      include: { creative: true },
    });
    expect(sendPostDecisionEmailMock).toHaveBeenCalledWith("Zain", "zain@example.com", "Wrapped a shoot", false);
  });
});

describe("removeReportedComment / removeComment", () => {
  it("marks the comment removed, emails the author, and flags after repeated removals", async () => {
    dbMock.commentReport.update.mockResolvedValue({
      comment: { id: "comment-1", creativeId: "creative-1", creative: { firstName: "Zain", email: "zain@example.com" } },
    });
    dbMock.comment.update.mockResolvedValue({
      creativeId: "creative-1",
      creative: { firstName: "Zain", email: "zain@example.com" },
    });
    dbMock.comment.count.mockResolvedValue(3);

    await removeReportedComment("report-1");

    expect(dbMock.commentReport.update).toHaveBeenCalledWith({
      where: { id: "report-1" },
      data: { status: "ACTIONED" },
      include: { comment: { include: { creative: true } } },
    });
    expect(dbMock.comment.update).toHaveBeenCalledWith({
      where: { id: "comment-1" },
      data: { isRemoved: true },
      include: { creative: true },
    });
    expect(sendCommentRemovedEmailMock).toHaveBeenCalledWith("Zain", "zain@example.com");
    expect(dbMock.creative.update).toHaveBeenCalledWith({
      where: { id: "creative-1" },
      data: { commentFlagged: true },
    });
  });

  it("does not flag a member below the removal threshold", async () => {
    dbMock.comment.update.mockResolvedValue({
      creativeId: "creative-1",
      creative: { firstName: "Zain", email: "zain@example.com" },
    });
    dbMock.comment.count.mockResolvedValue(1);

    await removeComment("comment-1");

    expect(dbMock.creative.update).not.toHaveBeenCalled();
  });
});

describe("suspendMemberComments", () => {
  it("sets commentSuspended", async () => {
    await suspendMemberComments("creative-1");
    expect(dbMock.creative.update).toHaveBeenCalledWith({
      where: { id: "creative-1" },
      data: { commentSuspended: true },
    });
  });
});

describe("sendBulkPostNotification", () => {
  it("emails every linked member", async () => {
    dbMock.post.findUnique.mockResolvedValue({ title: "Open for hire" });
    dbMock.creative.findMany.mockResolvedValue([
      { user: { email: "zain@example.com" } },
      { user: { email: "sara@example.com" } },
      { user: null },
    ]);

    await sendBulkPostNotification("post-1", "Check this out");

    expect(sendBulkCommunityNotificationMock).toHaveBeenCalledWith(
      ["zain@example.com", "sara@example.com"],
      "PCC Community: Open for hire",
      "Check this out"
    );
  });
});
