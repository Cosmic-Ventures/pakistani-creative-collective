import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { isMissingSchemaError, MIGRATION_PENDING_MESSAGE } from "@/lib/db-availability";
import { FilterTabs } from "@/components/admin/FilterTabs";
import { retryFailedMassEmailAction } from "@/lib/mass-email-actions";

export const metadata: Metadata = { title: "Sent Emails · Admin" };
export const dynamic = "force-dynamic";

const FILTERS = [
  { id: "all", label: "Everything" },
  { id: "members", label: "To members" },
  { id: "mass", label: "Mass emails" },
  { id: "admin", label: "Admin notifications" },
  { id: "failed", label: "Failed" },
] as const;

const WHERE: Record<string, Prisma.EmailLogWhereInput> = {
  all: {},
  members: { NOT: [{ kind: { startsWith: "admin:" } }, { kind: "support" }, { kind: "mass-email" }] },
  mass: { kind: { in: ["mass-email", "test:mass-email"] } },
  admin: { OR: [{ kind: { startsWith: "admin:" } }, { kind: "support" }] },
  failed: { status: "failed" },
};

export default async function SentEmailsPage({
  searchParams,
}: {
  searchParams: Promise<{ f?: string; q?: string; batch?: string }>;
}) {
  const params = await searchParams;
  const f = params.f && params.f in WHERE ? params.f : "all";
  const q = (params.q ?? "").trim().slice(0, 100);
  const batch = (params.batch ?? "").trim();

  const search: Prisma.EmailLogWhereInput = q
    ? { OR: [{ to: { contains: q, mode: "insensitive" } }, { subject: { contains: q, mode: "insensitive" } }] }
    : {};
  const where: Prisma.EmailLogWhereInput = {
    AND: [WHERE[f], search, batch ? { batchId: batch } : {}],
  };

  let emails;
  try {
    emails = await db.emailLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 300,
      select: { id: true, createdAt: true, kind: true, to: true, subject: true, status: true, error: true },
    });
  } catch (error) {
    if (!isMissingSchemaError(error)) throw error;
    return (
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">Sent Emails</h2>
        <p className="text-sm text-amber-400 bg-amber-950/30 border border-amber-800/60 rounded-lg px-4 py-3">
          {MIGRATION_PENDING_MESSAGE.replace("20260901120000_email_templates_and_password_reset", "20261022120000_email_log")}
        </p>
      </div>
    );
  }

  const href = (id: string) => `/admin/sent-emails?f=${id}${q ? `&q=${encodeURIComponent(q)}` : ""}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h2 className="text-lg font-semibold text-white">Sent Emails</h2>
        <FilterTabs tabs={FILTERS.map((x) => ({ label: x.label, href: href(x.id), active: f === x.id }))} />
      </div>
      <p className="text-xs text-stone-500 mb-4">
        Every email sent since this log was switched on, newest first (latest 300 shown). Click one to see
        exactly what the recipient received.
      </p>
      <form action="/admin/sent-emails" className="flex gap-2 mb-4">
        <input type="hidden" name="f" value={f} />
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by recipient or subject"
          className="bg-stone-900 border border-stone-700 rounded-lg px-3 py-1.5 text-sm text-stone-200 placeholder-stone-600 w-72 focus:outline-none focus:border-stone-500"
        />
        <button className="text-sm bg-stone-700 hover:bg-stone-600 text-white px-4 py-1.5 rounded-lg">Search</button>
      </form>
      {batch && (
        <div className="text-xs text-stone-400 mb-4 flex items-center gap-4 flex-wrap">
          <span>
            Showing one mass email: {emails.filter((e) => e.status === "sent").length} sent,{" "}
            {emails.filter((e) => e.status === "failed").length} failed.{" "}
            <Link href="/admin/sent-emails?f=mass" className="text-emerald-500 hover:text-emerald-400">
              Show all
            </Link>
          </span>
          {emails.some((e) => e.status === "failed") && (
            <form action={retryFailedMassEmailAction}>
              <input type="hidden" name="batchId" value={batch} />
              <button className="bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1 rounded-lg">
                Retry the {emails.filter((e) => e.status === "failed").length} that failed
              </button>
            </form>
          )}
        </div>
      )}

      <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-800 text-left text-xs text-stone-500 uppercase tracking-wide">
              <th className="px-4 py-3 font-medium">Sent</th>
              <th className="px-4 py-3 font-medium">To</th>
              <th className="px-4 py-3 font-medium">Subject</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {emails.map((e) => (
              <tr key={e.id} className="border-b border-stone-800/60 last:border-0">
                <td className="px-4 py-3 text-xs text-stone-500 whitespace-nowrap">
                  {e.createdAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                </td>
                <td className="px-4 py-3 text-xs text-stone-300 max-w-56 truncate">{e.to}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/sent-emails/${e.id}`} className="text-emerald-500 hover:text-emerald-400">
                    {e.subject}
                  </Link>
                </td>
                <td className="px-4 py-3 text-xs text-stone-500">{e.kind}</td>
                <td className="px-4 py-3 text-xs">
                  {e.status === "sent" ? (
                    <span className="text-emerald-400">Sent</span>
                  ) : e.status === "retried" ? (
                    <span className="text-stone-500">Retried</span>
                  ) : (
                    <div>
                      <span className="text-red-400">Failed</span>
                      {e.error && <p className="text-[11px] text-red-300/80 max-w-56">{e.error}</p>}
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {emails.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-stone-600">
                  Nothing here yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
