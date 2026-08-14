/**
 * Mails every transactional email template to reviewers so the design can be
 * checked in a real inbox rather than a browser.
 *
 * Subjects are prefixed with [TEST] — these land in the same inbox that receives
 * genuine application and contact-request notifications, and must never be
 * mistaken for one.
 *
 * Dev-only: excluded from the app build via tsconfig.build.json.
 *
 *   npx tsx scripts/email-test-send.ts you@example.com someone@example.com
 */
import "dotenv/config";
import { Resend } from "resend";

const FROM = "PCC <noreply@aneesatalks.com>";
const PRODUCTION_URL = "https://pakistani-creative-collective.vercel.app";

async function main() {
  const recipients = process.argv.slice(2);
  if (recipients.length === 0) {
    console.error("Usage: npx tsx scripts/email-test-send.ts <address> [address…]");
    process.exitCode = 1;
    return;
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error("RESEND_API_KEY is not set — nothing sent.");
    process.exitCode = 1;
    return;
  }

  // Mail is read in someone else's inbox, never on this machine, so every link
  // and image in it must be publicly reachable. The local .env points
  // NEXT_PUBLIC_APP_URL at localhost for dev, which would ship a broken logo and
  // dead links — override it before the templates are built. Imported
  // dynamically for that reason: a static import would be hoisted above this.
  const appUrl = process.env.EMAIL_TEST_APP_URL ?? PRODUCTION_URL;
  process.env.NEXT_PUBLIC_APP_URL = appUrl;
  const { samples } = await import("./email-samples");

  console.log(`Asset/link base: ${appUrl}`);

  const resend = new Resend(key);
  console.log(`Sending ${samples.length} templates to: ${recipients.join(", ")}\n`);

  let sent = 0;
  let failed = 0;

  for (const sample of samples) {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: recipients,
      subject: `[TEST] ${sample.subject}`,
      html: sample.html,
    });

    if (error) {
      failed++;
      console.log(`✗ ${sample.name}\n    ${error.name}: ${error.message}`);
    } else {
      sent++;
      console.log(`✓ ${sample.name}  (${data?.id})`);
    }

    // Resend's default rate limit is 2 requests/second.
    await new Promise((r) => setTimeout(r, 600));
  }

  console.log(`\nSent ${sent}/${samples.length}${failed ? `, ${failed} failed` : ""}.`);
  if (failed) process.exitCode = 1;
}

main();
