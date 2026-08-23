import type { Metadata } from "next";
import { db } from "@/lib/db";
import { approveCreative, rejectCreative, setCreativeStatus, flagCreativeForReview, updateCreativeFields } from "@/lib/admin-actions";

export const metadata: Metadata = { title: "Applications · Admin" };
export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "text-amber-400 bg-amber-950/40 border-amber-700/40",
  APPROVED: "text-emerald-400 bg-emerald-950/40 border-emerald-700/40",
  REJECTED: "text-red-400 bg-red-950/40 border-red-700/40",
  INACTIVE: "text-stone-400 bg-stone-800 border-stone-700",
  FLAGGED: "text-orange-400 bg-orange-950/40 border-orange-700/40",
};

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status = "PENDING" } = await searchParams;

  const creatives = await db.creative.findMany({
    where: status === "ALL" ? {} : { status: status as "PENDING" | "APPROVED" | "REJECTED" | "INACTIVE" | "FLAGGED" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-2 gap-3 flex-wrap">
        <h2 className="text-lg font-semibold text-white">Applications</h2>
        <div className="flex gap-2 text-sm">
          {["PENDING", "APPROVED", "REJECTED", "FLAGGED", "INACTIVE", "ALL"].map((s) => (
            <a
              key={s}
              href={`/admin/applications?status=${s}`}
              className={`px-3 py-1 rounded-full border transition-colors ${
                status === s
                  ? "bg-stone-700 border-stone-600 text-white"
                  : "border-stone-800 text-stone-500 hover:text-stone-300"
              }`}
            >
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </a>
          ))}
        </div>
      </div>
      <div className="mb-6">
        <a
          href={`/api/admin/applications-export?status=${status}`}
          className="text-xs text-emerald-500 hover:text-emerald-400 underline underline-offset-2 transition-colors"
        >
          Export {status === "ALL" ? "all" : status.toLowerCase()} applications as CSV ↓
        </a>
        <span className="text-xs text-stone-600 ml-2">
          — a full backup of every field on record, outside of this review UI.
        </span>
      </div>

      {creatives.length === 0 && (
        <p className="text-stone-500 text-sm">No applications with this status.</p>
      )}

      <div className="space-y-4">
        {creatives.map((c) => (
          <div key={c.id} className="bg-stone-900 border border-stone-800 rounded-xl p-5">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="font-semibold text-white">
                  {c.firstName} {c.lastName}
                  {c.pronouns && <span className="text-stone-500 font-normal text-sm ml-2">({c.pronouns})</span>}
                </h3>
                <p className="text-sm text-stone-400">{c.email}</p>
                <p className="text-xs text-stone-600 mt-0.5">
                  Submitted {new Date(c.createdAt).toLocaleDateString()}
                  {c.referralName && ` · Referred by ${c.referralName}`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[c.status]}`}>
                  {c.status}
                </span>
                <a
                  href={`/admin/applications/${c.id}`}
                  className="text-xs text-stone-500 hover:text-stone-300 underline underline-offset-2 transition-colors"
                >
                  View full details →
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-stone-500 mb-4">
              {c.experienceLevel && <div><span className="text-stone-600">Level:</span> {c.experienceLevel}</div>}
              {c.roles.length > 0 && <div><span className="text-stone-600">Roles:</span> {c.roles.slice(0, 2).join(", ")}{c.roles.length > 2 ? ` +${c.roles.length - 2}` : ""}</div>}
              {c.website && <div><a href={c.website} target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:text-emerald-400">Portfolio ↗</a></div>}
              {c.imdb && <div><a href={c.imdb.startsWith("http") ? c.imdb : `https://imdb.com/name/${c.imdb}`} target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:text-emerald-400">IMDb ↗</a></div>}
            </div>

            <details className="mb-4">
              <summary className="text-xs text-stone-500 cursor-pointer hover:text-stone-400">View bio</summary>
              <p className="text-sm text-stone-400 mt-2 leading-relaxed">{c.bio}</p>
            </details>

            {c.adminNotes && (
              <p className="text-xs text-amber-400/80 bg-amber-950/30 border border-amber-700/30 rounded px-3 py-2 mb-3">
                Notes: {c.adminNotes}
              </p>
            )}

            <details className="mb-4">
              <summary className="text-xs text-stone-500 cursor-pointer hover:text-stone-400">
                Edit before approving
              </summary>
              <form
                action={async (formData: FormData) => {
                  "use server";
                  await updateCreativeFields(c.id, {
                    firstName: formData.get("firstName") as string,
                    lastName: formData.get("lastName") as string,
                    bio: formData.get("bio") as string,
                    notableAchievements: (formData.get("notableAchievements") as string) || null,
                    pccGoals: (formData.get("pccGoals") as string) || null,
                  });
                }}
                className="mt-3 space-y-2"
              >
                <div className="grid grid-cols-2 gap-2">
                  <input name="firstName" defaultValue={c.firstName} className="bg-stone-950 border border-stone-800 rounded-lg px-3 py-1.5 text-sm text-stone-200 focus:outline-none focus:border-stone-600" />
                  <input name="lastName" defaultValue={c.lastName} className="bg-stone-950 border border-stone-800 rounded-lg px-3 py-1.5 text-sm text-stone-200 focus:outline-none focus:border-stone-600" />
                </div>
                <textarea name="bio" defaultValue={c.bio} rows={4} className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-1.5 text-sm text-stone-200 focus:outline-none focus:border-stone-600" />
                <textarea name="notableAchievements" defaultValue={c.notableAchievements ?? ""} rows={2} placeholder="Notable achievements" className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-1.5 text-sm text-stone-200 focus:outline-none focus:border-stone-600" />
                <textarea name="pccGoals" defaultValue={c.pccGoals ?? ""} rows={2} placeholder="What they're looking for from the PCC" className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-1.5 text-sm text-stone-200 focus:outline-none focus:border-stone-600" />
                <button className="text-xs bg-stone-800 hover:bg-stone-700 text-stone-300 px-3 py-1.5 rounded-lg transition-colors">
                  Save edits
                </button>
              </form>
            </details>

            {c.status === "PENDING" && (
              <details className="mb-4">
                <summary className="text-xs text-stone-500 cursor-pointer hover:text-stone-400">
                  Flag for review (request changes)
                </summary>
                <form
                  action={async (formData: FormData) => {
                    "use server";
                    const note = formData.get("note") as string;
                    if (note?.trim()) await flagCreativeForReview(c.id, note.trim());
                  }}
                  className="mt-3 flex gap-2"
                >
                  <input
                    name="note"
                    required
                    placeholder="What needs to change before this can be approved?"
                    className="flex-1 bg-stone-950 border border-stone-800 rounded-lg px-3 py-1.5 text-sm text-stone-200 placeholder-stone-600 focus:outline-none focus:border-stone-600"
                  />
                  <button className="text-xs bg-orange-800/60 hover:bg-orange-700/60 border border-orange-700/40 text-orange-200 px-3 py-1.5 rounded-lg transition-colors shrink-0">
                    Flag &amp; email applicant
                  </button>
                </form>
              </details>
            )}

            <div className="flex gap-2 flex-wrap">
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
                  <button className="text-sm text-stone-500 hover:text-stone-300 transition-colors px-2">
                    Set Inactive
                  </button>
                </form>
              )}
              {c.status !== "PENDING" && (
                <form action={async () => { "use server"; await setCreativeStatus(c.id, "PENDING"); }}>
                  <button className="text-sm text-stone-500 hover:text-stone-300 transition-colors px-2">
                    Reset to Pending
                  </button>
                </form>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
