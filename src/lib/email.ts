import { randomUUID } from "node:crypto";
import { Resend } from "resend";
import { db } from "./db";
import { isMissingSchemaError } from "./db-availability";
import { getDisplayPrices } from "./stripe";
import {
  adminEmailShell,
  appUrl,
  ctaButton,
  detailRow,
  emailShell,
  escapeHtml,
  escapeMultiline,
  linkRow,
  paragraph,
  quotedBlock,
  signOff,
} from "./email-render";
import {
  defaultContent,
  getTemplateDef,
  MASS_EMAIL_DEF,
  renderTemplate,
  sampleValues,
  type TemplateContent,
} from "./email-templates";

export const isResendConfigured = !!process.env.RESEND_API_KEY;

// Lazy init so build doesn't fail without credentials
function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

const FROM = "PCC <noreply@aneesatalks.com>";

type Outgoing = {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  /** What this email is: a template key, "mass-email", "support", … — shown in the admin's sent-mail log. */
  kind: string;
  /** Groups the individual sends of one mass email so the admin can see them as one. */
  batchId?: string;
};

const isRateLimit = (message: string | null) => !!message && /too many requests|rate limit/i.test(message);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function record(msg: Outgoing, ok: boolean, error: string | null) {
  try {
    await db.emailLog.create({
      data: {
        kind: msg.kind,
        batchId: msg.batchId,
        to: Array.isArray(msg.to) ? msg.to.join(", ") : msg.to,
        subject: msg.subject,
        html: msg.html,
        status: ok ? "sent" : "failed",
        error,
      },
    });
  } catch (e) {
    if (!isMissingSchemaError(e)) console.error("[email] could not record the send in EmailLog", e);
  }
}

/**
 * Sends many emails without tripping Resend's rate limit (10 requests/second):
 * one batch request carries up to 100 emails, and a rate-limited request is retried
 * after a pause. Every email is logged individually, with the real reason if it
 * failed. Returns one result per message, in order.
 *
 * (The first version of the log sent every mass email as its own simultaneous
 * request; with 42 recipients only 10 got through and the rest failed.)
 */
async function deliverMany(msgs: Outgoing[]): Promise<{ ok: boolean; error: string | null }[]> {
  const resend = getResend();
  const results: { ok: boolean; error: string | null }[] = msgs.map(() => ({ ok: false, error: "Email sending isn't configured." }));
  if (!resend) return results;

  for (let start = 0; start < msgs.length; start += 100) {
    const chunk = msgs.slice(start, start + 100);
    let error: string | null = null;
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const res = await resend.batch.send(
          chunk.map((m) => ({
            from: FROM,
            to: m.to,
            subject: m.subject,
            html: m.html,
            ...(m.replyTo ? { replyTo: m.replyTo } : {}),
          }))
        );
        error = res.error ? String(res.error.message ?? res.error) : null;
      } catch (e) {
        error = e instanceof Error ? e.message : String(e);
      }
      if (!isRateLimit(error)) break;
      await sleep(1200 * (attempt + 1));
    }
    if (error && !isRateLimit(error)) {
      // A batch is all-or-nothing, so one bad address would sink everyone. Fall back
      // to one at a time (spaced under the rate limit) to find who actually fails.
      for (let i = 0; i < chunk.length; i++) {
        const m = chunk[i];
        let err: string | null = null;
        try {
          const res = await resend.emails.send({
            from: FROM, to: m.to, subject: m.subject, html: m.html,
            ...(m.replyTo ? { replyTo: m.replyTo } : {}),
          });
          err = res.error ? String(res.error.message ?? res.error) : null;
        } catch (e) {
          err = e instanceof Error ? e.message : String(e);
        }
        results[start + i] = { ok: !err, error: err };
        await sleep(150);
      }
    } else {
      for (let i = 0; i < chunk.length; i++) results[start + i] = { ok: !error, error };
    }
    await sleep(250);
  }

  await Promise.all(msgs.map((m, i) => record(m, results[i].ok, results[i].error)));
  return results;
}

/**
 * The one place an email leaves the app. Records every attempt in EmailLog so the
 * admin panel can show exactly what went out (client, 10/22: "I want to see all
 * emails that get sent out"). Logging is best-effort: the table may not exist yet
 * on the live database, and a failed log must never turn a delivered email — or a
 * failed one — into a different outcome.
 */
