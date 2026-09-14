import type { Metadata } from "next";
import { isResendConfigured } from "@/lib/email";
import { getSegmentRecipients } from "@/lib/mass-email-actions";
import { DEFAULT_SEGMENT_ID, MASS_EMAIL_SEGMENTS } from "@/lib/mass-email-constants";
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
    </div>
  );
}
