"use server";

import { z } from "zod";
import { db } from "./db";
import { getSession } from "./session";
import { sendSupportRequest } from "./email";
import { isResendConfigured } from "./email";
import { SUPPORT_KINDS } from "./support-constants";

const Schema = z.object({
  kind: z.enum(SUPPORT_KINDS, { error: "Choose what this is about" }),
  subject: z.string().trim().min(1, "Add a subject").max(150),
  message: z.string().trim().min(10, "Please tell us a bit more").max(5000),
});

export type SupportResult = { error: string } | { success: true } | null;

export async function submitSupportRequest(_prev: SupportResult, formData: FormData): Promise<SupportResult> {
  const session = await getSession();
  if (!session) return { error: "Your sign-in has expired. Sign in again and resubmit." };

  const parsed = Schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const [user, admins] = await Promise.all([
    db.user.findUnique({ where: { id: session.userId }, select: { email: true, name: true } }),
    db.user.findMany({ where: { role: "ADMIN" }, select: { email: true } }),
  ]);
  if (!user) return { error: "We couldn't find your account." };

  const sent = await sendSupportRequest({
    fromName: user.name ?? user.email,
    fromEmail: user.email,
    ...parsed.data,
    adminEmails: admins.map((a) => a.email),
  }).catch((error) => {
    console.error("[support] send failed", error);
    return false;
  });

  if (!sent && isResendConfigured) {
    return { error: "We couldn't send that just now. Nothing was lost. Try again, or email pcc@aneesatalks.com." };
  }
  if (!sent) console.warn("[support] email not configured; message not sent");
  return { success: true };
}
