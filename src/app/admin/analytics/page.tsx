import type { Metadata } from "next";
import { db } from "@/lib/db";
import { POST_CATEGORY_LABELS } from "@/lib/community-constants";

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
  ] = await db.$transaction([
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

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    totalPosts,
    postsThisMonth,
    pendingPosts,
    approvedPosts,
    rejectedPosts,
    activePosts,
    reviewedPosts,
    totalComments,
    commentsThisMonth,
    totalReports,
    reportsThisMonth,
    actionedReports,
    mostReactedPosts,
    mostCommentedPosts,
  ] = await db.$transaction([
    db.post.count(),
    db.post.count({ where: { createdAt: { gte: startOfMonth } } }),
    db.post.count({ where: { status: "PENDING" } }),
    db.post.count({ where: { status: "APPROVED" } }),
    db.post.count({ where: { status: "REJECTED" } }),
    db.post.count({ where: { status: "APPROVED", OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] } }),
    db.post.findMany({ where: { status: { in: ["APPROVED", "REJECTED"] } }, select: { createdAt: true, updatedAt: true } }),
    db.comment.count(),
    db.comment.count({ where: { createdAt: { gte: startOfMonth } } }),
    db.commentReport.count(),
    db.commentReport.count({ where: { createdAt: { gte: startOfMonth } } }),
    db.commentReport.count({ where: { status: "ACTIONED" } }),
    db.post.findMany({
      where: { status: "APPROVED" },
      select: { id: true, title: true, _count: { select: { reactions: true } } },
      orderBy: { reactions: { _count: "desc" } },
      take: 5,
    }),
    db.post.findMany({
      where: { status: "APPROVED" },
      select: { id: true, title: true, _count: { select: { comments: true } } },
      orderBy: { comments: { _count: "desc" } },
      take: 5,
    }),
  ]);

  const postsByCategory = await db.post.groupBy({ by: ["category"], _count: true, orderBy: { category: "asc" } });

  const removedCommentsByCreative = await db.comment.groupBy({
    by: ["creativeId"],
    where: { isRemoved: true },
    _count: { _all: true },
    orderBy: { _count: { creativeId: "desc" } },
    take: 5,
  });

  const avgReviewMs =
    reviewedPosts.length > 0
      ? reviewedPosts.reduce((sum, p) => sum + (p.updatedAt.getTime() - p.createdAt.getTime()), 0) / reviewedPosts.length
      : 0;
  const avgReviewHours = (avgReviewMs / (1000 * 60 * 60)).toFixed(1);
  const postApprovalRate = approvedPosts + rejectedPosts > 0 ? Math.round((approvedPosts / (approvedPosts + rejectedPosts)) * 100) : null;
  const reportToRemovalRate = totalReports > 0 ? Math.round((actionedReports / totalReports) * 100) : null;

  const flaggedCreativeNames =
    removedCommentsByCreative.length > 0
      ? await db.creative.findMany({
          where: { id: { in: removedCommentsByCreative.map((r) => r.creativeId) } },
          select: { id: true, firstName: true, lastName: true },
        })
      : [];

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

      <div>
        <h3 className="text-sm font-medium text-stone-400 uppercase tracking-wide mb-3">Community Dashboard — Posts</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Posts", value: totalPosts },
            { label: "This Month", value: postsThisMonth },
            { label: "Pending Review", value: pendingPosts },
            { label: "Active Now", value: activePosts },
            { label: "Approval Rate", value: postApprovalRate !== null ? `${postApprovalRate}%` : "—" },
            { label: "Avg. Review Time", value: reviewedPosts.length > 0 ? `${avgReviewHours}h` : "—" },
          ].map(({ label, value }) => (
            <StatCard key={label} label={label} value={value} />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-stone-400 uppercase tracking-wide mb-3">Community Dashboard — Comments & Reactions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Comments", value: totalComments },
            { label: "This Month", value: commentsThisMonth },
            { label: "Reported", value: totalReports },
            { label: "Reported This Month", value: reportsThisMonth },
            { label: "Report → Removal Rate", value: reportToRemovalRate !== null ? `${reportToRemovalRate}%` : "—" },
          ].map(({ label, value }) => (
            <StatCard key={label} label={label} value={value} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-stone-400 uppercase tracking-wide mb-3">Posts by Category</h3>
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 space-y-2">
            {postsByCategory.map((c) => (
              <div key={c.category} className="flex items-center justify-between text-sm">
                <span className="text-stone-300">{POST_CATEGORY_LABELS[c.category]}</span>
                <span className="text-stone-500">{c._count}</span>
              </div>
            ))}
            {postsByCategory.length === 0 && <p className="text-stone-600 text-sm">No data yet</p>}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-stone-400 uppercase tracking-wide mb-3">Members with Most Removed Comments</h3>
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 space-y-2">
            {removedCommentsByCreative.map((r) => {
              const c = flaggedCreativeNames.find((f) => f.id === r.creativeId);
              return (
                <div key={r.creativeId} className="flex items-center justify-between text-sm">
                  <span className="text-stone-300">{c ? `${c.firstName} ${c.lastName}` : "Unknown"}</span>
                  <span className="text-stone-500">{r._count._all}</span>
                </div>
              );
            })}
            {removedCommentsByCreative.length === 0 && <p className="text-stone-600 text-sm">No data yet</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-stone-400 uppercase tracking-wide mb-3">Most Reacted-To Posts</h3>
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 space-y-2">
            {mostReactedPosts.filter((p) => p._count.reactions > 0).map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="text-stone-300 truncate pr-2">{p.title}</span>
                <span className="text-stone-500 shrink-0">{p._count.reactions}</span>
              </div>
            ))}
            {mostReactedPosts.filter((p) => p._count.reactions > 0).length === 0 && <p className="text-stone-600 text-sm">No data yet</p>}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-stone-400 uppercase tracking-wide mb-3">Most Commented Posts</h3>
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 space-y-2">
            {mostCommentedPosts.filter((p) => p._count.comments > 0).map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="text-stone-300 truncate pr-2">{p.title}</span>
                <span className="text-stone-500 shrink-0">{p._count.comments}</span>
              </div>
            ))}
            {mostCommentedPosts.filter((p) => p._count.comments > 0).length === 0 && <p className="text-stone-600 text-sm">No data yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-stone-900 border border-stone-800 rounded-xl p-4">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-stone-500 mt-0.5">{label}</p>
    </div>
  );
}
