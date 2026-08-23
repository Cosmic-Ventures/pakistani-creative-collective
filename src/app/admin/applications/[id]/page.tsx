import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import {
  approveCreative,
  rejectCreative,
  setCreativeStatus,
  updateAdminNotes,
} from "@/lib/admin-actions";
import { AdminHeadshotRecrop } from "@/components/AdminHeadshotRecrop";

export const metadata: Metadata = { title: "Application Detail · Admin" };
export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "text-amber-400 bg-amber-950/40 border-amber-700/40",
  APPROVED: "text-emerald-400 bg-emerald-950/40 border-emerald-700/40",
  REJECTED: "text-red-400 bg-red-950/40 border-red-700/40",
  INACTIVE: "text-stone-400 bg-stone-800 border-stone-700",
  FLAGGED: "text-orange-400 bg-orange-950/40 border-orange-700/40",
};

/**
 * Every field on the Creative record, laid out so nothing an applicant typed
 * can be invisible to the admin reviewing it — the client's stated fear was
 * approving someone and then not being able to find what they'd submitted
 * anywhere ("is there somewhere I can manually see all the data").
 */
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  const empty = value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
  return (
    <div className="grid grid-cols-[180px_1fr] gap-3 py-2 border-b border-stone-800/60 last:border-0">
      <dt className="text-xs text-stone-500 pt-0.5">{label}</dt>
      <dd className={`text-sm ${empty ? "text-stone-600 italic" : "text-stone-200"} whitespace-pre-wrap break-words`}>
        {empty ? "— not provided —" : value}
      </dd>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-stone-900 border border-stone-800 rounded-xl p-5">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-2">{title}</h3>
      <dl>{children}</dl>
    </div>
  );
}

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Group title="Identity & Contact">
          <Row label="First name" value={c.firstName} />
          <Row label="Last name" value={c.lastName} />
          <Row label="Pronouns" value={c.pronouns} />
          <Row label="Email" value={c.email} />
          <Row label="Phone" value={c.phone} />
          <Row label="Address (private)" value={c.address} />
          <Row label="Public location" value={c.location} />
          <Row label="How they heard about PCC" value={c.howHeard} />
          <Row label="Referred by" value={c.referralName} />
          <Row label="Submitted" value={new Date(c.createdAt).toLocaleString()} />
          <Row label="Last updated" value={new Date(c.updatedAt).toLocaleString()} />
        </Group>

        <Group title="Headshot">
          <div className="flex items-start gap-4 py-2">
            {c.headshot ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.headshot} alt="" className="w-24 h-24 rounded-xl object-cover border border-stone-800" />
            ) : (
              <div className="w-24 h-24 rounded-xl bg-stone-800 flex items-center justify-center text-xs text-stone-600">
                None
              </div>
            )}
            <AdminHeadshotRecrop creativeId={c.id} headshot={c.headshot} />
          </div>
        </Group>

        <Group title="Bio & Background">
          <Row label="Bio" value={c.bio} />
          <Row label="What they want from PCC" value={c.pccGoals} />
          <Row label="Previous collaborators" value={c.previousCollaborators} />
          <Row label="Union / guild memberships" value={c.unionMemberships} />
          <Row label="Education / training" value={c.education} />
          <Row label="Additional notes" value={c.additionalNotes} />
        </Group>

        <Group title="Roles, Mediums & Skills">
          <Row label="Roles" value={c.roles.join(", ")} />
          <Row label="Mediums" value={c.mediums.join(", ")} />
          <Row label="Languages" value={c.languages.join(", ")} />
          <Row label="Special skills / certifications" value={c.specialSkills} />
          <Row label="Equipment" value={c.equipment} />
        </Group>

        <Group title="Experience & Portfolio">
          <Row label="Experience level" value={c.experienceLevel} />
          <Row label="Years of experience" value={c.yearsExperience} />
          <Row label="Completed projects" value={c.completedProjects} />
          <Row label="Notable achievements" value={c.notableAchievements} />
          <Row label="References" value={c.references} />
          <Row label="Website" value={c.website} />
          <Row label="IMDb" value={c.imdb} />
          <Row label="Instagram" value={c.instagram} />
          <Row label="LinkedIn" value={c.linkedin} />
          <Row label="Vimeo / YouTube" value={c.vimeo} />
        </Group>

        <Group title="Work for Hire">
          <Row label="Rate structure" value={c.rateStructure} />
          <Row label="Rate range" value={c.rateRange} />
          <Row label="Rate visible to paid members" value={c.ratePublic ? "Yes" : "No"} />
          <Row label="Availability" value={c.availability} />
          <Row label="Travel" value={c.travel} />
          <Row label="Preferred project types" value={c.preferredProjectTypes.join(", ")} />
          <Row label="Collaboration preferences" value={c.collaborationPreferences} />
        </Group>

        <div className="lg:col-span-2">
          <Group title={`Work Samples (${workSamples.length})`}>
            {workSamples.length === 0 ? (
              <p className="text-sm text-stone-600 italic">— none submitted —</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {workSamples.map((ws, i) => (
                  <div key={i} className="bg-stone-950 border border-stone-800 rounded-lg p-3 text-sm">
                    <p className="font-semibold text-stone-200">{ws.title || "Untitled"}</p>
                    <p className="text-xs text-stone-500 mt-1">{[ws.medium, ws.year].filter(Boolean).join(" · ")}</p>
                    {ws.role && <p className="text-xs text-stone-500 mt-1">Role: {ws.role}</p>}
                    {ws.link && (
                      <a href={ws.link} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-500 hover:text-emerald-400 mt-1 block break-all">
                        {ws.link} ↗
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Group>
        </div>

        <div className="lg:col-span-2">
          <Group title="Consents">
            <Row label="Promotional use consent" value={c.promoConsent ? "Yes — opted in to public-launch promo" : "No"} />
          </Group>
        </div>

        <div className="lg:col-span-2">
          <Group title="Admin">
            <Row label="Featured" value={c.featured ? `Yes${c.featuredUntil ? ` (until ${new Date(c.featuredUntil).toLocaleDateString()})` : ""}` : "No"} />
            <Row label="Comment suspended" value={c.commentSuspended ? "Yes" : "No"} />
            <Row label="Comment flagged" value={c.commentFlagged ? "Yes" : "No"} />
          </Group>
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
                className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 text-sm text-stone-200 focus:outline-none focus:border-stone-600"
              />
              <button className="text-xs bg-stone-800 hover:bg-stone-700 text-stone-300 px-3 py-1.5 rounded-lg transition-colors">
                Save notes
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
