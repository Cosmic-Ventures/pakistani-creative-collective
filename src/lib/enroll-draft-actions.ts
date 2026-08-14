"use server";

import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { getSession } from "./session";

/**
 * Save/resume support for the enrollment application (08/08 client round).
 * Available to any signed-in account, free or paid — being listed in the
 * directory is free, so gating drafts behind a subscription would defeat the
 * point.
 *
 * Anonymous applicants aren't rejected, they simply get no draft: the form
 * still works end to end without an account, it just can't offer to save.
 */

export type EnrollDraft = {
  savedAt: string;
  data: Record<string, unknown>;
};

export type SaveDraftResult = { ok: true; savedAt: string } | { ok: false; error: string };

export async function saveEnrollmentDraft(data: Record<string, unknown>): Promise<SaveDraftResult> {
  const session = await getSession();
  if (!session) {
    return { ok: false, error: "Sign in to save your progress and come back later." };
  }

  const payload = data as Prisma.InputJsonValue;
  const draft = await db.enrollmentDraft.upsert({
    where: { userId: session.userId },
    create: { userId: session.userId, data: payload },
    update: { data: payload },
  });

  return { ok: true, savedAt: draft.updatedAt.toISOString() };
}

export async function loadEnrollmentDraft(): Promise<EnrollDraft | null> {
  const session = await getSession();
  if (!session) return null;

  const draft = await db.enrollmentDraft.findUnique({ where: { userId: session.userId } });
  if (!draft) return null;

  return {
    savedAt: draft.updatedAt.toISOString(),
    data: (draft.data ?? {}) as Record<string, unknown>,
  };
}

export async function discardEnrollmentDraft(): Promise<void> {
  const session = await getSession();
  if (!session) return;
  // deleteMany, not delete: no-ops instead of throwing when there's no draft.
  await db.enrollmentDraft.deleteMany({ where: { userId: session.userId } });
}
