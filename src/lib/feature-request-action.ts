"use server";

import { z } from "zod";
import { db } from "./db";

const Schema = z.object({
  reason: z.string().min(20, "Please explain why you'd like to be featured (min 20 characters)"),
});

export type FeatureRequestResult = { error: string } | { success: true };

export async function submitFeatureRequest(
  creativeId: string,
  _prev: FeatureRequestResult | null,
  formData: FormData
): Promise<FeatureRequestResult> {
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