async function deliver(msg: Outgoing): Promise<boolean> {
  const resend = getResend();
  if (!resend) return false;
  let ok = false;
  let error: string | null = null;
  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await resend.emails.send({
        from: FROM,
        to: msg.to,
        subject: msg.subject,
        html: msg.html,
        ...(msg.replyTo ? { replyTo: msg.replyTo } : {}),
      });
      ok = !res?.error;
      error = res?.error ? String(res.error.message ?? res.error) : null;
      if (ok || !isRateLimit(error)) break;
      await sleep(1100 * (attempt + 1));
    }
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }
  await record(msg, ok, error);
  if (!ok) console.error(`[email] send failed (${msg.kind}): ${error}`);
  return ok;
}

// Every operational notification (new application, contact request, community
// post awaiting review) lands here. Client-specified 08/08 round: this is the
// PCC-specific inbox, not the general Aneesa Talks one. Overridable by env so
// the address can be changed without a redeploy.
const ADMIN_EMAIL = process.env.PCC_NOTIFICATION_EMAIL ?? "pcc@aneesatalks.com";

// The chrome and builders live in email-render.ts (importable from the browser,
// which this file is not). Re-exported here because the preview script, the
// tests and the rest of the app have always imported them from "@/lib/email".
export {
  emailShell,
  adminEmailShell,
  greeting,
  paragraph,
  signOff,
  ctaButton,
  detailRow,
  quotedBlock,
  linkRow,
  escapeHtml,
  appUrl,
} from "./email-render";

/**
 * The client's edited copy for a template, or the shipped default when she
 * hasn't touched it. A failed lookup falls back to the default rather than
 * throwing: an email that goes out with the original wording is a far smaller
 * problem than an approval that silently fails because the database hiccuped.
 */
async function templateContent(key: string): Promise<TemplateContent> {
  const def = getTemplateDef(key);
  if (!def) throw new Error(`Unknown email template: ${key}`);
  try {
    const stored = await db.emailTemplate.findUnique({ where: { key } });
    if (stored) {
      return { subject: stored.subject, preheader: stored.preheader, body: stored.body };
    }
  } catch (error) {
    console.error(`Falling back to the default copy for email template "${key}"`, error);
  }
  return defaultContent(def);
}

/** Renders a template against live values — also used by the admin test-send. */
export async function renderStoredTemplate(
  key: string,
  values: Record<string, string>
): Promise<{ subject: string; html: string }> {
  const def = getTemplateDef(key);
  if (!def) throw new Error(`Unknown email template: ${key}`);
  return renderTemplate(def, await templateContent(key), values);
}

async function sendTemplate(key: string, to: string, values: Record<string, string>) {
  if (!process.env.RESEND_API_KEY) return;
  const { subject, html } = await renderStoredTemplate(key, values);
  await deliver({ to, subject, html, kind: key });
}

/**
 * The admin panel's "send me a test" button. Same render path as a real send,
 * with the subject marked so a test can never be mistaken for the real thing
 * sitting in the client's inbox.
 */
export async function sendTemplatePreview(key: string, to: string, values: Record<string, string>) {
  if (!process.env.RESEND_API_KEY) return;
  const { subject, html } = await renderStoredTemplate(key, values);
  await deliver({ to, subject: `[Test] ${subject}`, html, kind: `test:${key}` });
}

/**
 * What the admin notification summarises about a new application. An object
 * rather than positional arguments — the review summary grows between feedback
 * rounds, and five same-typed strings in a row is a bug waiting to happen.
 */
export type EnrollmentSummary = {
  firstName: string;
  lastName: string;
  email: string;
  bio: string;
  portfolioLink?: string | null;
  location?: string | null;
  roles?: string[];
  experienceLevel?: string | null;
};

export async function sendEnrollmentNotification(applicant: EnrollmentSummary) {
  if (!process.env.RESEND_API_KEY) return;

  const { firstName, lastName, email, bio, portfolioLink, location, roles, experienceLevel } = applicant;

  // Enough to judge an application from the inbox without opening the admin
  // panel — the client asked for the bio and portfolio link in particular
  // (08/08 round), since those are what verifying someone's experience turns on.
  await deliver({
    kind: "admin:new-application",
    to: ADMIN_EMAIL,
    subject: `New PCC Application: ${firstName} ${lastName}`,
    html: adminEmailShell(
      "New Application",
      `${detailRow("Applicant", `${firstName} ${lastName}`)}
       ${detailRow("Email", email)}
       ${location ? detailRow("Location", location) : ""}
       ${roles?.length ? detailRow("Role(s)", roles.join(", ")) : ""}
       ${experienceLevel ? detailRow("Experience level", experienceLevel) : ""}
       ${portfolioLink ? linkRow("Portfolio", portfolioLink) : ""}
       ${quotedBlock("Bio", bio)}
       ${ctaButton(`${appUrl()}/admin/applications`, "Review in admin panel →")}`
    ),
  });

  await sendTemplate("application-received", email, { firstName });
}

