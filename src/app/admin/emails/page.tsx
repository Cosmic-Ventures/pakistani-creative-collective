import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { EMAIL_TEMPLATES } from "@/lib/email-templates";
import { isResendConfigured } from "@/lib/email";
import { isMissingSchemaError, MIGRATION_PENDING_MESSAGE } from "@/lib/db-availability";

export const metadata: Metadata = { title: "Emails · Admin" };
export const dynamic = "force-dynamic";

export default async function AdminEmailsPage() {
  // Only the templates she's actually edited have a row; everything else is
  // still running on the wording that shipped. If the table isn't there yet,
  // that's every template — say so rather than failing the page.
  let edited: { key: string; updatedAt: Date; updatedBy: string | null }[] = [];
  let migrationPending = false;
  try {
    edited = await db.emailTemplate.findMany({
      select: { key: true, updatedAt: true, updatedBy: true },
    });
  } catch (error) {
    if (!isMissingSchemaError(error)) throw error;
    migrationPending = true;
  }
  const editedByKey = new Map(edited.map((e) => [e.key, e]));

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-white">Email Templates</h2>
        <p className="text-sm text-stone-400 mt-1 max-w-2xl">
          The wording of every automatic email the PCC sends to applicants and members. Edit any of
          them here — changes apply to emails sent from that moment on, and &ldquo;Restore
          original&rdquo; puts back the version that shipped.
        </p>
      </div>

      {migrationPending && (
        <p className="text-sm text-amber-300 bg-amber-950/30 border border-amber-700/60 rounded-lg px-4 py-3 mb-5">
          <strong>Saving is switched off for now.</strong> {MIGRATION_PENDING_MESSAGE} You can still
          read and preview every template below, and each one is sending its original wording as
          normal.
        </p>
      )}

      {!isResendConfigured && (
        <p className="text-xs text-amber-400 bg-amber-950/30 border border-amber-800/60 rounded-lg px-4 py-2.5 mb-5">
          Email sending isn&apos;t switched on yet (no Resend API key), so nothing is actually going
          out. You can still write and preview the templates — they&apos;ll be used as soon as
          sending is enabled.
        </p>
      )}

      <ul className="space-y-2">
        {EMAIL_TEMPLATES.map((t) => {
          const row = editedByKey.get(t.key);
          return (
            <li key={t.key}>
              <Link
                href={`/admin/emails/${t.key}`}
                className="block border border-stone-800 hover:border-stone-600 hover:bg-stone-900 rounded-xl px-4 py-3 transition-colors"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-stone-100 text-sm">{t.name}</span>
                  {row ? (
                    <span className="text-[10px] uppercase tracking-wide bg-emerald-900/40 border border-emerald-700/50 text-emerald-300 px-2 py-0.5 rounded">
                      Edited
                    </span>
                  ) : (
                    <span className="text-[10px] uppercase tracking-wide bg-stone-800 border border-stone-700 text-stone-400 px-2 py-0.5 rounded">
                      Original
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-400 mt-1">{t.description}</p>
                <p className="text-xs text-stone-600 mt-1">Subject: {t.subject}</p>
                {row && (
                  <p className="text-xs text-stone-600 mt-0.5">
                    Last edited {row.updatedAt.toLocaleDateString()}
                    {row.updatedBy ? ` by ${row.updatedBy}` : ""}
                  </p>
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      <p className="text-xs text-stone-600 mt-6 max-w-2xl">
        Not listed here: the notifications that come to the PCC inbox (a new application, a new
        contact request, a post awaiting review). Those are summaries for your own triage rather
        than copy anyone reads, so they stay fixed. The Community announcement email is written
        fresh each time on the{" "}
        <Link href="/admin/community" className="underline hover:text-stone-400">
          Community
        </Link>{" "}
        tab.
      </p>
    </div>
  );
}
