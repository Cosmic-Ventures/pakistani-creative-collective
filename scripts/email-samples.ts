/**
 * The sample renderings of every transactional email, for design review without
 * sending real mail.
 *
 * Shared by scripts/email-preview.ts (renders them to an HTML page) and
 * scripts/email-test-send.ts (mails them to reviewers), so what we show and what
 * we send can never drift apart.
 *
 * The member-facing ones are generated from the template registry rather than
 * re-typed here — they're editable in the admin panel now, and a hand-copied
 * preview would start lying the first time the wording changed. What the
 * preview shows is the *shipped default*; a template the client has since
 * edited renders her copy in the real send and in the admin panel's own preview.
 *
 * Imports the builders from email-render rather than email, so the script never
 * pulls in Prisma or Stripe (and so doesn't need a database to run).
 *
 * Dev-only: excluded from the app build via tsconfig.build.json.
 */
import {
  adminEmailShell,
  ctaButton,
  detailRow,
  emailShell,
  linkRow,
  paragraph,
  quotedBlock,
  signOff,
} from "../src/lib/email-render";
import { EMAIL_TEMPLATES, defaultContent, renderTemplate, sampleValues } from "../src/lib/email-templates";

export type EmailSample = { name: string; subject: string; html: string };

const APP = process.env.NEXT_PUBLIC_APP_URL ?? "https://pcc.aneesatalks.com";

const SAMPLE_BIO =
  "Sara Khan is a Lahore-based cinematographer whose work spans independent features, " +
  "documentary, and music video. She trained at NCA and has shot in Pakistan, the UAE, and the UK.";

/** The operational notifications, which stay fixed in code. */
const adminSamples: EmailSample[] = [
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
];

/** Written fresh by the admin each time, so it has no stored template. */
const bulkSample: EmailSample = {
  name: "Bulk announcement (to all members) — composed in the admin panel",
  subject: "A new opportunity on the Community Dashboard",
  html: emailShell(
    `${paragraph("There's a new funding call posted on the dashboard that may be relevant to you.")}
     ${ctaButton(`${APP}/community`, "View the Community Dashboard →")}
     ${signOff()}`,
    "There's a new funding call posted on the dashboard."
  ),
};

const templateSamples: EmailSample[] = EMAIL_TEMPLATES.map((def) => {
  const rendered = renderTemplate(def, defaultContent(def), sampleValues(def));
  return { name: `${def.name} (editable in the admin panel)`, subject: rendered.subject, html: rendered.html };
});

export const samples: EmailSample[] = [...templateSamples, ...adminSamples, bulkSample];
