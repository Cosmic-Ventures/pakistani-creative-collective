import { Resend } from "resend";

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

const BRAND_GREEN = "#294D3D";
const BRAND_BROWN = "#2A1511";
const BRAND_CREAM = "#FFFCF9";
const BODY_FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const HEADING_FONT = "Georgia, 'Times New Roman', serif";

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://pakistani-creative-collective.vercel.app";
}

// Every email is sent through this — inline styles throughout because most
// mail clients (Gmail included) strip <style> blocks, and table-based layout
// because that's still the only thing that renders consistently across them.
function emailShell(bodyHtml: string, preheader = ""): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Pakistani Creative Collective</title>
</head>
<body style="margin:0; padding:0; background-color:#F2EFE9;">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F2EFE9;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background-color:${BRAND_CREAM}; border-radius:16px; overflow:hidden; border:1px solid rgba(41,77,61,0.12);">
          <tr>
            <td style="background-color:${BRAND_GREEN}; padding:24px 32px;">
              <a href="${appUrl()}" style="text-decoration:none;">
                <span style="font-family:${HEADING_FONT}; font-size:16px; font-weight:700; letter-spacing:0.04em; color:${BRAND_CREAM};">PAKISTANI CREATIVE COLLECTIVE</span>
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:32px; font-family:${BODY_FONT}; font-size:15px; line-height:1.65; color:${BRAND_BROWN};">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px; border-top:1px solid rgba(41,77,61,0.1);">
              <p style="margin:0; font-family:${BODY_FONT}; font-size:12px; color:rgba(42,21,17,0.5);">
                Pakistani Creative Collective &middot; Curated by
                <a href="https://aneesatalks.com" style="color:rgba(42,21,17,0.5);">Aneesa Talks</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function greeting(firstName: string): string {
  return `<p style="margin:0 0 16px;">Hi ${firstName},</p>`;
}

function paragraph(html: string): string {
  return `<p style="margin:0 0 16px;">${html}</p>`;
}

function signOff(): string {
  return `<p style="margin:24px 0 0; color:rgba(42,21,17,0.7);">&mdash; Aneesa Talks</p>`;
}

