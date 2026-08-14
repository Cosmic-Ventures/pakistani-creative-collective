"use server";

import { revalidatePath } from "next/cache";
import { db } from "./db";
import { requireAdmin } from "./session";
import { sendPostDecisionEmail, sendCommentRemovedEmail, sendBulkCommunityNotification } from "./email";
import { COMMENT_REMOVAL_FLAG_THRESHOLD } from "./community-constants";

// ── Posts ──────────────────────────────────────────────────────────────────

export async function approvePost(postId: string) {
  await requireAdmin();
  const post = await db.post.update({
    where: { id: postId },
    data: { status: "APPROVED" },
    include: { creative: true },
  });
  await sendPostDecisionEmail(post.creative.firstName, post.creative.email, post.title, true).catch(console.error);
  revalidatePath("/admin/community");
  revalidatePath("/community");
}

export async function rejectPost(postId: string, notes?: string) {
  await requireAdmin();
  const post = await db.post.update({
    where: { id: postId },
    data: { status: "REJECTED", adminNotes: notes },
    include: { creative: true },
  });
  await sendPostDecisionEmail(post.creative.firstName, post.creative.email, post.title, false).catch(console.error);
  revalidatePath("/admin/community");
}

export async function editPost(
  postId: string,
  data: { title?: string; body?: string; region?: string; link?: string }
) {
  await requireAdmin();
  await db.post.update({ where: { id: postId }, data });
  revalidatePath("/admin/community");
  revalidatePath("/community");
}

export async function removePost(postId: string) {
  await requireAdmin();
  await db.post.delete({ where: { id: postId } });
  revalidatePath("/admin/community");
  revalidatePath("/community");
}

export async function setPostExpiry(postId: string, expiresAt: Date | null) {
  await requireAdmin();
  await db.post.update({ where: { id: postId }, data: { expiresAt } });
  revalidatePath("/admin/community");
  revalidatePath("/community");
}

// ── Comments & Reports ───────────────────────────────────────────────────────

export async function dismissCommentReport(reportId: string) {
  await requireAdmin();
  await db.commentReport.update({ where: { id: reportId }, data: { status: "DISMISSED" } });
  revalidatePath("/admin/community");
}

export async function removeReportedComment(reportId: string) {
  await requireAdmin();
  const report = await db.commentReport.update({
    where: { id: reportId },
    data: { status: "ACTIONED" },
    include: { comment: { include: { creative: true } } },
  });
  await removeCommentInternal(report.comment.id);
  revalidatePath("/admin/community");
}

export async function removeComment(commentId: string) {
  await requireAdmin();
  await removeCommentInternal(commentId);
  revalidatePath("/admin/community");
  revalidatePath("/community");
}

async function removeCommentInternal(commentId: string) {
  const comment = await db.comment.update({
    where: { id: commentId },
    data: { isRemoved: true },
    include: { creative: true },
  });
  await sendCommentRemovedEmail(comment.creative.firstName, comment.creative.email).catch(console.error);

  const removedCount = await db.comment.count({
    where: { creativeId: comment.creativeId, isRemoved: true },
  });
  if (removedCount >= COMMENT_REMOVAL_FLAG_THRESHOLD) {
    await db.creative.update({ where: { id: comment.creativeId }, data: { commentFlagged: true } });
  }
}

// ── Members ───────────────────────────────────────────────────────────────

export async function suspendMemberComments(creativeId: string) {
  await requireAdmin();
  await db.creative.update({ where: { id: creativeId }, data: { commentSuspended: true } });
  revalidatePath("/admin/community");
}

export async function unsuspendMemberComments(creativeId: string) {
  await requireAdmin();
  await db.creative.update({ where: { id: creativeId }, data: { commentSuspended: false } });
  revalidatePath("/admin/community");
}

export async function clearMemberFlag(creativeId: string) {
  await requireAdmin();
  await db.creative.update({ where: { id: creativeId }, data: { commentFlagged: false } });
  revalidatePath("/admin/community");
}

// ── Bulk notification ────────────────────────────────────────────────────────

export async function sendBulkPostNotification(postId: string, message: string) {
  await requireAdmin();
  const post = await db.post.findUnique({ where: { id: postId } });
  const members = await db.creative.findMany({
    where: { userId: { not: null } },
    include: { user: true },
  });
  const recipients = members.map((m) => m.user?.email).filter((e): e is string => !!e);
  await sendBulkCommunityNotification(
    recipients,
    post ? `PCC Community: ${post.title}` : "PCC Community update",
    message
  ).catch(console.error);
}
