import type { Metadata } from "next";
import { db } from "@/lib/db";
import { forwardContactRequest, updateContactRequestStatus } from "@/lib/admin-actions";
import { FilterTabs } from "@/components/admin/FilterTabs";

export const metadata: Metadata = { title: "Contact Requests · Admin" };
export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "text-amber-400 bg-amber-950/40 border-amber-700/40",
  FORWARDED: "text-blue-400 bg-blue-950/40 border-blue-700/40",
  ACCEPTED: "text-emerald-400 bg-emerald-950/40 border-emerald-700/40",
  DECLINED: "text-red-400 bg-red-950/40 border-red-700/40",
  UNAVAILABLE: "text-stone-400 bg-stone-800 border-stone-700",
};

const STATUSES = ["ALL", "PENDING", "FORWARDED", "ACCEPTED", "DECLINED", "UNAVAILABLE"] as const;

export default async function ContactRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const activeStatus = STATUSES.includes(status as (typeof STATUSES)[number]) ? status! : "ALL";

  const [requests, statusCounts] = await Promise.all([
    db.contactRequest.findMany({
      where: activeStatus === "ALL" ? undefined : { status: activeStatus as never },
      orderBy: { createdAt: "desc" },
      include: {
        creative: { select: { firstName: true, lastName: true, slug: true } },
        user: { select: { name: true, email: true } },
      },
    }),
    db.contactRequest.groupBy({ by: ["status"], _count: true }),
  ]);

  const countByStatus = Object.fromEntries(statusCounts.map((s) => [s.status, s._count]));
  const totalCount = statusCounts.reduce((sum, s) => sum + s._count, 0);

  return (
    <div>
      <h2 className="text-lg font-semibold text-white mb-6">Contact Requests</h2>

      <div className="mb-6">
        <FilterTabs
          variant="emerald"
          tabs={STATUSES.map((s) => ({
            label: s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase(),
            href: s === "ALL" ? "/admin/contact-requests" : `/admin/contact-requests?status=${s}`,
            active: activeStatus === s,
            count: s === "ALL" ? totalCount : (countByStatus[s] ?? 0),
          }))}
        />
      </div>

      {requests.length === 0 && <p className="text-stone-500 text-sm">No contact requests match this filter.</p>}

      <div className="space-y-4">
        {requests.map((r) => (
          <div key={r.id} className="bg-stone-900 border border-stone-800 rounded-xl p-5">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="font-semibold text-white">
                  Request for {r.creative.firstName} {r.creative.lastName}
                </h3>
                <p className="text-sm text-stone-400">
                  From: {r.requesterName} ({r.requesterEmail}){r.company && ` · ${r.company}`}
                </p>
                <p className="text-xs text-stone-600">{new Date(r.createdAt).toLocaleDateString()}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[r.status]}`}>
                {r.status}
              </span>
            </div>

            <div className="text-sm text-stone-400 space-y-2 mb-4">
              <div><span className="text-stone-600">Request type: </span>{r.requestType === "Other" ? `Other — ${r.requestTypeOther}` : r.requestType}</div>
              <div><span className="text-stone-600">Experience level: </span>{r.experienceLevel}</div>
              <div><span className="text-stone-600">Timeline: </span>{r.timeline}</div>
              {r.requesterRole && <div><span className="text-stone-600">Role/Title: </span>{r.requesterRole}</div>}
              {r.portfolioLink && <div><span className="text-stone-600">Portfolio: </span><a href={r.portfolioLink} target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:text-emerald-400">{r.portfolioLink} ↗</a></div>}
              <div><span className="text-stone-600">Message: </span>{r.message}</div>
            </div>

            {r.adminNotes && (
              <p className="text-xs text-stone-500 mb-3">Notes: {r.adminNotes}</p>
            )}

            <div className="flex gap-2 flex-wrap">
              {r.status !== "FORWARDED" && (
                <form action={async () => { "use server"; await forwardContactRequest(r.id); }}>
                  <button className="text-sm bg-blue-700 hover:bg-blue-600 text-white px-4 py-1.5 rounded-lg transition-colors">
                    Forward to Creative
                  </button>
                </form>
              )}
              {r.status !== "ACCEPTED" && (
                <form action={async () => { "use server"; await updateContactRequestStatus(r.id, "ACCEPTED"); }}>
                  <button className="text-sm bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-1.5 rounded-lg transition-colors">
                    Mark Accepted
                  </button>
                </form>
              )}
              {r.status !== "DECLINED" && (
                <form action={async () => { "use server"; await updateContactRequestStatus(r.id, "DECLINED"); }}>
                  <button className="text-sm bg-stone-800 hover:bg-red-900/60 border border-stone-700 text-stone-300 px-4 py-1.5 rounded-lg transition-colors">
                    Mark Declined
                  </button>
                </form>
              )}
              {r.status !== "UNAVAILABLE" && (
                <form action={async () => { "use server"; await updateContactRequestStatus(r.id, "UNAVAILABLE"); }}>
                  <button className="text-sm text-stone-500 hover:text-stone-300 transition-colors px-2">
                    Unavailable
                  </button>
                </form>
              )}
              {r.status !== "PENDING" && (
                <form action={async () => { "use server"; await updateContactRequestStatus(r.id, "PENDING"); }}>
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
