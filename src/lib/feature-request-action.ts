"use server";

import { z } from "zod";
import { db } from "./db";
import { getSession } from "./session";

const Schema = z.object({
  reason: z.string().min(20, "Please explain why you'd like to be featured (min 20 characters)"),
});

export type FeatureRequestResult = { error: string } | { success: true };

export async function submitFeatureRequest(
  creativeId: string,
  _prev: FeatureRequestResult | null,
  formData: FormData
): Promise<FeatureRequestResult> {
  // `creativeId` arrives as a bound argument, which means it round-trips through
  // the browser and is caller-controlled. Without the ownership check below,
  // anyone could ask to have any creative featured on the client's homepage —
  // and being "featured" unlocks the full paid profile view (see
  // `isFeaturedNow` on the profile page), so an approval acts on whoever the
  // request named. Resolve the caller's own listing and use that id.
  const session = await getSession();
  if (!session) {
    return { error: "Your sign-in has expired — sign in again and resubmit." };
  }

  const own = await db.creative.findFirst({
    where: { userId: session.userId },
    select: { id: true, status: true },
  });
  // A paid subscriber who isn't themselves a listed creative has nothing to
  // feature — the same split AGENTS.md gotcha #9 describes.
  if (!own || own.id !== creativeId) {
    return { error: "You can only request a feature for your own profile." };
  }
  if (own.status !== "APPROVED") {
    return { error: "Your profile needs to be approved before it can be featured." };
  }

  const parsed = Schema.safeParse({ reason: formData.get("reason") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const existing = await db.featureRequest.findFirst({
    where: { creativeId, status: "PENDING" },
  });
  if (existing) return { error: "You already have a pending feature request." };

  await db.featureRequest.create({
    data: { creativeId, reason: parsed.data.reason },
  });

  return { success: true };
}
