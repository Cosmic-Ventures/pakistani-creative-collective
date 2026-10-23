import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { isMissingSchemaError } from "@/lib/db-availability";
import { dateToEastern, formatEastern } from "@/lib/eastern-time";
import { MASS_EMAIL_SEGMENTS } from "@/lib/mass-email-constants";
import { TRIAL_ENDS_AT, TRIAL_STARTS_AT } from "@/lib/trial-access";
import { cancelScheduledEmail, deleteScheduledEmail } from "@/lib/scheduled-email-actions";
import ScheduledEmailForm from "@/components/admin/ScheduledEmailForm";

export const metadata: Metadata = { title: "Scheduled Emails · Admin" };
export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  draft: "text-stone-400 bg-stone-800 border-stone-700",
  scheduled: "text-emerald-400 bg-emerald-950/40 border-emerald-700/40",
  sending: "text-amber-400 bg-amber-950/40 border-amber-700/40",
  sent: "text-sky-400 bg-sky-950/40 border-sky-700/40",
  cancelled: "text-stone-500 bg-stone-900 border-stone-800",
};

export default async function ScheduledEmailsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; new?: string }>;
}) {
  const { edit, new: isNew } = await searchParams;

  let emails;
  try {
    emails = await db.scheduledEmail.findMany({ orderBy: { sendAt: "asc" } });
  } catch (error) {
    if (!isMissingSchemaError(error)) throw error;
    return (
      <p className="text-sm text-amber-400 bg-amber-950/30 border border-amber-800/60 rounded-lg px-4 py-3">
        Scheduled emails need a one-time database update (migration 20261022200000_scheduled_email) that hasn&apos;t been applied yet.
      </p>
    );
  }

  const editing = edit ? emails.find((e) => e.id === edit) : undefined;
  const showForm = Boolean(editing) || isNew === "1";
  const initial = editing
    ? {
        id: editing.id, name: editing.name, segmentId: editing.segmentId, subject: editing.subject,
        preheader: editing.preheader, body: editing.body, sendAtEastern: dateToEastern(editing.sendAt),
      }
    : {
        name: "", segmentId: "creative-approved", subject: "", preheader: "", body: "",
        sendAtEastern: dateToEastern(TRIAL_STARTS_AT),
      };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h2 className="text-lg font-semibold text-white">Scheduled Emails</h2>
        <Link href="/admin/scheduled-emails?new=1" className="text-sm bg-stone-700 hover:bg-stone-600 text-white px-4 py-1.5 rounded-lg">
          New scheduled email
        </Link>
      </div>
      <p className="text-xs text-stone-500 mb-2 max-w-2xl">
        Write an email now, pick when it goes out, and it sends itself (within about 5 minutes of that time).
        Change or cancel it any time before then. Sent mail appears under Sent Emails.
      </p>
      <p className="text-xs text-amber-400 bg-amber-950/30 border border-amber-800/60 rounded-lg px-4 py-2.5 mb-6 max-w-2xl">
        Founding-member premium access turns on <strong>{formatEastern(TRIAL_STARTS_AT)}</strong> and ends{" "}
        <strong>{formatEastern(TRIAL_ENDS_AT)}</strong>. Schedule the announcement for the start time so members hear about it the moment it begins. Moving the start time itself is a code change.
      </p>

      {showForm && (
        <div className="mb-10">
          <h3 className="text-sm font-semibold text-white mb-3">{editing ? `Editing: ${editing.name}` : "New scheduled email"}</h3>
          <ScheduledEmailForm key={editing?.id ?? "new"} initial={initial} segments={MASS_EMAIL_SEGMENTS} />
        </div>
      )}

      <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-800 text-left text-xs text-stone-500 uppercase tracking-wide">
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Goes to</th>
              <th className="px-4 py-3 font-medium">Sends</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {emails.map((e) => {
              const editable = ["draft", "scheduled", "cancelled"].includes(e.status);
              return (
                <tr key={e.id} className="border-b border-stone-800/60 last:border-0">
                  <td className="px-4 py-3">
                    <p className="text-stone-200">{e.name}</p>
                    <p className="text-xs text-stone-500">{e.subject}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-stone-400">
                    {MASS_EMAIL_SEGMENTS.find((s) => s.id === e.segmentId)?.label ?? e.segmentId}
                  </td>
                  <td className="px-4 py-3 text-xs text-stone-400 whitespace-nowrap">
                    {e.status === "sent" && e.sentAt
                      ? `Sent ${formatEastern(e.sentAt)} to ${e.sentCount} of ${e.recipientCount}`
                      : formatEastern(e.sendAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLE[e.status] ?? STATUS_STYLE.draft}`}>{e.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs flex gap-3 items-center">
                    {editable && (
                      <Link href={`/admin/scheduled-emails?edit=${e.id}`} className="text-emerald-500 hover:text-emerald-400">Edit</Link>
                    )}
                    {e.status === "scheduled" && (
                      <form action={cancelScheduledEmail}>
                        <input type="hidden" name="id" value={e.id} />
                        <button className="text-amber-400 hover:text-amber-300">Cancel</button>
                      </form>
                    )}
                    {(e.status === "draft" || e.status === "cancelled") && (
                      <form action={deleteScheduledEmail}>
                        <input type="hidden" name="id" value={e.id} />
                        <button className="text-red-400 hover:text-red-300">Delete</button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
            {emails.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-stone-600">Nothing scheduled.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
