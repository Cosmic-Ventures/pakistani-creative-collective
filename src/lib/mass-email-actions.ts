"use server";

import { db } from "./db";
import { requireAdmin } from "./session";
import { isResendConfigured, retryFailedMassEmails, sendMassEmail, sendMassEmailTest } from "./email";
import { revalidatePath } from "next/cache";
import { MASS_EMAIL_DEF, unknownVariables, type TemplateContent } from "./email-templates";
import type { MassEmailRecipient } from "./mass-email-constants";
import { segmentRecipients, toFirstName } from "./mass-email-recipients";

const MAX_SUBJECT = 200;
const MAX_PREHEADER = 200;
const MAX_BODY = 20_000;
const MAX_RECIPIENTS = 2000; // sanity cap — this audience has never come close

/** Admin-only: everyone in one segment, for the composer's recipient picker. */
export async function getSegmentRecipients(segmentId: string): Promise<MassEmailRecipient[]> {
  await requireAdmin();
  return segmentRecipients(segmentId);
}

async function resolveRecipients(ids: string[]): Promise<{ email: string; firstName: string }[]> {
  const userIds = ids.filter((id) => id.startsWith("user:")).map((id) => id.slice("user:".length));
  const creativeIds = ids.filter((id) => id.startsWith("creative:")).map((id) => id.slice("creative:".length));

  // Re-fetched from the database rather than trusted from the submitted
  // form — a hidden field only round-trips the *choice* of who to email,
  // never the address or name actually used to send it.
  const [users, creatives] = await Promise.all([
    userIds.length
      ? db.user.findMany({ where: { id: { in: userIds } }, select: { email: true, name: true } })
      : Promise.resolve([]),
    creativeIds.length
      ? db.creative.findMany({ where: { id: { in: creativeIds } }, select: { email: true, firstName: true } })
      : Promise.resolve([]),
  ]);

  const combined = [
    ...users.map((u) => ({ email: u.email, firstName: toFirstName(u.name) })),
    ...creatives.map((c) => ({ email: c.email, firstName: c.firstName })),
  ];

  const seen = new Set<string>();
  return combined.filter((r) => {
    const key = r.email.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function readContent(formData: FormData): TemplateContent {
  return {
    subject: String(formData.get("subject") ?? "").trim(),
    preheader: String(formData.get("preheader") ?? "").trim(),
    body: String(formData.get("body") ?? "").replace(/\r\n/g, "\n").trim(),
  };
}

function validateContent(content: TemplateContent): string | null {
  if (!content.subject) return "The subject line can't be empty.";
  if (!content.body) return "The email body can't be empty.";
  if (content.subject.length > MAX_SUBJECT) return `The subject line must be ${MAX_SUBJECT} characters or fewer.`;
  if (content.preheader.length > MAX_PREHEADER) return `The preview text must be ${MAX_PREHEADER} characters or fewer.`;
  if (content.body.length > MAX_BODY) return `The email body must be ${MAX_BODY} characters or fewer.`;

  const unknown = unknownVariables(MASS_EMAIL_DEF, content);
  if (unknown.length > 0) {
    return `A mass email only has {{firstName}} and {{siteUrl}} available — remove ${unknown
      .map((u) => `{{${u}}}`)
      .join(", ")}.`;
  }
  return null;
}

export type MassEmailResult =
  | { error: string }
  | { ok: true; message: string; failures?: { email: string; error: string }[] };

export async function sendMassEmailAction(
  _prev: MassEmailResult | null,
  formData: FormData
): Promise<MassEmailResult> {
  await requireAdmin();
  if (!isResendConfigured) {
    return { error: "Email sending isn't switched on yet — no Resend API key is configured." };
  }

  const content = readContent(formData);
  const contentError = validateContent(content);
  if (contentError) return { error: contentError };

  const ids = [...new Set(formData.getAll("recipientIds").map(String))];
  if (ids.length === 0) return { error: "Select at least one recipient." };
  if (ids.length > MAX_RECIPIENTS) {
    return { error: `That's ${ids.length} recipients — split into batches of ${MAX_RECIPIENTS} or fewer.` };
  }

  const recipients = await resolveRecipients(ids);
  if (recipients.length === 0) {
    return { error: "None of the selected recipients could be found anymore — try reloading the segment." };
  }

  const { sent, failures } = await sendMassEmail(recipients, content);
  return {
    ok: true,
    message: `Sent to ${sent} of ${recipients.length} recipient${recipients.length === 1 ? "" : "s"}.`,
    failures,
  };
}

export async function sendMassEmailTestAction(
  _prev: MassEmailResult | null,
  formData: FormData
): Promise<MassEmailResult> {
  const admin = await requireAdmin();
  if (!isResendConfigured) {
    return { error: "Email sending isn't switched on yet — no Resend API key is configured." };
  }

  const content = readContent(formData);
  const contentError = validateContent(content);
  if (contentError) return { error: contentError };

  await sendMassEmailTest(admin.email, content);
  return { ok: true, message: `Test email sent to ${admin.email}.` };
}

/** Admin button on a mass email's detail list: re-send only the ones that failed. */
export async function retryFailedMassEmailAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const batchId = String(formData.get("batchId") ?? "");
  if (!batchId || !isResendConfigured) return;
  await retryFailedMassEmails(batchId);
  revalidatePath("/admin/sent-emails");
  revalidatePath("/admin/mass-email");
}
