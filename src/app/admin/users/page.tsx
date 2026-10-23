import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { RoleControl } from "@/components/AdminRoleControl";
import { FilterTabs } from "@/components/admin/FilterTabs";

export const metadata: Metadata = { title: "Users · Admin" };
export const dynamic = "force-dynamic";

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "text-amber-400 bg-amber-950/40 border-amber-700/40",
  PAID: "text-emerald-400 bg-emerald-950/40 border-emerald-700/40",
  UNPAID: "text-stone-400 bg-stone-800 border-stone-700",
};

const ROLES = ["ALL", "ADMIN", "PAID", "UNPAID"] as const;

// Where each login stands with its application, whatever stage it's at (client,
// 10/22: "I just want to know whether they started it, they didn't at all, or
// they did and it's pending").
const APPLICATION_FILTERS = [
  { id: "ALL", label: "Any application" },
  { id: "NONE", label: "Not started" },
  { id: "DRAFT", label: "Started, not submitted" },
  { id: "PENDING", label: "Pending review" },
  { id: "APPROVED", label: "Approved" },
  { id: "OTHER", label: "Rejected / inactive / flagged" },
] as const;

const APPLICATION_WHERE: Record<string, Prisma.UserWhereInput> = {
  ALL: {},
  NONE: { creative: null, enrollmentDraft: null },
  DRAFT: { creative: null, enrollmentDraft: { isNot: null } },
  PENDING: { creative: { is: { status: "PENDING" } } },
  APPROVED: { creative: { is: { status: "APPROVED" } } },
  OTHER: { creative: { is: { status: { in: ["REJECTED", "INACTIVE", "FLAGGED"] } } } },
};

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; app?: string; q?: string; promo?: string }>;
}) {
  const params = await searchParams;
  const role = ROLES.includes(params.role as (typeof ROLES)[number]) ? params.role! : "ALL";
  const app = params.app && params.app in APPLICATION_WHERE ? params.app : "ALL";
  const q = (params.q ?? "").trim().slice(0, 100);
  const promoOnly = params.promo === "1";

  const search: Prisma.UserWhereInput = q
    ? {
        OR: [
          { email: { contains: q, mode: "insensitive" } },
          { name: { contains: q, mode: "insensitive" } },
          { creative: { is: { OR: [
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
          ] } } },
        ],
      }
    : {};
  const roleWhere: Prisma.UserWhereInput = role === "ALL" ? {} : { role: role as "UNPAID" | "PAID" | "ADMIN" };
  const href = (over: { role?: string; app?: string }) => {
    const sp = new URLSearchParams();
    const r = over.role ?? role;
    const a = over.app ?? app;
    if (r !== "ALL") sp.set("role", r);
    if (a !== "ALL") sp.set("app", a);
    if (q) sp.set("q", q);
    if (promoOnly) sp.set("promo", "1");
    const qs = sp.toString();
    return `/admin/users${qs ? `?${qs}` : ""}`;
  };

  const [session, users, roleCounts, appCounts] = await Promise.all([
    getSession(),
    db.user.findMany({
      where: { AND: [roleWhere, APPLICATION_WHERE[app], search, promoOnly ? { creative: { is: { promoConsent: true } } } : {}] },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        subStatus: true,
        subCurrentPeriodEnd: true,
        createdAt: true,
        creative: { select: { id: true, slug: true, status: true, promoConsent: true } },
        enrollmentDraft: { select: { id: true } },
      },
    }),
    db.user.groupBy({ by: ["role"], _count: true }),
    Promise.all(
      APPLICATION_FILTERS.map((f) => db.user.count({ where: { AND: [APPLICATION_WHERE[f.id], search] } }))
    ),
  ]);

  const countByRole = Object.fromEntries(roleCounts.map((r) => [r.role, r._count]));
  const totalCount = roleCounts.reduce((sum, r) => sum + r._count, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h2 className="text-lg font-semibold text-white">Users</h2>
        <FilterTabs
          tabs={ROLES.map((r) => ({
            label: r.charAt(0) + r.slice(1).toLowerCase(),
            href: href({ role: r }),
            active: role === r,
            count: r === "ALL" ? totalCount : (countByRole[r] ?? 0),
          }))}
        />
      </div>

      <form action="/admin/users" className="flex gap-2 mb-4 flex-wrap">
        {role !== "ALL" && <input type="hidden" name="role" value={role} />}
        {app !== "ALL" && <input type="hidden" name="app" value={app} />}
        {/* checkbox below carries promo */}
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by name or email"
          className="bg-stone-900 border border-stone-700 rounded-lg px-3 py-1.5 text-sm text-stone-200 placeholder-stone-600 w-64 focus:outline-none focus:border-stone-500"
        />
        <label className="flex items-center gap-1.5 text-sm text-stone-400">
          <input type="checkbox" name="promo" value="1" defaultChecked={promoOnly} /> Opted in to promo
        </label>
        <button className="text-sm bg-stone-700 hover:bg-stone-600 text-white px-4 py-1.5 rounded-lg">Search</button>
        {q && (
          <Link href={href({}).replace(/([?&])q=[^&]*&?/, "$1").replace(/[?&]$/, "")} className="text-sm text-stone-500 hover:text-stone-300 px-2 py-1.5">
            Clear
          </Link>
        )}
      </form>

      <div className="mb-4">
        <FilterTabs
          tabs={APPLICATION_FILTERS.map((f, i) => ({
            label: f.label,
            href: href({ app: f.id }),
            active: app === f.id,
            count: appCounts[i],
          }))}
        />
      </div>

      <p className="text-xs text-stone-600 mb-4">
        {users.length} account{users.length === 1 ? "" : "s"}. A user account is a login — most listed
        creatives don&apos;t have one, and most subscribers aren&apos;t necessarily a listed creative.
      </p>

      <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-800 text-left text-xs text-stone-500 uppercase tracking-wide">
              <th className="px-4 py-3 font-medium">Name / Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Subscription</th>
              <th className="px-4 py-3 font-medium">Linked Profile</th>
              <th className="px-4 py-3 font-medium">Promo Consent</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-stone-800/60 last:border-0">
                <td className="px-4 py-3">
                  <p className="text-stone-200">{u.name ?? "—"}</p>
                  <p className="text-xs text-stone-500">{u.email}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${ROLE_COLORS[u.role]}`}>{u.role}</span>
                </td>
                <td className="px-4 py-3 text-xs text-stone-400">
                  {u.subStatus ?? "—"}
                  {u.subCurrentPeriodEnd && (
                    <span className="text-stone-600"> · renews {new Date(u.subCurrentPeriodEnd).toLocaleDateString()}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs">
                  {u.creative ? (
                    <Link href={`/admin/applications/${u.creative.id}`} className="text-emerald-500 hover:text-emerald-400">
                      {u.creative.status}
                    </Link>
                  ) : (
                    <span className="text-stone-600">
                      {u.enrollmentDraft ? "Started, not submitted" : "Not started"}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs">
                  {u.creative ? (
                    u.creative.promoConsent ? (
                      <span className="text-emerald-400 bg-emerald-950/40 border border-emerald-700/40 px-2 py-0.5 rounded-full">
                        Opted in
                      </span>
                    ) : (
                      <span className="text-stone-500">Not opted in</span>
                    )
                  ) : (
                    <span className="text-stone-700">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-stone-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <RoleControl userId={u.id} currentRole={u.role} isSelf={u.id === session?.userId} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
