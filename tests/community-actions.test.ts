import { describe, it, expect, vi, beforeEach } from "vitest";

const { dbMock, getSessionMock, sendNewCommunityPostNotificationMock } = vi.hoisted(() => ({
  dbMock: {
    creative: { findFirst: vi.fn() },
    post: { create: vi.fn() },
    reaction: { findUnique: vi.fn(), upsert: vi.fn(), delete: vi.fn() },
    comment: { create: vi.fn() },
    commentReport: { upsert: vi.fn() },
  },
  getSessionMock: vi.fn(),
  sendNewCommunityPostNotificationMock: vi.fn(async () => {}),
}));
vi.mock("@/lib/db", () => ({ db: dbMock }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/session", () => ({ getSession: getSessionMock }));
vi.mock("@/lib/email", () => ({ sendNewCommunityPostNotification: sendNewCommunityPostNotificationMock }));

import { createPost, toggleReaction, addComment, reportComment } from "@/lib/community-actions";

const PAID_SESSION = { userId: "user-1", email: "member@example.com", role: "PAID" as const };
const MY_CREATIVE = { id: "creative-1", firstName: "Zain", lastName: "Malik", commentSuspended: false };

function formData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("member creative gating", () => {
  it("rejects when not logged in", async () => {
    getSessionMock.mockResolvedValue(null);
    const result = await createPost(null, formData({ category: "RECENT_WORK", title: "Hi", body: "Body" }));
    expect(result).toEqual({ error: expect.stringContaining("paid member") });
    expect(dbMock.post.create).not.toHaveBeenCalled();
  });

  it("rejects an unpaid session", async () => {
    getSessionMock.mockResolvedValue({ ...PAID_SESSION, role: "UNPAID" });
    const result = await createPost(null, formData({ category: "RECENT_WORK", title: "Hi", body: "Body" }));
    expect(result).toEqual({ error: expect.stringContaining("paid member") });
  });

  it("rejects a paid user with no linked creative profile", async () => {
    getSessionMock.mockResolvedValue(PAID_SESSION);
    dbMock.creative.findFirst.mockResolvedValue(null);
    const result = await createPost(null, formData({ category: "RECENT_WORK", title: "Hi", body: "Body" }));
    expect(result).toEqual({ error: expect.stringContaining("linked to a creative profile") });
  });

  it("rejects a suspended member", async () => {
    getSessionMock.mockResolvedValue(PAID_SESSION);
    dbMock.creative.findFirst.mockResolvedValue({ ...MY_CREATIVE, commentSuspended: true });
    const result = await createPost(null, formData({ category: "RECENT_WORK", title: "Hi", body: "Body" }));
    expect(result).toEqual({ error: expect.stringContaining("suspended") });
  });
});

describe("createPost", () => {
  beforeEach(() => {
    getSessionMock.mockResolvedValue(PAID_SESSION);
    dbMock.creative.findFirst.mockResolvedValue(MY_CREATIVE);
    dbMock.post.create.mockResolvedValue({});
  });

  it("requires region for Available for Work posts", async () => {
    const result = await createPost(
      null,
      formData({ category: "AVAILABLE_FOR_WORK", title: "Open for hire", body: "Body text", expiresAt: "2026-12-01" })
    );
    expect(result).toEqual({ error: expect.stringContaining("Region") });
    expect(dbMock.post.create).not.toHaveBeenCalled();
  });

  it("requires a deadline for Seeking Collaborators posts", async () => {
    const result = await createPost(
      null,
      formData({ category: "SEEKING_COLLABORATORS", title: "Need an editor", body: "Body text" })
    );
    expect(result).toEqual({ error: expect.stringContaining("duration/deadline") });
  });

  it("rejects a post body over the word limit", async () => {
    const result = await createPost(
      null,
      formData({ category: "RECENT_WORK", title: "Title", body: "word ".repeat(501) })
    );
    expect(result).toEqual({ error: expect.stringContaining("500 words") });
  });

  it("creates a pending post under the member's own creative and notifies admin", async () => {
    const result = await createPost(
      null,
      formData({ category: "RECENT_WORK", title: "Wrapped a shoot", body: "Great crew, great result." })
    );

    expect(dbMock.post.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        creativeId: "creative-1",
        category: "RECENT_WORK",
        title: "Wrapped a shoot",
        body: "Great crew, great result.",
      }),
    });
    expect(sendNewCommunityPostNotificationMock).toHaveBeenCalledWith("Zain Malik", "Wrapped a shoot", "RECENT_WORK");
    expect(result).toEqual({ success: true });
  });
});

describe("toggleReaction", () => {
  beforeEach(() => {
    getSessionMock.mockResolvedValue(PAID_SESSION);
    dbMock.creative.findFirst.mockResolvedValue(MY_CREATIVE);
  });

  it("creates a reaction when none exists", async () => {
    dbMock.reaction.findUnique.mockResolvedValue(null);
    await toggleReaction("post-1", "SUPPORT");
    expect(dbMock.reaction.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: { postId: "post-1", creativeId: "creative-1", type: "SUPPORT" } })
    );
    expect(dbMock.reaction.delete).not.toHaveBeenCalled();
  });

  it("removes the reaction when clicking the same type again", async () => {
    dbMock.reaction.findUnique.mockResolvedValue({ id: "reaction-1", type: "SUPPORT" });
    await toggleReaction("post-1", "SUPPORT");
    expect(dbMock.reaction.delete).toHaveBeenCalledWith({ where: { id: "reaction-1" } });
    expect(dbMock.reaction.upsert).not.toHaveBeenCalled();
  });

  it("changes the reaction type when a different type is clicked", async () => {
    dbMock.reaction.findUnique.mockResolvedValue({ id: "reaction-1", type: "SUPPORT" });
    await toggleReaction("post-1", "INTERESTED");
    expect(dbMock.reaction.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: { type: "INTERESTED" } })
    );
    expect(dbMock.reaction.delete).not.toHaveBeenCalled();
  });
});

describe("addComment", () => {
  beforeEach(() => {
    getSessionMock.mockResolvedValue(PAID_SESSION);
    dbMock.creative.findFirst.mockResolvedValue(MY_CREATIVE);
  });

  it("rejects a comment over the word limit", async () => {
    const result = await addComment("post-1", null, formData({ body: "word ".repeat(301) }));
    expect(result).toEqual({ error: expect.stringContaining("300 words") });
    expect(dbMock.comment.create).not.toHaveBeenCalled();
  });

  it("creates a comment live immediately", async () => {
    const result = await addComment("post-1", null, formData({ body: "Great work!" }));
    expect(dbMock.comment.create).toHaveBeenCalledWith({
      data: { postId: "post-1", creativeId: "creative-1", body: "Great work!" },
    });
    expect(result).toEqual({ success: true });
  });
});

describe("reportComment", () => {
  it("upserts a report keyed on comment + reporting member", async () => {
    getSessionMock.mockResolvedValue(PAID_SESSION);
    dbMock.creative.findFirst.mockResolvedValue(MY_CREATIVE);

    await reportComment("comment-1");

    expect(dbMock.commentReport.upsert).toHaveBeenCalledWith({
      where: { commentId_creativeId: { commentId: "comment-1", creativeId: "creative-1" } },
      update: {},
      create: { commentId: "comment-1", creativeId: "creative-1" },
    });
  });
});
