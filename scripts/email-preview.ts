/**
 * Renders the transactional email templates to a single HTML page so their
 * design can be reviewed (and shown to the client) without sending real mail.
 *
 * Dev-only: excluded from the app build via tsconfig.build.json, same as the
 * screenshot script.
 *
 *   npx tsx scripts/email-preview.ts && open docs/email-preview.html
 */
import { writeFileSync, mkdirSync } from "node:fs";
import {
  emailShell,
  adminEmailShell,
  greeting,
  paragraph,
  signOff,
  ctaButton,
  detailRow,
  quotedBlock,
  linkRow,
} from "../src/lib/email";

const APP = process.env.NEXT_PUBLIC_APP_URL ?? "https://pakistani-creative-collective.vercel.app";

const SAMPLE_BIO =
  "Sara Khan is a Lahore-based cinematographer whose work spans independent features, " +
  "documentary, and music video. She trained at NCA and has shot in Pakistan, the UAE, and the UK.";

const samples: { name: string; subject: string; html: string }[] = [
  {
    name: "New application (to the PCC inbox)",
    subject: "New PCC Application: Sara Khan",
    html: adminEmailShell(
      "New Application",
      `${detailRow("Applicant", "Sara Khan")}
       ${detailRow("Email", "sara@example.com")}
       ${detailRow("Location", "Lahore")}
       ${detailRow("Role(s)", "Director of Photography (DP/Cinematographer), Camera Operator")}
       ${detailRow("Experience level", "Established Creative")}
       ${linkRow("Portfolio", "sarakhan.com")}
       ${quotedBlock("Bio", SAMPLE_BIO)}
       ${ctaButton(`${APP}/admin/applications`, "Review in admin panel →")}`
    ),
  },
  {
    name: "Application received (to the applicant)",
    subject: "PCC — We received your application",
    html: emailShell(
      `${greeting("Sara")}
       ${paragraph(
         "Thank you for applying to the Pakistani Creative Collective. We&rsquo;ve received your application and will review it shortly. You&rsquo;ll hear from us via email once a decision has been made."
       )}
       ${signOff()}`,
      "We've received your application and will be in touch soon."
    ),
  },
  {
    name: "Approved (to the applicant)",
    subject: "You've been approved for the Pakistani Creative Collective!",
    html: emailShell(
      `${greeting("Sara")}
       ${paragraph(
         "Great news &mdash; your application to the Pakistani Creative Collective has been approved. Your profile is now live in the database."
       )}
       ${ctaButton(`${APP}/directory/sara-khan`, "View your profile →")}
       ${paragraph("To access the full directory and submit contact requests, you'll need to subscribe.")}
       ${ctaButton(`${APP}/subscribe`, "Subscribe from $7.99/month →")}
       ${signOff()}`,
      "Your profile is now live in the directory."
    ),
  },
  {
    name: "Needs revisions (to the applicant)",
    subject: "PCC — Your application needs a few changes",
    html: emailShell(
      `${greeting("Sara")}
       ${paragraph(
         "Thanks for applying to the Pakistani Creative Collective. Your application needs a few changes before we can approve it:"
       )}
       ${quotedBlock(
         "What needs revising",
         "Please shorten the bio to under 200 words and add a working link to your reel — the current one 404s."
       )}
       ${paragraph("You're welcome to reapply with the revisions above using the same application link.")}
       ${ctaButton(`${APP}/enroll`, "Reapply to the PCC →")}
       ${signOff()}`,
      "Your application needs a few changes before it can be approved."
    ),
  },
  {
    name: "Not accepted (to the applicant)",
    subject: "PCC — Application Update",
    html: emailShell(
      `${greeting("Sara")}
       ${paragraph(
         "Thank you for your interest in the Pakistani Creative Collective. After reviewing your application, we&rsquo;re not able to add you to the database at this time. This may change in the future."
       )}
       ${signOff()}`,
      "An update on your PCC application."
    ),
  },
  {
    name: "New contact request (to the PCC inbox)",
    subject: "New Contact Request for Sara Khan",
    html: adminEmailShell(
      "New Contact Request",
      `${detailRow("Creative", "Sara Khan")}
       ${detailRow("From", "Layla Ahmed, Northwind Films")}
       ${detailRow("Request type", "Paid project")}
       ${detailRow("Timeline", "Shooting in March")}
       ${quotedBlock("Message", "We're crewing up a short documentary in Karachi and would love to talk to Sara about shooting it.")}
       ${ctaButton(`${APP}/admin/contact-requests`, "Review in admin panel →")}`
    ),
  },
  {
    name: "Contact request forwarded (to the creative)",
    subject: "You have a new contact request on the PCC",
    html: emailShell(
      `${greeting("Sara")}
       ${paragraph(
         "Someone is interested in working with you through the Pakistani Creative Collective. This request has been reviewed by Aneesa Talks and forwarded to you &mdash; you&rsquo;re not obligated to respond."
       )}
       ${detailRow("From", "Layla Ahmed, Northwind Films")}
       ${detailRow("Request type", "Paid project")}
       ${detailRow("Timeline", "Shooting in March")}
       ${quotedBlock("Message", "We're crewing up a short documentary in Karachi and would love to talk to Sara about shooting it.")}
       ${paragraph(
         "Reply to Aneesa Talks directly to let us know if you&rsquo;d like to connect, and we&rsquo;ll help facilitate the introduction."
       )}
       ${signOff()}`,
      "Layla Ahmed would like to connect with you through the PCC."
    ),
  },
  {
    name: "New community post (to the PCC inbox)",
    subject: "New Community Post for review: Wrapped on my first feature",
    html: adminEmailShell(
      "New Community Post",
      `${detailRow("Member", "Sara Khan")}
       ${detailRow("Category", "Recent Work")}
       ${detailRow("Title", "Wrapped on my first feature")}
       ${ctaButton(`${APP}/admin/community`, "Review in admin panel →")}`
    ),
  },
  {
    name: "Community post approved (to the member)",
    subject: "Your Community post is live",
    html: emailShell(
      `${greeting("Sara")}
       ${paragraph(
         "Your post &ldquo;Wrapped on my first feature&rdquo; has been approved and is now live on the Community Dashboard."
       )}
       ${ctaButton(`${APP}/community`, "View the dashboard →")}
       ${signOff()}`,
      "Your post is now live on the Community Dashboard."
    ),
  },
  {
    name: "Comment removed (to the member)",
    subject: "A comment of yours was removed",
    html: emailShell(
      `${greeting("Sara")}
       ${paragraph("A comment you posted on the Community Dashboard was removed by Aneesa Talks.")}
       ${signOff()}`,
      "A comment you posted was removed."
    ),
  },
  {
    name: "Featured creative (to the member)",
    subject: "You've been selected as a PCC Featured Creative!",
    html: emailShell(
      `${greeting("Sara")}
       ${paragraph(
         "We&rsquo;re excited to let you know that your profile has been selected as a featured creative for this month on the Pakistani Creative Collective. Your full profile will be publicly visible to all visitors for the duration of the featured period."
       )}
       ${ctaButton(`${APP}/directory/sara-khan`, "View your profile →")}
       ${signOff()}`,
      "Your profile has been selected as this month's featured creative."
    ),
  },
  {
    name: "Bulk announcement (to all members)",
    subject: "A new opportunity on the Community Dashboard",
    html: emailShell(
      `${paragraph("There's a new funding call posted on the dashboard that may be relevant to you.")}
       ${ctaButton(`${APP}/community`, "View the Community Dashboard →")}
       ${signOff()}`,
      "There's a new funding call posted on the dashboard."
    ),
  },
];

