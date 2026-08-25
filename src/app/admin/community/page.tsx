import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import {
  approvePost,
  rejectPost,
  editPost,
  removePost,
  dismissCommentReport,
  removeReportedComment,
  suspendMemberComments,
  unsuspendMemberComments,
  clearMemberFlag,
  sendBulkPostNotification,
} from "@/lib/community-admin-actions";
import { POST_CATEGORY_LABELS } from "@/lib/community-constants";
import { FilterTabs } from "@/components/admin/FilterTabs";

export const metadata: Metadata = { title: "Community · Admin" };
export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "text-amber-400 bg-amber-950/40 border-amber-700/40",
  APPROVED: "text-emerald-400 bg-emerald-950/40 border-emerald-700/40",
  REJECTED: "text-red-400 bg-red-950/40 border-red-700/40",
};

export default async function AdminCommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: string; q?: string; from?: string; to?: string }>;
}) {
  const { status = "PENDING", category = "", q = "", from = "", to = "" } = await searchParams;

  // Client spec: the queue is searchable by member, category, region, and date.
  // `q` matches member name or region; from/to bound the submission date.
  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(`${to}T23:59:59`) : null;

  // Shared filter (everything except status) — reused for both the list query
  // and the per-status counts on the tabs, so counts reflect the active
  // category/search/date filters rather than the whole table.
  const sharedWhere = {
    ...(category ? { category: category as keyof typeof POST_CATEGORY_LABELS } : {}),
    ...(q
      ? {
          OR: [
            { creative: { firstName: { contains: q, mode: "insensitive" as const } } },
            { creative: { lastName: { contains: q, mode: "insensitive" as const } } },
            { region: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(fromDate || toDate
      ? { createdAt: { ...(fromDate ? { gte: fromDate } : {}), ...(toDate ? { lte: toDate } : {}) } }
      : {}),
  };

  const [posts, reports, flaggedOrSuspended] = await Promise.all([
    db.post.findMany({
      where: { ...sharedWhere, ...(status === "ALL" ? {} : { status: status as "PENDING" | "APPROVED" | "REJECTED" }) },
      orderBy: { createdAt: "desc" },
      include: { creative: { select: { firstName: true, lastName: true, email: true, slug: true } } },
    }),
    db.commentReport.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      include: {
        comment: { include: { creative: { select: { firstName: true, lastName: true, slug: true } }, post: { select: { title: true } } } },
        creative: { select: { firstName: true, lastName: true, slug: true } },
      },
    }),
    db.creative.findMany({
      where: { OR: [{ commentFlagged: true }, { commentSuspended: true }] },
      select: { id: true, firstName: true, lastName: true, slug: true, commentFlagged: true, commentSuspended: true },
    }),
  ]);

  // groupBy's batch typing is imprecise inside $transaction (AGENTS.md gotcha
  // #8), so this is a standalone await alongside the Promise.all above rather
  // than folded into it.
  const postStatusCounts = await db.post.groupBy({ by: ["status"], where: sharedWhere, _count: true });
  const countByStatus = Object.fromEntries(postStatusCounts.map((s) => [s.status, s._count]));
  const totalPostCount = postStatusCounts.reduce((sum, s) => sum + s._count, 0);

  return (
    <div className="space-y-10">
      <div>
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h2 className="text-lg font-semibold text-white">Community Posts</h2>
          <div className="flex gap-2 text-sm flex-wrap items-center">
            <FilterTabs
              tabs={["PENDING", "APPROVED", "REJECTED", "ALL"].map((s) => ({
                label: s.charAt(0) + s.slice(1).toLowerCase(),
                href: `/admin/community?status=${s}${category ? `&category=${category}` : ""}`,
                active: status === s,
                count: s === "ALL" ? totalPostCount : (countByStatus[s] ?? 0),
              }))}
            />
            <a
              href={`/admin/community?status=${status}`}
              className={`px-3 py-1 rounded-full border transition-colors ${
                !category ? "bg-stone-700 border-stone-600 text-white" : "border-stone-800 text-stone-500 hover:text-stone-300"
              }`}
            >
              All Categories
            </a>
            {(Object.keys(POST_CATEGORY_LABELS) as (keyof typeof POST_CATEGORY_LABELS)[]).map((c) => (
              <a
                key={c}
                href={`/admin/community?status=${status}&category=${c}`}
                className={`px-3 py-1 rounded-full border transition-colors ${
                  category === c ? "bg-stone-700 border-stone-600 text-white" : "border-stone-800 text-stone-500 hover:text-stone-300"
                }`}
              >
                {POST_CATEGORY_LABELS[c]}
              </a>
            ))}
          </div>
        </div>

        <form method="GET" action="/admin/community" className="flex flex-wrap items-end gap-3 mb-6 text-sm">
          <input type="hidden" name="status" value={status} />
          {category && <input type="hidden" name="category" value={category} />}
          <div>
            <label htmlFor="post-q" className="block text-xs text-stone-500 mb-1">Member or region</label>
            <input
              id="post-q"
              name="q"
              defaultValue={q}
              placeholder="Search…"
              className="bg-stone-900 border border-stone-700 rounded-lg px-3 py-1.5 text-stone-200 placeholder-stone-600 focus:outline-none focus:border-stone-500"
            />
          </div>
          <div>
            <label htmlFor="post-from" className="block text-xs text-stone-500 mb-1">From</label>
            <input id="post-from" type="date" name="from" defaultValue={from} className="bg-stone-900 border border-stone-700 rounded-lg px-3 py-1.5 text-stone-200 focus:outline-none focus:border-stone-500" />
          </div>
          <div>
            <label htmlFor="post-to" className="block text-xs text-stone-500 mb-1">To</label>
            <input id="post-to" type="date" name="to" defaultValue={to} className="bg-stone-900 border border-stone-700 rounded-lg px-3 py-1.5 text-stone-200 focus:outline-none focus:border-stone-500" />
          </div>
          <button type="submit" className="px-4 py-1.5 rounded-full bg-stone-700 hover:bg-stone-600 text-white transition-colors">
            Filter
          </button>
          {(q || from || to) && (
            <a href={`/admin/community?status=${status}${category ? `&category=${category}` : ""}`} className="text-stone-500 hover:text-stone-300 py-1.5">
              Clear
            </a>
          )}
        </form>

        {posts.length === 0 && <p className="text-stone-500 text-sm">No posts match this filter.</p>}

        <div className="space-y-4">
          {posts.map((p) => (
            <div key={p.id} className="bg-stone-900 border border-stone-800 rounded-xl p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                <div>
                  <h3 className="font-semibold text-white">{p.title}</h3>
                  <p className="text-sm text-stone-400">
                    <Link href={`/directory/${p.creative.slug}`} target="_blank" className="hover:text-white hover:underline">
                      {p.creative.firstName} {p.creative.lastName}
                    </Link>{" "}
                    · {POST_CATEGORY_LABELS[p.category]}
                  </p>
                  <p className="text-xs text-stone-600 mt-0.5">
                    Submitted {new Date(p.createdAt).toLocaleDateString()}
                    {p.region && ` · ${p.region}`}
                    {p.expiresAt && ` · through ${new Date(p.expiresAt).toLocaleDateString()}`}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${STATUS_COLORS[p.status]}`}>{p.status}</span>
              </div>

              <p className="text-sm text-stone-400 leading-relaxed mb-3 whitespace-pre-wrap">{p.body}</p>
              {p.link && (
                <a href={p.link} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-500 hover:text-emerald-400">
                  Attachment ↗
                </a>
              )}

              {p.adminNotes && (
                <p className="text-xs text-amber-400/80 bg-amber-950/30 border border-amber-700/30 rounded px-3 py-2 my-3">
                  Notes: {p.adminNotes}
                </p>
              )}

              {p.status === "PENDING" && (
                <details className="mb-3">
                  <summary className="text-xs text-stone-500 cursor-pointer hover:text-stone-400">
                    Edit before approving
                  </summary>
                  <form
                    action={async (formData: FormData) => {
                      "use server";
                      await editPost(p.id, {
                        title: formData.get("title") as string,
                        body: formData.get("body") as string,
                      });
                    }}
                    className="mt-3 space-y-2"
                  >
                    <input
                      name="title"
                      defaultValue={p.title}
                      className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-1.5 text-sm text-stone-200 focus:outline-none focus:border-stone-600"
                    />
                    <textarea
                      name="body"
                      defaultValue={p.body}
                      rows={4}
                      className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-1.5 text-sm text-stone-200 focus:outline-none focus:border-stone-600"
                    />
                    <button className="text-xs bg-stone-800 hover:bg-stone-700 text-stone-300 px-3 py-1.5 rounded-lg transition-colors">
                      Save edits
                    </button>
                  </form>
                </details>
              )}

              <div className="flex gap-2 flex-wrap mt-3">
                {p.status === "PENDING" && (
                  <>
                    <form action={async () => { "use server"; await approvePost(p.id); }}>
                      <button className="text-sm bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-1.5 rounded-lg transition-colors">
                        Approve
                      </button>
                    </form>
                    <form action={async () => { "use server"; await rejectPost(p.id); }}>
                      <button className="text-sm bg-stone-800 hover:bg-red-900/60 border border-stone-700 hover:border-red-700 text-stone-300 px-4 py-1.5 rounded-lg transition-colors">
                        Reject
                      </button>
                    </form>
                  </>
                )}
                <form action={async () => { "use server"; await removePost(p.id); }}>
                  <button className="text-sm text-stone-500 hover:text-red-400 transition-colors px-2">
                    Remove
                  </button>
                </form>
              </div>

              {p.status === "APPROVED" && (
                <form
                  action={async (formData: FormData) => {
                    "use server";
                    const message = formData.get("message") as string;
                    if (message?.trim()) await sendBulkPostNotification(p.id, message.trim());
                  }}
                  className="flex gap-2 mt-3 pt-3 border-t border-stone-800"
                >
                  <input
                    name="message"
                    placeholder="Notify all members about this post…"
                    className="flex-1 bg-stone-950 border border-stone-800 rounded-lg px-3 py-1.5 text-sm text-stone-300 placeholder-stone-600 focus:outline-none focus:border-stone-600"
                  />
                  <button className="text-xs bg-stone-800 hover:bg-stone-700 text-stone-300 px-3 py-1.5 rounded-lg transition-colors shrink-0">
                    Send
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-white mb-6">Reported Comments ({reports.length})</h2>
        {reports.length === 0 && <p className="text-stone-500 text-sm">No pending reports.</p>}
        <div className="space-y-4">
          {reports.map((r) => (
            <div key={r.id} className="bg-stone-900 border border-stone-800 rounded-xl p-5">
              <p className="text-xs text-stone-500 mb-2">
                On &ldquo;{r.comment.post.title}&rdquo; · reported by{" "}
                <Link href={`/directory/${r.creative.slug}`} target="_blank" className="hover:text-stone-300 hover:underline">
                  {r.creative.firstName} {r.creative.lastName}
                </Link>
              </p>
              <p className="text-sm text-stone-300 mb-1">
                <Link href={`/directory/${r.comment.creative.slug}`} target="_blank" className="hover:underline">
                  {r.comment.creative.firstName} {r.comment.creative.lastName}
                </Link>:
              </p>
              <p className="text-sm text-stone-400 mb-3">{r.comment.body}</p>
              <div className="flex gap-2">
                <form action={async () => { "use server"; await removeReportedComment(r.id); }}>
                  <button className="text-sm bg-stone-800 hover:bg-red-900/60 border border-stone-700 hover:border-red-700 text-stone-300 px-4 py-1.5 rounded-lg transition-colors">
                    Remove Comment
                  </button>
                </form>
                <form action={async () => { "use server"; await dismissCommentReport(r.id); }}>
                  <button className="text-sm text-stone-500 hover:text-stone-300 transition-colors px-2">
                    Dismiss
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </div>

      {flaggedOrSuspended.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-6">Flagged / Suspended Members ({flaggedOrSuspended.length})</h2>
          <div className="space-y-3">
            {flaggedOrSuspended.map((c) => (
              <div key={c.id} className="bg-stone-900 border border-stone-800 rounded-xl p-4 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Link href={`/directory/${c.slug}`} target="_blank" className="text-white text-sm hover:underline">
                    {c.firstName} {c.lastName}
                  </Link>
                  {c.commentFlagged && (
                    <span className="text-xs px-2 py-0.5 rounded-full border text-amber-400 bg-amber-950/40 border-amber-700/40">Flagged</span>
                  )}
                  {c.commentSuspended && (
                    <span className="text-xs px-2 py-0.5 rounded-full border text-red-400 bg-red-950/40 border-red-700/40">Suspended</span>
                  )}
                </div>
                <div className="flex gap-2">
                  {c.commentFlagged && (
                    <form action={async () => { "use server"; await clearMemberFlag(c.id); }}>
                      <button className="text-xs text-stone-500 hover:text-stone-300 transition-colors">Clear flag</button>
                    </form>
                  )}
                  {c.commentSuspended ? (
                    <form action={async () => { "use server"; await unsuspendMemberComments(c.id); }}>
                      <button className="text-xs bg-stone-800 hover:bg-stone-700 text-stone-300 px-3 py-1 rounded-lg transition-colors">
                        Unsuspend
                      </button>
                    </form>
                  ) : (
                    <form action={async () => { "use server"; await suspendMemberComments(c.id); }}>
                      <button className="text-xs bg-stone-800 hover:bg-red-900/60 border border-stone-700 hover:border-red-700 text-stone-300 px-3 py-1 rounded-lg transition-colors">
                        Suspend
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
