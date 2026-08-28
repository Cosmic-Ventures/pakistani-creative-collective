import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { approveCreative, rejectCreative, setCreativeStatus, updateAdminNotes } from "@/lib/admin-actions";
import { AdminHeadshotRecrop } from "@/components/AdminHeadshotRecrop";
import { AdminProfileEditForm } from "@/components/AdminProfileEditForm";

export const metadata: Metadata = { title: "Application Detail · Admin" };
export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "text-amber-400 bg-amber-950/40 border-amber-700/40",
  APPROVED: "text-emerald-400 bg-emerald-950/40 border-emerald-700/40",
  REJECTED: "text-red-400 bg-red-950/40 border-red-700/40",
  INACTIVE: "text-stone-400 bg-stone-800 border-stone-700",
  FLAGGED: "text-orange-400 bg-orange-950/40 border-orange-700/40",
};

const fieldClass =
  "w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-1.5 text-sm text-stone-200 focus:outline-none focus:border-stone-600";

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const c = await db.creative.findUnique({ where: { id } });
  if (!c) notFound();

  const workSamples = Array.isArray(c.workSamples)
    ? (c.workSamples as Array<{ title?: string; medium?: string; year?: string; role?: string; link?: string }>)
    : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <Link href="/admin/applications" className="text-xs text-stone-500 hover:text-stone-300 transition-colors">
            ← Back to Applications
          </Link>
          <h2 className="text-lg font-semibold text-white mt-1">
            {c.firstName} {c.lastName}
            {c.pronouns && <span className="text-stone-500 font-normal text-sm ml-2">({c.pronouns})</span>}
          </h2>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[c.status]}`}>{c.status}</span>
      </div>

      <div className="flex gap-2 flex-wrap mb-8">
        {c.status !== "APPROVED" && (
          <form action={async () => { "use server"; await approveCreative(c.id); }}>
            <button className="text-sm bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-1.5 rounded-lg transition-colors">
              Approve
            </button>
          </form>
        )}
        {c.status !== "REJECTED" && (
          <form action={async () => { "use server"; await rejectCreative(c.id); }}>
            <button className="text-sm bg-stone-800 hover:bg-red-900/60 border border-stone-700 hover:border-red-700 text-stone-300 px-4 py-1.5 rounded-lg transition-colors">
              Reject
            </button>
          </form>
        )}
        {c.status === "APPROVED" && (
          <form action={async () => { "use server"; await setCreativeStatus(c.id, "INACTIVE"); }}>
            <button className="text-sm text-stone-500 hover:text-stone-300 transition-colors px-3 py-1.5">
              Set Inactive
            </button>
          </form>
        )}
        {c.status !== "PENDING" && (
          <form action={async () => { "use server"; await setCreativeStatus(c.id, "PENDING"); }}>
            <button className="text-sm text-stone-500 hover:text-stone-300 transition-colors px-3 py-1.5">
              Reset to Pending
            </button>
          </form>
        )}
        {c.status === "APPROVED" && (
          <Link
            href={`/directory/${c.slug}`}
            target="_blank"
            className="text-sm text-stone-500 hover:text-stone-300 transition-colors px-3 py-1.5"
          >
            View public profile ↗
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-3">Headshot</h3>
          <div className="flex items-start gap-4">
            {c.headshot ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.headshot} alt="" className="w-24 h-24 rounded-xl object-cover border border-stone-800" />
            ) : (
              <div className="w-24 h-24 rounded-xl bg-stone-800 flex items-center justify-center text-xs text-stone-600">
                None
              </div>
            )}
            {/* Its own action, independent of the Save Profile button below. */}
            <AdminHeadshotRecrop creativeId={c.id} headshot={c.headshot} />
          </div>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-xl p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-3">Record Info</h3>
          <dl>
            <div className="grid grid-cols-[120px_1fr] gap-3 py-1.5 text-sm">
              <dt className="text-stone-500">Submitted</dt>
              <dd className="text-stone-300">{new Date(c.createdAt).toLocaleString()}</dd>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-3 py-1.5 text-sm">
              <dt className="text-stone-500">Last updated</dt>
              <dd className="text-stone-300">{new Date(c.updatedAt).toLocaleString()}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/*
       * Every field on the Creative record is editable here, not just displayed —
       * client feedback (08/28 round): "can I also have access to edit and revise
       * all parts of each profile... edit the links in my profile and all parts
       * of others if needed." A confirm step (and a callout for the flags that
       * bypass their own review flows) guards against accidental saves — see
       * AdminProfileEditForm.
       */}
      <AdminProfileEditForm creative={c} workSamples={workSamples} />

      <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 mt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-2">Admin Notes</h3>
        <form
          action={async (formData: FormData) => {
            "use server";
            await updateAdminNotes(c.id, (formData.get("notes") as string) ?? "");
          }}
          className="space-y-2"
        >
          <textarea
            name="notes"
            defaultValue={c.adminNotes ?? ""}
            rows={3}
            placeholder="Internal notes — not visible to the applicant"
            className={fieldClass}
          />
          <button className="text-xs bg-stone-800 hover:bg-stone-700 text-stone-300 px-3 py-1.5 rounded-lg transition-colors">
            Save notes
          </button>
        </form>
      </div>
    </div>
  );
}