export async function sendContactRequestNotification(
  creativeName: string,
  requesterName: string,
  requestType: string,
  message: string,
  timeline: string,
  adminRequestUrl: string,
  needsConfirmation = false
) {
  if (!process.env.RESEND_API_KEY) return;

  await deliver({
    kind: "admin:contact-request",
    to: ADMIN_EMAIL,
    subject: `${needsConfirmation ? "[Confirm interest] " : ""}New Contact Request for ${creativeName}`,
    html: adminEmailShell(
      "New Contact Request",
      `${
        needsConfirmation
          ? paragraph(
              `<strong>${escapeHtml(creativeName)} hasn't set any Work For Hire preferences.</strong> ` +
                "Please email them to ask whether they'd like to be connected with this person before forwarding the request."
            )
          : ""
      }
       ${detailRow("Creative", creativeName)}
       ${detailRow("From", requesterName)}
       ${detailRow("Request type", requestType)}
       ${detailRow("Timeline", timeline)}
       ${detailRow("Message", message)}
       ${ctaButton(adminRequestUrl, "Review in admin panel →")}`
    ),
  });
}

export async function sendContactRequestForwardEmail(
  creativeFirstName: string,
  creativeEmail: string,
  requesterName: string,
  requestType: string,
  message: string,
  timeline: string
) {
  await sendTemplate("contact-request-forwarded", creativeEmail, {
    firstName: creativeFirstName,
    requesterName,
    requestType,
    timeline,
    message,
  });
}

export async function sendApprovalEmail(firstName: string, email: string, slug: string) {
  if (!process.env.RESEND_API_KEY) return;

  // The shipped copy no longer links to either page (the directory is still
  // private), but both values stay available to the template so the client can
  // put the buttons back from the admin panel the day it goes public.
  const prices = await getDisplayPrices();

  await sendTemplate("application-approved", email, {
    firstName,
    profileUrl: `${appUrl()}/directory/${slug}`,
    subscribeUrl: `${appUrl()}/subscribe`,
    monthlyPrice: prices.monthly,
  });
}

export async function sendRevisionRequestEmail(firstName: string, email: string, note: string) {
  await sendTemplate("application-revision", email, { firstName, note });
}

export async function sendRejectionEmail(firstName: string, email: string) {
  await sendTemplate("application-rejected", email, { firstName });
}

export async function sendNewCommunityPostNotification(creativeName: string, title: string, category: string) {
  if (!process.env.RESEND_API_KEY) return;

  await deliver({
    kind: "admin:community-post",
    to: ADMIN_EMAIL,
    subject: `New Community Post for review: ${title}`,
    html: adminEmailShell(
      "New Community Post",
      `${detailRow("Member", creativeName)}
       ${detailRow("Category", category)}
       ${detailRow("Title", title)}
       ${ctaButton(`${appUrl()}/admin/community`, "Review in admin panel →")}`
    ),
  });
}

export async function sendPostDecisionEmail(firstName: string, email: string, title: string, approved: boolean) {
  await sendTemplate(approved ? "community-post-approved" : "community-post-rejected", email, {
    firstName,
    postTitle: title,
  });
}

export async function sendCommentRemovedEmail(firstName: string, email: string) {
  await sendTemplate("comment-removed", email, { firstName });
}

export async function sendBulkCommunityNotification(recipients: string[], subject: string, message: string) {
  if (!process.env.RESEND_API_KEY || recipients.length === 0) return;

  const html = emailShell(
    // Admin-composed, but still plain text typed into a textarea — escape it and
    // keep the line breaks rather than trusting it as HTML.
    `${paragraph(escapeMultiline(message))}
     ${ctaButton(`${appUrl()}/community`, "View the Community Dashboard →")}
     ${signOff()}`,
    message.slice(0, 120)
  );

  await Promise.all(
    recipients.map((to) =>
      deliver({ to, subject, html, kind: "community-bulk" })
    )
  );
}

export async function sendFeatureNotification(firstName: string, email: string, slug: string) {
  await sendTemplate("featured-creative", email, {
    firstName,
    profileUrl: `${appUrl()}/directory/${slug}`,
  });
}

/**
 * The admin panel's Mass Email tool: one composed message, sent as its own
 * individual Resend call per recipient (never one To/Cc line — recipients
 * shouldn't see each other's addresses) so each lands with their own
 * {{firstName}} filled in. Returns how many actually went out, since a
 * partial failure shouldn't look identical to a full send.
 */
export type MassEmailOutcome = { sent: number; failures: { email: string; error: string }[] };

export async function sendMassEmail(
  recipients: { email: string; firstName: string }[],
  content: TemplateContent
): Promise<MassEmailOutcome> {
  if (!process.env.RESEND_API_KEY || recipients.length === 0) return { sent: 0, failures: [] };
  const batchId = randomUUID();

  const results = await deliverMany(
    recipients.map((r) => {
      const { subject, html } = renderTemplate(MASS_EMAIL_DEF, content, { firstName: r.firstName });
      return { to: r.email, subject, html, kind: "mass-email", batchId };
    })
  );
  const failures = recipients.flatMap((r, i) => (results[i].ok ? [] : [{ email: r.email, error: results[i].error ?? "Unknown error" }]));
  return { sent: recipients.length - failures.length, failures };
}

/** Re-sends the stored copy of every failed email in one mass send. Returns how many went out. */
export async function retryFailedMassEmails(batchId: string): Promise<MassEmailOutcome> {
  const failed = await db.emailLog.findMany({ where: { batchId, status: "failed" } });
  if (failed.length === 0) return { sent: 0, failures: [] };
  const results = await deliverMany(
    failed.map((f) => ({ to: f.to, subject: f.subject, html: f.html, kind: "mass-email", batchId }))
  );
  // The old failed rows are superseded by the fresh attempts logged above.
  await db.emailLog.updateMany({ where: { id: { in: failed.map((f) => f.id) } }, data: { status: "retried" } });
  const failures = failed.flatMap((f, i) => (results[i].ok ? [] : [{ email: f.to, error: results[i].error ?? "Unknown error" }]));
  return { sent: failed.length - failures.length, failures };
}

/** Same render path as a real mass send, sent only to the admin previewing it. */
export async function sendMassEmailTest(to: string, content: TemplateContent) {
  if (!process.env.RESEND_API_KEY) return;
  const { subject, html } = renderTemplate(MASS_EMAIL_DEF, content, sampleValues(MASS_EMAIL_DEF));
  await deliver({ to, subject: `[Test] ${subject}`, html, kind: "test:mass-email" });
}

/** How long a password-reset link stays usable. Mirrored in the email copy. */
export const PASSWORD_RESET_EXPIRY_HOURS = 1;

export async function sendPasswordResetEmail(firstName: string, email: string, resetUrl: string) {
  await sendTemplate("password-reset", email, {
    firstName,
    resetUrl,
    expiryHours: String(PASSWORD_RESET_EXPIRY_HOURS),
  });
}

/**
 * A member's Customer Support message. One email to the PCC inbox and every
 * admin, with Reply-To set to the member — so any admin hitting reply starts the
 * thread with them directly and the PCC inbox keeps a copy of all of it. Admins
 * are told about each other deliberately (they're one team); members are never
 * exposed to the list.
 */
export async function sendSupportRequest(input: {
  fromName: string;
  fromEmail: string;
  kind: string;
  subject: string;
  message: string;
  adminEmails: string[];
}): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;
  const to = [...new Set([ADMIN_EMAIL, ...input.adminEmails].map((e) => e.trim().toLowerCase()))];
  return deliver({
    kind: "support",
    to,
    replyTo: input.fromEmail,
    subject: `[PCC Support] ${input.kind}: ${input.subject}`,
    html: adminEmailShell(
      "Customer Support",
      `${detailRow("From", `${input.fromName} <${input.fromEmail}>`)}
       ${detailRow("Type", input.kind)}
       ${detailRow("Subject", input.subject)}
       ${detailRow("Message", input.message)}
       ${paragraph("Reply to this email to respond to the member directly.")}`
    ),
  });
}
