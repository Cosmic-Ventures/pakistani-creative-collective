"use server";

import { db } from "./db";
import { requireAdmin } from "./session";
import { isResendConfigured, sendMassEmail, sendMassEmailTest } from "./email";
import { MASS_EMAIL_DEF, unknownVariables, type TemplateContent } from "./email-templates";
import type { MassEmailRecipient } from "./mass-email-constants";

const MAX_SUBJECT = 200;
const MAX_PREHEADER = 200;
const MAX_BODY = 20_000;
const MAX_RECIPIENTS = 2000; // sanity cap — this audience has never come close

function toFirstName(name: string | null): string {
  return name?.trim().split(/\s+/)[0] || "there";
}

/**
 * Everyone in one segment, deduped isn't needed here (a segment is one
 * source table) — dedup happens later, across segments, when a send is
 * actually resolved from selected ids.
 */
export async function getSegmentRecipients(segmentId: string): Promise<MassEmailRecipient[]> {
  await requireAdmin();

  switch (segmentId) {
    case "unpaid-users":
    case "paid-users": {
      const role = segmentId === "paid-users" ? "PAID" : "UNPAID";
      const users = await db.user.findMany({ where: { role }, select: { id: true, email: true, name: true } });
      return users.map((u) => ({
        id: `user:${u.id}`,
        email: u.email,
        firstName: toFirstName(u.name),
        name: u.name ?? u.email,
        detail: role,
      }));
    }
    case "all-users": {
      const users = await db.user.findMany({ select: { id: true, email: true, name: true, role: true } });
      return users.map((u) => ({
        id: `user:${u.id}`,
        email: u.email,
        firstName: toFirstName(u.name),
        name: u.name ?? u.email,
        detail: u.role,
      }));
    }
    case "creative-pending":
    case "creative-approved":
    case "creative-rejected":
    case "creative-inactive":
    case "creative-flagged": {
      const status = segmentId.slice("creative-".length).toUpperCase() as
        | "PENDING"
        | "APPROVED"
        | "REJECTED"
        | "INACTIVE"
        | "FLAGGED";
      const creatives = await db.creative.findMany({
        where: { status },
        select: { id: true, email: true, firstName: true, lastName: true, status: true },
      });
      return creatives.map((c) => ({
        id: `creative:${c.id}`,
        email: c.email,
        firstName: c.firstName,
        name: `${c.firstName} ${c.lastName}`,
        detail: c.status,
      }));
    }
    case "incomplete-drafts": {
      // Signed up, started the enroll form, saved progress, and never came
      // back to submit it — the audience the client has previously had us
      // nudge by hand-run script. A draft survives even for someone who since
      // finished a *different* application, so exclude anyone who now has a
      // linked Creative.
      const drafts = await db.enrollmentDraft.findMany({
        include: { user: { include: { creative: { select: { id: true } } } } },
      });
      return drafts
        .filter((d) => !d.user.creative)
        .map((d) => ({
          id: `user:${d.user.id}`,
          email: d.user.email,
          firstName: toFirstName(d.user.name),
          name: d.user.name ?? d.user.email,
          detail: "draft saved",
        }));
    }
    default:
      return [];
  }
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

export type MassEmailResult = { error: string } | { ok: true; message: string };

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

  const sent = await sendMassEmail(recipients, content);
  return {
    ok: true,
    message: `Sent to ${sent} of ${recipients.length} recipient${recipients.length === 1 ? "" : "s"}.`,
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
