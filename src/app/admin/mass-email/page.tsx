import type { Metadata } from "next";
import { isResendConfigured } from "@/lib/email";
import { getSegmentRecipients } from "@/lib/mass-email-actions";
import { DEFAULT_SEGMENT_ID, MASS_EMAIL_SEGMENTS } from "@/lib/mass-email-constants";
import { db } from "@/lib/db";
import { isMissingSchemaError } from "@/lib/db-availability";
import Link from "next/link";
import MassEmailComposer from "@/components/admin/MassEmailComposer";

export const metadata: Metadata = { title: "Mass Email · Admin" };
export const dynamic = "force-dynamic";

export default async function MassEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ segment?: string }>;
}) {
  const { segment: rawSegment } = await searchParams;
  const segment = MASS_EMAIL_SEGMENTS.some((s) => s.id === rawSegment) ? rawSegment! : DEFAULT_SEGMENT_ID;
  const recipients = await getSegmentRecipients(segment);

  // Previous mass emails, newest first: one row per send, not per recipient.
  let history: { batchId: string; subject: string; sentAt: Date; count: number }[] = [];
  try {
    const batches = await db.emailLog.groupBy({
      by: ["batchId"],
      where: { kind: "mass-email", batchId: { not: null } },
      _count: { _all: true },
      _min: { createdAt: true },
      orderBy: { _min: { createdAt: "desc" } },
      take: 20,
    });
    history = await Promise.all(
      batches.map(async (b) => {
        const first = await db.emailLog.findFirst({
          where: { batchId: b.batchId },
          select: { subject: true },
        });
        return {
          batchId: b.batchId!,
          subject: first?.subject ?? "",
          sentAt: b._min.createdAt!,
          count: b._count._all,
        };
      })
    );
  } catch (error) {
    if (!isMissingSchemaError(error)) throw error;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-white">Mass Email</h2>
        <p className="text-sm text-stone-400 mt-1 max-w-2xl">
          Compose a one-off email and send it to a chosen group — pick a starting segment below, then
          check or uncheck individual people. Every recipient gets their own copy; nobody sees who
          else it went to.
        </p>
      </div>

      {!isResendConfigured && (
        <p className="text-xs text-amber-400 bg-amber-950/30 border border-amber-800/60 rounded-lg px-4 py-2.5 mb-5">
          Email sending isn&apos;t switched on yet (no Resend API key), so nothing will actually go out.
          You can still build and preview the email below.
        </p>
      )}

      {/* Keyed on the segment so switching segments remounts fresh state
          (selection, filter) instead of carrying over the previous
          segment's checkbox choices onto a differently-sized list. */}
      <MassEmailComposer
        key={segment}
        segments={MASS_EMAIL_SEGMENTS}
        activeSegment={segment}
        recipients={recipients}
      />

      <div className="mt-12">
        <h3 className="text-base font-semibold text-white mb-1">Previous mass emails</h3>
        <p className="text-xs text-stone-500 mb-3">
          Mass emails sent since sent-email tracking was switched on. Earlier sends weren&apos;t recorded.
        </p>
        {history.length === 0 ? (
          <p className="text-sm text-stone-600">None yet.</p>
        ) : (
          <ul className="bg-stone-900 border border-stone-800 rounded-xl divide-y divide-stone-800/60">
            {history.map((h) => (
              <li key={h.batchId} className="px-4 py-3 flex items-center justify-between gap-4 text-sm">
                <Link href={`/admin/sent-emails?batch=${h.batchId}`} className="text-emerald-500 hover:text-emerald-400">
                  {h.subject}
                </Link>
                <span className="text-xs text-stone-500 whitespace-nowrap">
                  {h.count} recipient{h.count === 1 ? "" : "s"} ·{" "}
                  {h.sentAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
