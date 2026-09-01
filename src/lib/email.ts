import { Resend } from "resend";
import { db } from "./db";
import { getDisplayPrices } from "./stripe";
import {
  adminEmailShell,
  appUrl,
  ctaButton,
  detailRow,
  emailShell,
  escapeMultiline,
  linkRow,
  paragraph,
  quotedBlock,
  signOff,
} from "./email-render";
import {
  defaultContent,
  getTemplateDef,
  renderTemplate,
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
  await getResend()?.emails.send({ from: FROM, to, subject, html });
}

/**
 * The admin panel's "send me a test" button. Same render path as a real send,
 * with the subject marked so a test can never be mistaken for the real thing
 * sitting in the client's inbox.
 */
export async function sendTemplatePreview(key: string, to: string, values: Record<string, string>) {
  if (!process.env.RESEND_API_KEY) return;
  const { subject, html } = await renderStoredTemplate(key, values);
  await getResend()?.emails.send({ from: FROM, to, subject: `[Test] ${subject}`, html });
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
  await getResend()?.emails.send({
    from: FROM,
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
  adminRequestUrl: string
) {
  if (!process.env.RESEND_API_KEY) return;

  await getResend()?.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `New Contact Request for ${creativeName}`,
    html: adminEmailShell(
      "New Contact Request",
      `${detailRow("Creative", creativeName)}
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

  await getResend()?.emails.send({
    from: FROM,
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
      getResend()?.emails.send({ from: FROM, to, subject, html })
    )
  );
}

export async function sendFeatureNotification(firstName: string, email: string, slug: string) {
  await sendTemplate("featured-creative", email, {
    firstName,
    profileUrl: `${appUrl()}/directory/${slug}`,
  });
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
