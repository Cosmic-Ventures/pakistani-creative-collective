import { NextResponse } from "next/server";
import { runDueScheduledEmails } from "@/lib/scheduled-emails";

// Lives under /api/webhooks so the pre-launch gate in proxy.ts (which would
// redirect a cookie-less machine caller to the password page) doesn't apply.
// Called every few minutes by .github/workflows/scheduled-emails.yml.
export const dynamic = "force-dynamic";

async function handle(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 503 });
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sent = await runDueScheduledEmails();
  return NextResponse.json({ ok: true, sent });
}

export const GET = handle;
export const POST = handle;