function ctaButton(href: string, label: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;">
      <tr>
        <td style="background-color:${BRAND_GREEN}; border-radius:999px;">
          <a href="${href}" style="display:inline-block; padding:12px 24px; font-family:${BODY_FONT}; font-size:14px; font-weight:600; color:${BRAND_CREAM}; text-decoration:none;">${label}</a>
        </td>
      </tr>
    </table>`;
}

function detailRow(label: string, value: string): string {
  return `<p style="margin:0 0 8px;"><strong style="color:${BRAND_GREEN};">${label}:</strong> ${value}</p>`;
}

// Compact shell for internal admin notifications — same brand chrome, but the
// body skips the greeting/sign-off framing since these are operational, not
// member-facing.
function adminEmailShell(title: string, bodyHtml: string): string {
  return emailShell(`
    <p style="margin:0 0 16px; font-family:${HEADING_FONT}; font-size:18px; font-weight:700; color:${BRAND_GREEN};">${title}</p>
    ${bodyHtml}
  `);
}

export async function sendEnrollmentNotification(
  firstName: string,
  lastName: string,
  email: string
) {
  if (!process.env.RESEND_API_KEY) return;

  await getResend()?.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `New PCC Application: ${firstName} ${lastName}`,
    html: adminEmailShell(
      "New Application",
      `${detailRow("Applicant", `${firstName} ${lastName}`)}
       ${detailRow("Email", email)}
       ${ctaButton(`${appUrl()}/admin/applications`, "Review in admin panel →")}`
    ),
  });

  await getResend()?.emails.send({
    from: FROM,
    to: email,
    subject: "PCC — We received your application",
    html: emailShell(
      `${greeting(firstName)}
       ${paragraph("Thank you for applying to the Pakistani Creative Collective. We&rsquo;ve received your application and will review it shortly. You&rsquo;ll hear from us via email once a decision has been made.")}
       ${signOff()}`,
      "We've received your application and will be in touch soon."
    ),
  });
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
  if (!process.env.RESEND_API_KEY) return;

  await getResend()?.emails.send({
    from: FROM,
    to: creativeEmail,
    subject: "You have a new contact request on the PCC",
    html: emailShell(
      `${greeting(creativeFirstName)}
       ${paragraph("Someone is interested in working with you through the Pakistani Creative Collective. This request has been reviewed by Aneesa Talks and forwarded to you &mdash; you&rsquo;re not obligated to respond.")}
       <div style="background-color:rgba(41,77,61,0.05); border-radius:12px; padding:16px 20px; margin:0 0 20px;">
         ${detailRow("From", requesterName)}
         ${detailRow("Request type", requestType)}
         ${detailRow("Timeline", timeline)}
         <p style="margin:8px 0 0;"><strong style="color:${BRAND_GREEN};">Message:</strong><br />${message}</p>
       </div>
       ${paragraph("Reply to Aneesa Talks directly to let us know if you&rsquo;d like to connect, and we&rsquo;ll help facilitate the introduction.")}
       ${signOff()}`,
      `${requesterName} would like to connect with you through the PCC.`
    ),
  });
}

export async function sendApprovalEmail(firstName: string, email: string, slug: string) {
  if (!process.env.RESEND_API_KEY) return;

  await getResend()?.emails.send({
    from: FROM,
    to: email,
    subject: "You've been approved for the Pakistani Creative Collective!",
    html: emailShell(
      `${greeting(firstName)}
       ${paragraph("Great news &mdash; your application to the Pakistani Creative Collective has been approved. Your profile is now live in the database.")}
       ${ctaButton(`${appUrl()}/directory/${slug}`, "View your profile →")}
       ${paragraph("To access the full directory and submit contact requests, you'll need to subscribe.")}
       ${ctaButton(`${appUrl()}/subscribe`, "Subscribe from $7.86/month →")}
       ${signOff()}`,
      "Your profile is now live in the directory."
    ),
  });
}

export async function sendRevisionRequestEmail(firstName: string, email: string, note: string) {
  if (!process.env.RESEND_API_KEY) return;

  await getResend()?.emails.send({
    from: FROM,
    to: email,
    subject: "PCC — Your application needs a few changes",
    html: emailShell(
      `${greeting(firstName)}
       ${paragraph("Thanks for applying to the Pakistani Creative Collective. Your application needs a few changes before we can approve it:")}
       <blockquote style="margin:0 0 20px; padding:12px 16px; border-left:3px solid ${BRAND_GREEN}; background-color:rgba(41,77,61,0.05); border-radius:0 8px 8px 0;">${note}</blockquote>
       ${paragraph("You're welcome to reapply with the revisions above using the same application link.")}
       ${ctaButton(`${appUrl()}/enroll`, "Reapply to the PCC →")}
       ${signOff()}`,
      "Your application needs a few changes before it can be approved."
    ),
  });
}

export async function sendRejectionEmail(firstName: string, email: string) {
  if (!process.env.RESEND_API_KEY) return;

  await getResend()?.emails.send({
    from: FROM,
    to: email,
    subject: "PCC — Application Update",
    html: emailShell(
      `${greeting(firstName)}
       ${paragraph("Thank you for your interest in the Pakistani Creative Collective. After reviewing your application, we&rsquo;re not able to add you to the database at this time. This may change in the future.")}
       ${signOff()}`,
      "An update on your PCC application."
    ),
  });
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
  if (!process.env.RESEND_API_KEY) return;

  await getResend()?.emails.send({
    from: FROM,
    to: email,
    subject: approved ? "Your Community post is live" : "Update on your Community post",
    html: emailShell(
      approved
        ? `${greeting(firstName)}
           ${paragraph(`Your post &ldquo;${title}&rdquo; has been approved and is now live on the Community Dashboard.`)}
           ${ctaButton(`${appUrl()}/community`, "View the dashboard →")}
           ${signOff()}`
        : `${greeting(firstName)}
           ${paragraph(`Your post &ldquo;${title}&rdquo; wasn&rsquo;t approved for the Community Dashboard at this time.`)}
           ${signOff()}`,
      approved ? "Your post is now live on the Community Dashboard." : "An update on your Community post."
    ),
  });
}

export async function sendCommentRemovedEmail(firstName: string, email: string) {
  if (!process.env.RESEND_API_KEY) return;

  await getResend()?.emails.send({
    from: FROM,
    to: email,
    subject: "A comment of yours was removed",
    html: emailShell(
      `${greeting(firstName)}
       ${paragraph("A comment you posted on the Community Dashboard was removed by Aneesa Talks.")}
       ${signOff()}`,
      "A comment you posted was removed."
    ),
  });
}

export async function sendBulkCommunityNotification(recipients: string[], subject: string, message: string) {
  if (!process.env.RESEND_API_KEY || recipients.length === 0) return;

  const html = emailShell(
    `${paragraph(message)}
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
  if (!process.env.RESEND_API_KEY) return;

  await getResend()?.emails.send({
    from: FROM,
    to: email,
    subject: "You've been selected as a PCC Featured Creative!",
    html: emailShell(
      `${greeting(firstName)}
       ${paragraph("We&rsquo;re excited to let you know that your profile has been selected as a featured creative for this month on the Pakistani Creative Collective. Your full profile will be publicly visible to all visitors for the duration of the featured period.")}
       ${ctaButton(`${appUrl()}/directory/${slug}`, "View your profile →")}
       ${signOff()}`,
      "Your profile has been selected as this month's featured creative."
    ),
  });
}
