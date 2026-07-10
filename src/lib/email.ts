import { Resend } from "resend";

export const isResendConfigured = !!process.env.RESEND_API_KEY;

// Lazy init so build doesn't fail without credentials
function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

const FROM = "PCC <noreply@aneesatalks.com>";
const ADMIN_EMAIL = "aneesatalks@gmail.com";

export async function sendEnrollmentNotification(
  firstName: string,
  lastName: string,
  email: string
) {
  if (!process.env.RESEND_API_KEY) return;

  // Notify admin
  await getResend()?.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `New PCC Application: ${firstName} ${lastName}`,
    html: `<p>A new application has been submitted by <strong>${firstName} ${lastName}</strong> (${email}).</p><p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/applications">Review in admin panel →</a></p>`,
  });

  // Confirm to applicant
  await getResend()?.emails.send({
    from: FROM,
    to: email,
    subject: "PCC — We received your application",
    html: `<p>Hi ${firstName},</p><p>Thank you for applying to the Pakistani Creative Collective. We've received your application and will review it shortly. You'll hear from us via email once a decision has been made.</p><p>— Aneesa Talks</p>`,
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
    html: `
      <p><strong>Creative:</strong> ${creativeName}</p>
      <p><strong>From:</strong> ${requesterName}</p>
      <p><strong>Request type:</strong> ${requestType}</p>
      <p><strong>Timeline:</strong> ${timeline}</p>
      <p><strong>Message:</strong> ${message}</p>
      <p><a href="${adminRequestUrl}">Review in admin panel →</a></p>
    `,
  });
}

export async function sendApprovalEmail(firstName: string, email: string, slug: string) {
  if (!process.env.RESEND_API_KEY) return;

  await getResend()?.emails.send({
    from: FROM,
    to: email,
    subject: "You've been approved for the Pakistani Creative Collective!",
    html: `
      <p>Hi ${firstName},</p>
      <p>Great news — your application to the Pakistani Creative Collective has been approved. Your profile is now live in the database.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/directory/${slug}">View your profile →</a></p>
      <p>To access the full directory and submit contact requests, you'll need to subscribe.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/subscribe">Subscribe from $30/year →</a></p>
      <p>— Aneesa Talks</p>
    `,
  });
}

export async function sendRejectionEmail(firstName: string, email: string) {
  if (!process.env.RESEND_API_KEY) return;

  await getResend()?.emails.send({
    from: FROM,
    to: email,
    subject: "PCC — Application Update",
    html: `
      <p>Hi ${firstName},</p>
      <p>Thank you for your interest in the Pakistani Creative Collective. After reviewing your application, we're not able to add you to the database at this time. This may change in the future.</p>
      <p>— Aneesa Talks</p>
    `,
  });
}

export async function sendNewCommunityPostNotification(creativeName: string, title: string, category: string) {
  if (!process.env.RESEND_API_KEY) return;

  await getResend()?.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `New Community Post for review: ${title}`,
    html: `
      <p><strong>${creativeName}</strong> submitted a new Community Dashboard post.</p>
      <p><strong>Category:</strong> ${category}</p>
      <p><strong>Title:</strong> ${title}</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/community">Review in admin panel →</a></p>
    `,
  });
}

export async function sendPostDecisionEmail(firstName: string, email: string, title: string, approved: boolean) {
  if (!process.env.RESEND_API_KEY) return;

  await getResend()?.emails.send({
    from: FROM,
    to: email,
    subject: approved ? "Your Community post is live" : "Update on your Community post",
    html: approved
      ? `<p>Hi ${firstName},</p><p>Your post "${title}" has been approved and is now live on the Community Dashboard.</p><p><a href="${process.env.NEXT_PUBLIC_APP_URL}/community">View the dashboard →</a></p><p>— Aneesa Talks</p>`
      : `<p>Hi ${firstName},</p><p>Your post "${title}" wasn't approved for the Community Dashboard at this time.</p><p>— Aneesa Talks</p>`,
  });
}

export async function sendCommentRemovedEmail(firstName: string, email: string) {
  if (!process.env.RESEND_API_KEY) return;

  await getResend()?.emails.send({
    from: FROM,
    to: email,
    subject: "A comment of yours was removed",
    html: `<p>Hi ${firstName},</p><p>A comment you posted on the Community Dashboard was removed by Aneesa Talks.</p><p>— Aneesa Talks</p>`,
  });
}

export async function sendBulkCommunityNotification(recipients: string[], subject: string, message: string) {
  if (!process.env.RESEND_API_KEY || recipients.length === 0) return;

  await Promise.all(
    recipients.map((to) =>
      getResend()?.emails.send({
        from: FROM,
        to,
        subject,
        html: `<p>${message}</p><p><a href="${process.env.NEXT_PUBLIC_APP_URL}/community">View the Community Dashboard →</a></p><p>— Aneesa Talks</p>`,
      })
    )
  );
}

export async function sendFeatureNotification(firstName: string, email: string, slug: string) {
  if (!process.env.RESEND_API_KEY) return;

  await getResend()?.emails.send({
    from: FROM,
    to: email,
    subject: "You've been selected as a PCC Featured Creative!",
    html: `
      <p>Hi ${firstName},</p>
      <p>We're excited to let you know that your profile has been selected as a featured creative for this month on the Pakistani Creative Collective. Your full profile will be publicly visible to all visitors for the duration of the featured period.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/directory/${slug}">View your profile →</a></p>
      <p>— Aneesa Talks</p>
    `,
  });
}
