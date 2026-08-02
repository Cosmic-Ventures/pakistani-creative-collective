"use server";

import { revalidatePath } from "next/cache";
import { db } from "./db";
import { getSession } from "./session";

async function requirePaidUserId(): Promise<string> {
  const session = await getSession();
  if (!session || (session.role !== "PAID" && session.role !== "ADMIN")) {
    throw new Error("Bookmarking requires a paid membership.");
  }
  return session.userId;
}

export async function toggleProfileBookmark(creativeId: string) {
  const userId = await requirePaidUserId();
  const existing = await db.bookmark.findUnique({
    where: { userId_creativeId: { userId, creativeId } },
  });
  if (existing) {
    await db.bookmark.delete({ where: { id: existing.id } });
  } else {
    await db.bookmark.create({ data: { userId, type: "PROFILE", creativeId } });
  }
  revalidatePath("/account");
  revalidatePath("/directory");
}

export async function togglePostBookmark(postId: string) {
  const userId = await requirePaidUserId();
  const existing = await db.bookmark.findUnique({
    where: { userId_postId: { userId, postId } },
  });
  if (existing) {
    await db.bookmark.delete({ where: { id: existing.id } });
  } else {
    await db.bookmark.create({ data: { userId, type: "POST", postId } });
  }
  revalidatePath("/account");
  revalidatePath("/community");
}
