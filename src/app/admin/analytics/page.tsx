import type { Metadata } from "next";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Analytics · Admin" };
export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const [
    totalCreatives,
    pendingCreatives,
    approvedCreatives,
    totalUsers,
    paidUsers,
    earlyAccessUsers,
    totalContacts,
    acceptedContacts,
    declinedContacts,
    totalFeatureRequests,
    featuredNow,
  ] = await Promise.all([
    db.creative.count(),
    db.creative.count({ where: { status: "PENDING" } }),
    db.creative.count({ where: { status: "APPROVED" } }),
    db.user.count(),
    db.user.count({ where: { role: "PAID" } }),
    db.user.count({ where: { earlyAccess: true, role: "PAID" } }),
    db.contactRequest.count(),
    db.contactRequest.count({ where: { status: "ACCEPTED" } }),
    db.contactRequest.count({ where: { status: "DECLINED" } }),
    db.featureRequest.count(),
    db.creative.count({ where: { featured: true, featuredUntil: { gt: new Date() } } }),
  ]);

  // Breakdowns
  const roleBreakdown = await db.creative.findMany({
    where: { status: "APPROVED" },
    select: { roles: true },
  });
  const roleCounts: Record<string, number> = {};
  roleBreakdown.forEach((c) => c.roles.forEach((r) => { roleCounts[r] = (roleCounts[r] ?? 0) + 1; }));
  const topRoles = Object.entries(roleCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

  const levelBreakdown = await db.creative.groupBy({
    by: ["experienceLevel"],
    where: { status: "APPROVED", experienceLevel: { not: null } },
    _count: true,
  });

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-semibold text-white">Analytics</h2>

      <div>
        <h3 className="text-sm font-medium text-stone-400 uppercase tracking-wide mb-3">Creatives</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total in DB", value: totalCreatives },
            { label: "Approved", value: approvedCreatives },
            { label: "Pending Review", value: pendingCreatives },
            { label: "Currently Featured", value: featuredNow },
          ].map(({ label, value }) => (
            <StatCard key={label} label={label} value={value} />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-stone-400 uppercase tracking-wide mb-3">Subscribers</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Accounts", value: totalUsers },
            { label: "Paid Subscribers", value: paidUsers },
            { label: "Early Access ($30)", value: earlyAccessUsers },
            { label: "Standard ($50)", value: paidUsers - earlyAccessUsers },
          ].map(({ label, value }) => (
            <StatCard key={label} label={label} value={value} />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-stone-400 uppercase tracking-wide mb-3">Contact Requests</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Submitted", value: totalContacts },
            { label: "Accepted", value: acceptedContacts },
            { label: "Declined", value: declinedContacts },
            { label: "Feature Requests", value: totalFeatureRequests },
          ].map(({ label, value }) => (
            <StatCard key={label} label={label} value={value} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-stone-400 uppercase tracking-wide mb-3">Top Roles</h3>
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 space-y-2">
            {topRoles.map(([role, count]) => (
              <div key={role} className="flex items-center justify-between text-sm">
                <span className="text-stone-300">{role}</span>
                <span className="text-stone-500">{count}</span>
              </div>
            ))}
            {topRoles.length === 0 && <p className="text-stone-600 text-sm">No data yet</p>}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-stone-400 uppercase tracking-wide mb-3">Experience Levels</h3>
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 space-y-2">
            {levelBreakdown.map((l) => (
              <div key={l.experienceLevel} className="flex items-center justify-between text-sm">
                <span className="text-stone-300">{l.experienceLevel}</span>
                <span className="text-stone-500">{l._count}</span>
              </div>
            ))}
            {levelBreakdown.length === 0 && <p className="text-stone-600 text-sm">No data yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-stone-900 border border-stone-800 rounded-xl p-4">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-stone-500 mt-0.5">{label}</p>
    </div>
  );
}