const page = `<!doctype html>
<meta charset="utf-8" />
<title>PCC email templates</title>
<style>
  body { margin:0; background:#e9e6e0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif; }
  .wrap { max-width: 700px; margin: 0 auto; padding: 32px 16px 64px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .note { color:#555; font-size:13px; margin:0 0 32px; }
  .card { margin: 0 0 40px; }
  .label { font-size: 13px; font-weight: 600; margin: 0 0 2px; }
  .subject { font-size: 12px; color:#555; margin: 0 0 8px; }
  iframe { width:100%; height:640px; border:1px solid rgba(0,0,0,.15); border-radius:8px; background:#fff; }
</style>
<div class="wrap">
  <h1>PCC transactional emails</h1>
  <p class="note">Every email shares one shell: white square logo on the dark green band, cream card, black body text.</p>
  ${samples
    .map(
      (s) => `<div class="card">
    <p class="label">${s.name}</p>
    <p class="subject">Subject: ${s.subject}</p>
    <iframe srcdoc="${s.html.replace(/"/g, "&quot;")}"></iframe>
  </div>`
    )
    .join("\n")}
</div>`;

mkdirSync("docs", { recursive: true });
writeFileSync("docs/email-preview.html", page);
console.log(`Wrote docs/email-preview.html (${samples.length} templates)`);
