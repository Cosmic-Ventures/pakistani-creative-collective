/**
 * One-off: copies emails Resend still holds from before the in-app log existed
 * into EmailLog, so they show up under Admin → Sent Emails.
 *
 * The app's normal RESEND_API_KEY is send-only and can't list mail. Make a
 * full-access key in the Resend dashboard (API Keys → Permission: Full access) and run:
 *
 *   RESEND_FULL_ACCESS_KEY=re_xxx pnpm exec tsx scripts/backfill-email-log.ts
 *
 * Add --dry-run to count without writing. Safe to re-run: anything already logged
 * with the same recipient, subject and send time is skipped. Delete the key after.
 * Resend only keeps mail for a limited time depending on the plan, so this recovers
 * what is still there, not necessarily everything ever sent.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Resend } from "resend";

const key = process.env.RESEND_FULL_ACCESS_KEY;
if (!key) {
  console.error("Set RESEND_FULL_ACCESS_KEY to a full-access Resend key.");
  process.exit(1);
}
const dryRun = process.argv.includes("--dry-run");
const resend = new Resend(key);
const db = new PrismaClient();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Row = { id: string; to: string[] | string; subject: string; created_at: string; last_event?: string };

async function main() {
  let after: string | undefined;
  let seen = 0, added = 0, skipped = 0;
  for (;;) {
    const res = (await resend.emails.list({ limit: 100, ...(after ? { after } : {}) })) as unknown as {
      data?: { data: Row[]; has_more: boolean };
      error?: { message: string };
    };
    if (res.error) throw new Error(res.error.message);
    const rows = res.data?.data ?? [];
    for (const row of rows) {
      seen++;
      const to = Array.isArray(row.to) ? row.to.join(", ") : row.to;
      const createdAt = new Date(row.created_at);
      const exists = await db.emailLog.findFirst({ where: { to, subject: row.subject, createdAt } });
      if (exists) { skipped++; continue; }
      if (dryRun) { added++; continue; }
      await sleep(550); // Resend allows ~2 requests/second
      const full = (await resend.emails.get(row.id)) as unknown as { data?: { html?: string | null; text?: string | null } };
      await db.emailLog.create({
        data: {
          createdAt,
          kind: "imported",
          to,
          subject: row.subject,
          html: full.data?.html ?? `<pre>${(full.data?.text ?? "(content no longer available)").replace(/</g, "&lt;")}</pre>`,
          status: row.last_event && /bounce|complain|fail/i.test(row.last_event) ? "failed" : "sent",
          error: null,
        },
      });
      added++;
    }
    if (!res.data?.has_more || rows.length === 0) break;
    after = rows[rows.length - 1].id;
    await sleep(550);
  }
  console.log(`${dryRun ? "[dry run] " : ""}seen ${seen}, ${dryRun ? "would add" : "added"} ${added}, already logged ${skipped}`);
}

main().finally(() => db.$disconnect());
