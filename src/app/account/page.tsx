import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { logoutAction } from "@/lib/auth-actions";

export const metadata: Metadata = { title: "My Account" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect("/auth/signin");

  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user) redirect("/auth/signin");

  async function manageSubscription() {
    "use server";
    const s = await getSession();
    if (!s) return;
    const u = await db.user.findUnique({ where: { id: s.userId } });
    if (!u?.stripeCustomerId) return;

    const portal = await stripe.billingPortal.sessions.create({
      customer: u.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/account`,
    });
    redirect(portal.url);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-2xl font-bold text-white mb-8">My Account</h1>

      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 mb-6">
        <h2 className="font-semibold text-white mb-4">Account Details</h2>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-stone-500">Name</dt>
            <dd className="text-stone-200">{user.name ?? "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-stone-500">Email</dt>
            <dd className="text-stone-200">{user.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-stone-500">Access</dt>
            <dd>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${
                user.role === "PAID"
                  ? "text-emerald-400 bg-emerald-950/40 border-emerald-700/40"
                  : user.role === "ADMIN"
                  ? "text-amber-400 bg-amber-950/40 border-amber-700/40"
                  : "text-stone-400 bg-stone-800 border-stone-700"
              }`}>
                {user.role === "PAID" ? "Paid subscriber" : user.role === "ADMIN" ? "Admin" : "Free"}
              </span>
            </dd>
          </div>
          {user.subCurrentPeriodEnd && (
            <div className="flex justify-between">
              <dt className="text-stone-500">Subscription renews</dt>
              <dd className="text-stone-200">{new Date(user.subCurrentPeriodEnd).toLocaleDateString()}</dd>
            </div>
          )}
          {user.earlyAccess && user.role === "UNPAID" && (
            <div className="flex justify-between">
              <dt className="text-stone-500">Pricing</dt>
              <dd className="text-emerald-400 text-xs">Early access rate ($30/yr) — first year only</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="flex flex-wrap gap-3">
        {user.role === "PAID" && user.stripeCustomerId && (
          <form action={manageSubscription}>
            <button className="text-sm bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 px-5 py-2.5 rounded-full transition-colors">
              Manage Subscription
            </button>
          </form>
        )}
        {user.role === "UNPAID" && (
          <a
            href="/subscribe"
            className="text-sm bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-5 py-2.5 rounded-full transition-colors"
          >
            Subscribe — from ${user.earlyAccess ? 30 : 50}/year
          </a>
        )}
        <form action={logoutAction}>
          <button className="text-sm text-stone-500 hover:text-stone-300 transition-colors px-2 py-2.5">
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
