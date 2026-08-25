import type { Metadata } from "next";
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

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role = "ALL" } = await searchParams;

  const [session, users, roleCounts] = await Promise.all([
    getSession(),
    db.user.findMany({
      where: role === "ALL" ? {} : { role: role as "UNPAID" | "PAID" | "ADMIN" },
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
      },
    }),
    db.user.groupBy({ by: ["role"], _count: true }),
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
            href: `/admin/users?role=${r}`,
            active: role === r,
            count: r === "ALL" ? totalCount : (countByRole[r] ?? 0),
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
                    <span className="text-stone-600">None</span>
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
