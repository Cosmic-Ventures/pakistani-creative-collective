"use server";

import { revalidatePath } from "next/cache";
import { db } from "./db";
import { requireAdmin } from "./session";
import { isResendConfigured, sendTemplatePreview } from "./email";
import { getTemplateDef, sampleValues, unknownVariables, type TemplateContent } from "./email-templates";
import { isMissingSchemaError, MIGRATION_PENDING_MESSAGE } from "./db-availability";

// Only async functions may be exported from a "use server" file (AGENTS.md
// gotcha #1) — the template definitions live in ./email-templates, which both
// this module and the editor's live preview import directly.

export type TemplateActionResult = { error: string } | { ok: true; message: string };

const MAX_SUBJECT = 200;
const MAX_PREHEADER = 200;
const MAX_BODY = 20_000;

function validate(key: string, content: TemplateContent): string | null {
  const def = getTemplateDef(key);
  if (!def) return "That email template doesn't exist.";
  if (!content.subject.trim()) return "The subject line can't be empty.";
  if (!content.body.trim()) return "The email body can't be empty.";
  if (content.subject.length > MAX_SUBJECT) return `The subject line must be ${MAX_SUBJECT} characters or fewer.`;
  if (content.preheader.length > MAX_PREHEADER) return `The preview text must be ${MAX_PREHEADER} characters or fewer.`;
  if (content.body.length > MAX_BODY) return `The email body must be ${MAX_BODY} characters or fewer.`;

  // A typo'd variable would otherwise go out to a real member as the literal
  // text "{{frstName}}", and nobody would find out until somebody replied.
  const unknown = unknownVariables(def, content);
  if (unknown.length > 0) {
    return `This template doesn't have ${unknown.map((u) => `{{${u}}}`).join(", ")}. Use only the variables listed below the editor.`;
  }
  return null;
}

function readContent(formData: FormData): TemplateContent {
  return {
    subject: String(formData.get("subject") ?? "").trim(),
    preheader: String(formData.get("preheader") ?? "").trim(),
    body: String(formData.get("body") ?? "").replace(/\r\n/g, "\n").trim(),
  };
}

export async function saveEmailTemplate(
  _prev: TemplateActionResult | null,
  formData: FormData
): Promise<TemplateActionResult> {
  const admin = await requireAdmin();
  const key = String(formData.get("key") ?? "");
  const content = readContent(formData);

  const error = validate(key, content);
  if (error) return { error };

  try {
    await db.emailTemplate.upsert({
      where: { key },
      create: { key, ...content, updatedBy: admin.email },
      update: { ...content, updatedBy: admin.email },
    });
  } catch (error) {
    if (!isMissingSchemaError(error)) throw error;
    return { error: MIGRATION_PENDING_MESSAGE };
  }

  revalidatePath("/admin/emails");
  revalidatePath(`/admin/emails/${key}`);
  return { ok: true, message: "Saved. New emails of this type will use this wording." };
}

/**
 * Reset is a delete, not a copy of the defaults back into the row: with no row
 * the template renders from src/lib/email-templates.ts again, so it also picks
 * up any wording we fix in a later release.
 */
export async function resetEmailTemplate(key: string): Promise<void> {
  await requireAdmin();
  try {
    await db.emailTemplate.deleteMany({ where: { key } });
  } catch (error) {
    if (!isMissingSchemaError(error)) throw error;
    // Nothing stored means nothing to restore — the shipped copy is already
    // what's sending.
  }
  revalidatePath("/admin/emails");
  revalidatePath(`/admin/emails/${key}`);
}

/**
 * Sends the *saved* version of a template to the signed-in admin, filled in
 * with the sample values — the only way to see how it actually lands in an
 * inbox (dark mode, blocked images, the subject line beside it).
 */
export async function sendTestEmail(key: string): Promise<TemplateActionResult> {
  const admin = await requireAdmin();
  const def = getTemplateDef(key);
  if (!def) return { error: "That email template doesn't exist." };

  if (!isResendConfigured) {
    return { error: "Email sending isn't switched on yet — no Resend API key is configured." };
  }

  try {
    // Goes through exactly the same render path a real send uses, so what lands
    // in the inbox is what an applicant would get.
    await sendTemplatePreview(key, admin.email, sampleValues(def));
  } catch (error) {
    console.error("Test email failed", error);
    return { error: "Couldn't send the test email. Check the server logs." };
  }

  return { ok: true, message: `Test email sent to ${admin.email}.` };
}
