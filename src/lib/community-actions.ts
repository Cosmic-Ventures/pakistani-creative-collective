"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Creative, ReactionType } from "@prisma/client";
import { db } from "./db";
import { getSession } from "./session";
import { sendNewCommunityPostNotification } from "./email";
import {
  CATEGORIES_REQUIRING_DEADLINE,
  CATEGORIES_REQUIRING_REGION,
  POST_BODY_MAX_WORDS,
  COMMENT_MAX_WORDS,
  normalizePostLink,
} from "./community-constants";

const POST_CATEGORIES = ["RECENT_WORK", "SEEKING_FUNDING", "SEEKING_COLLABORATORS", "AVAILABLE_FOR_WORK"] as const;

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Resolves the logged-in user's own creative listing — required to post,
 * comment, or react (the dashboard pulls name/role/profile link from it).
 * Returns an error for paid subscribers who aren't themselves a listed creative.
 */
async function requireMemberCreative(): Promise<{ error: string } | { creative: Creative }> {
  const session = await getSession();
  if (!session || (session.role !== "PAID" && session.role !== "ADMIN")) {
    return { error: "You must be a paid member to do this." };
  }
  const creative = await db.creative.findFirst({ where: { userId: session.userId } });
  if (!creative) {
    return { error: "This account isn't linked to a creative profile yet — contact Aneesa Talks to link yours." };
  }
  if (creative.commentSuspended) {
    return { error: "Your ability to post has been suspended. Contact Aneesa Talks for details." };
  }
  return { creative };
}

const PostSchema = z
  .object({
    category: z.enum(POST_CATEGORIES, { error: "Select a category" }),
    title: z.string().min(1, "Title is required").max(200),
    body: z
      .string()
      .min(1, "Post body is required")
      .refine((b) => wordCount(b) <= POST_BODY_MAX_WORDS, `Post body must be ${POST_BODY_MAX_WORDS} words or fewer`),
    region: z.string().optional(),
    expiresAt: z.string().optional(),
    link: z.string().optional(),
  })
  .superRefine((d, ctx) => {
    if (CATEGORIES_REQUIRING_REGION.includes(d.category) && !d.region) {
      ctx.addIssue({ code: "custom", message: "Region is required for this category", path: ["region"] });
    }
    if (CATEGORIES_REQUIRING_DEADLINE.includes(d.category) && !d.expiresAt) {
      ctx.addIssue({ code: "custom", message: "A duration/deadline is required for this category", path: ["expiresAt"] });
    }
  });

export type PostResult = { error: string } | { success: true };

export async function createPost(_prev: PostResult | null, formData: FormData): Promise<PostResult> {
  const member = await requireMemberCreative();
  if ("error" in member) return { error: member.error };

  const parsed = PostSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  // `expiresAt` is a free-form string off the wire, so `new Date(...)` can yield
  // an Invalid Date. Passing that to Prisma throws, which surfaces to the member
  // as a submit that does nothing — say what's wrong instead.
  let deadline: Date | undefined;
  if (d.expiresAt) {
    deadline = new Date(d.expiresAt);
    if (Number.isNaN(deadline.getTime())) {
      return { error: "That duration/deadline isn't a valid date." };
    }
  }

  try {
    await db.post.create({
      data: {
        creativeId: member.creative.id,
        category: d.category,
        title: d.title,
        body: d.body,
        region: d.region || undefined,
        expiresAt: deadline,
        link: normalizePostLink(d.link) ?? undefined,
      },
    });
  } catch (error) {
    // A failed write must read as a message, never as a button that did nothing.
    console.error("[community-post] rejected: database write failed", error);
    return { error: "Something went wrong saving your post — nothing you typed has been lost. Please try again." };
  }

  await sendNewCommunityPostNotification(
    `${member.creative.firstName} ${member.creative.lastName}`,
    d.title,
    d.category
  ).catch(console.error);

  revalidatePath("/community");
  return { success: true };
}

export async function toggleReaction(postId: string, type: ReactionType) {
  const member = await requireMemberCreative();
  if ("error" in member) return { error: member.error };

  const existing = await db.reaction.findUnique({
    where: { postId_creativeId: { postId, creativeId: member.creative.id } },
  });

  if (existing && existing.type === type) {
    await db.reaction.delete({ where: { id: existing.id } });
  } else {
    await db.reaction.upsert({
      where: { postId_creativeId: { postId, creativeId: member.creative.id } },
      update: { type },
      create: { postId, creativeId: member.creative.id, type },
    });
  }

  revalidatePath("/community");
}

const CommentSchema = z.object({
  body: z
    .string()
    .min(1, "Comment can't be empty")
    .refine((b) => wordCount(b) <= COMMENT_MAX_WORDS, `Comments must be ${COMMENT_MAX_WORDS} words or fewer`),
});

export type CommentResult = { error: string } | { success: true };

export async function addComment(postId: string, _prev: CommentResult | null, formData: FormData): Promise<CommentResult> {
  const member = await requireMemberCreative();
  if ("error" in member) return { error: member.error };

  const parsed = CommentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await db.comment.create({
    data: { postId, creativeId: member.creative.id, body: parsed.data.body },
  });

  revalidatePath("/community");
  return { success: true };
}

export async function reportComment(commentId: string) {
  const member = await requireMemberCreative();
  if ("error" in member) return { error: member.error };

  await db.commentReport.upsert({
    where: { commentId_creativeId: { commentId, creativeId: member.creative.id } },
    update: {},
    create: { commentId, creativeId: member.creative.id },
  });

  revalidatePath("/community");
}
