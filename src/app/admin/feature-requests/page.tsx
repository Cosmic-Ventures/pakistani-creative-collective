import type { Metadata } from "next";
import { db } from "@/lib/db";
import { approveFeatureRequest, rejectFeatureRequest } from "@/lib/admin-actions";
import { FilterTabs } from "@/components/admin/FilterTabs";

export const metadata: Metadata = { title: "Feature Requests · Admin" };
export const dynamic = "force-dynamic";

const STATUSES = ["ALL", "PENDING", "APPROVED", "REJECTED"] as const;

export default async function FeatureRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const activeStatus = STATUSES.includes(status as (typeof STATUSES)[number]) ? status! : "ALL";

  const [requests, statusCounts] = await Promise.all([
    db.featureRequest.findMany({
      where: activeStatus === "ALL" ? {} : { status: activeStatus as "PENDING" | "APPROVED" | "REJECTED" },
      orderBy: { createdAt: "desc" },
      include: { creative: { select: { firstName: true, lastName: true, slug: true, featured: true, featuredUntil: true } } },
    }),
    db.featureRequest.groupBy({ by: ["status"], _count: true }),
  ]);

  const countByStatus = Object.fromEntries(statusCounts.map((s) => [s.status, s._count]));
  const totalCount = statusCounts.reduce((sum, s) => sum + s._count, 0);

  // End of next month as default featured period
  const defaultUntil = new Date();
  defaultUntil.setMonth(defaultUntil.getMonth() + 1);
  defaultUntil.setDate(1);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h2 className="text-lg font-semibold text-white">Feature Requests</h2>
        <FilterTabs
          tabs={STATUSES.map((s) => ({
            label: s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase(),
            href: s === "ALL" ? "/admin/feature-requests" : `/admin/feature-requests?status=${s}`,
            active: activeStatus === s,
            count: s === "ALL" ? totalCount : (countByStatus[s] ?? 0),
          }))}
        />
      </div>

      {requests.length === 0 && <p className="text-stone-500 text-sm">No feature requests match this filter.</p>}

      <div className="space-y-4">
        {requests.map((r) => (
          <div key={r.id} className="bg-stone-900 border border-stone-800 rounded-xl p-5">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <h3 className="font-semibold text-white">
                  {r.creative.firstName} {r.creative.lastName}
                </h3>
                <p className="text-xs text-stone-600">{new Date(r.createdAt).toLocaleDateString()}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${
                r.status === "PENDING" ? "text-amber-400 bg-amber-950/40 border-amber-700/40" :
                r.status === "APPROVED" ? "text-emerald-400 bg-emerald-950/40 border-emerald-700/40" :
                "text-red-400 bg-red-950/40 border-red-700/40"
              }`}>
                {r.status}
              </span>
            </div>

            <p className="text-sm text-stone-400 mb-4 leading-relaxed">{r.reason}</p>

            {r.status === "PENDING" && (
              <div className="flex gap-2">
                <form action={async () => { "use server"; await approveFeatureRequest(r.id, defaultUntil); }}>
                  <button className="text-sm bg-amber-700 hover:bg-amber-600 text-white px-4 py-1.5 rounded-lg transition-colors">
                    Feature for This Month
                  </button>
                </form>
                <form action={async () => { "use server"; await rejectFeatureRequest(r.id); }}>
                  <button className="text-sm bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 px-4 py-1.5 rounded-lg transition-colors">
                    Decline
                  </button>
                </form>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
