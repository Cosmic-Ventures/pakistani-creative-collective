import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Admin" };
export const dynamic = "force-dynamic";

function timeAgo(date: Date): string {
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

type ActivityItem = {
  id: string;
  message: string;
  href: string;
  createdAt: Date;
};

export default async function AdminPage() {
  // Everything here is read-only, so a handful of small parallel queries is
  // fine — no need for a dedicated activity-log table/schema (that'd be a much
  // bigger lift than this page warrants). groupBy's batch typing is imprecise
  // inside $transaction (AGENTS.md gotcha #8), so it's pulled out as a
  // standalone await below rather than folded into the Promise.all.
  const [
    totalApproved,
    totalPaid,
    creativeCounts,
    contactCounts,
    featureCounts,
    postCounts,
    pendingReportsCount,
    recentApplications,
    recentContactRequests,
    recentPosts,
    recentPaidUsers,
    recentReports,
    recentFeatureRequests,
  ] = await Promise.all([
    db.creative.count({ where: { status: "APPROVED" } }),
    db.user.count({ where: { role: "PAID" } }),
    db.creative.groupBy({ by: ["status"], _count: true }),
    db.contactRequest.groupBy({ by: ["status"], _count: true }),
    db.featureRequest.groupBy({ by: ["status"], _count: true }),
    db.post.groupBy({ by: ["status"], _count: true }),
    db.commentReport.count({ where: { status: "PENDING" } }),
    db.creative.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, firstName: true, lastName: true, status: true, createdAt: true },
    }),
    db.contactRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        requesterName: true,
        status: true,
        createdAt: true,
        creative: { select: { firstName: true, lastName: true } },
      },
    }),
    db.post.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        creative: { select: { firstName: true, lastName: true } },
      },
    }),
    db.user.findMany({
      where: { role: "PAID" },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, name: true, email: true, createdAt: true },
    }),
    db.commentReport.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        createdAt: true,
        creative: { select: { firstName: true, lastName: true } },
        comment: { select: { post: { select: { title: true } } } },
      },
    }),
    db.featureRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        status: true,
        createdAt: true,
        creative: { select: { firstName: true, lastName: true } },
      },
    }),
  ]);

  const countOf = (rows: { status: string; _count: number }[], status: string) =>
    rows.find((r) => r.status === status)?._count ?? 0;

  const pendingApps = countOf(creativeCounts, "PENDING");
  const flaggedApps = countOf(creativeCounts, "FLAGGED");
  const pendingContacts = countOf(contactCounts, "PENDING");
  const pendingFeatures = countOf(featureCounts, "PENDING");
  const pendingPosts = countOf(postCounts, "PENDING");

  // ── Needs attention — what's actually actionable right now ────────────────
  const attentionItems = [
    { label: "Applications pending review", value: pendingApps, href: "/admin/applications?status=PENDING" },
    { label: "Applications flagged for changes", value: flaggedApps, href: "/admin/applications?status=FLAGGED" },
    { label: "Contact requests awaiting action", value: pendingContacts, href: "/admin/contact-requests?status=PENDING" },
    { label: "Community posts pending review", value: pendingPosts, href: "/admin/community?status=PENDING" },
    { label: "Flagged comments to review", value: pendingReportsCount, href: "/admin/community" },
    { label: "Feature requests pending", value: pendingFeatures, href: "/admin/feature-requests?status=PENDING" },
  ].filter((item) => item.value > 0);

  const stats = [
    { label: "Pending Applications", value: pendingApps, href: "/admin/applications?status=PENDING", urgent: pendingApps > 0 },
    { label: "Approved Creatives", value: totalApproved, href: "/admin/applications?status=APPROVED" },
    { label: "Paid Subscribers", value: totalPaid, href: "/admin/analytics" },
    { label: "Pending Contact Requests", value: pendingContacts, href: "/admin/contact-requests?status=PENDING", urgent: pendingContacts > 0 },
    { label: "Pending Feature Requests", value: pendingFeatures, href: "/admin/feature-requests?status=PENDING", urgent: pendingFeatures > 0 },
    { label: "Flagged Comments", value: pendingReportsCount, href: "/admin/community", urgent: pendingReportsCount > 0 },
  ];

  // ── Recent activity — merge each model's recent rows into one timeline ────
  const activity: ActivityItem[] = [
    ...recentApplications.map((c) => ({
      id: `app-${c.id}`,
      message: `New application from ${c.firstName} ${c.lastName} (${c.status.charAt(0) + c.status.slice(1).toLowerCase()})`,
      href: `/admin/applications/${c.id}`,
      createdAt: c.createdAt,
    })),
    ...recentContactRequests.map((r) => ({
      id: `contact-${r.id}`,
      message: `Contact request from ${r.requesterName} for ${r.creative.firstName} ${r.creative.lastName} (${r.status.charAt(0) + r.status.slice(1).toLowerCase()})`,
      href: "/admin/contact-requests",
      createdAt: r.createdAt,
    })),
    ...recentPosts.map((p) => ({
      id: `post-${p.id}`,
      message: `Community post "${p.title}" by ${p.creative.firstName} ${p.creative.lastName} (${p.status.charAt(0) + p.status.slice(1).toLowerCase()})`,
      href: "/admin/community",
      createdAt: p.createdAt,
    })),
    ...recentPaidUsers.map((u) => ({
      id: `user-${u.id}`,
      message: `New paid signup — ${u.name ?? u.email}`,
      href: "/admin/users?role=PAID",
      createdAt: u.createdAt,
    })),
    ...recentReports.map((r) => ({
      id: `report-${r.id}`,
      message: `Comment flagged on "${r.comment.post.title}" by ${r.creative.firstName} ${r.creative.lastName}`,
      href: "/admin/community",
      createdAt: r.createdAt,
    })),
    ...recentFeatureRequests.map((f) => ({
      id: `feature-${f.id}`,
      message: `Feature request from ${f.creative.firstName} ${f.creative.lastName} (${f.status.charAt(0) + f.status.slice(1).toLowerCase()})`,
      href: "/admin/feature-requests",
      createdAt: f.createdAt,
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 15);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Needs Attention</h2>
        {attentionItems.length === 0 ? (
          <p className="text-stone-500 text-sm bg-stone-900 border border-stone-800 rounded-xl px-5 py-4">
            Nothing needs your attention right now — all clear.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {attentionItems.map(({ label, value, href }) => (
              <Link
                key={label}
                href={href}
                className="flex items-center justify-between gap-3 bg-amber-950/20 border border-amber-700/40 rounded-xl px-5 py-3 hover:border-amber-500/60 transition-colors"
              >
                <span className="text-sm text-amber-100">{label}</span>
                <span className="text-lg font-bold text-amber-400 shrink-0">{value}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
          {activity.length === 0 ? (
            <p className="text-stone-500 text-sm">No activity yet.</p>
          ) : (
            <div className="bg-stone-900 border border-stone-800 rounded-xl divide-y divide-stone-800">
              {activity.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-stone-800/50 transition-colors"
                >
                  <span className="text-sm text-stone-300">{item.message}</span>
                  <span className="text-xs text-stone-600 shrink-0">{timeAgo(item.createdAt)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Overview</h2>
          <div className="grid grid-cols-2 gap-4">
            {stats.map(({ label, value, href, urgent }) => (
              <Link
                key={label}
                href={href}
                className={`bg-stone-900 border rounded-xl p-4 hover:border-stone-600 transition-colors ${
                  urgent ? "border-amber-700/60" : "border-stone-800"
                }`}
              >
                <p className={`text-2xl font-bold mb-1 ${urgent ? "text-amber-400" : "text-white"}`}>
                  {value}
                </p>
                <p className="text-xs text-stone-400">{label}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
