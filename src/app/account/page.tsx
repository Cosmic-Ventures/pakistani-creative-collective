import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { logoutAction } from "@/lib/auth-actions";
import { manageSubscriptionPortal } from "@/lib/subscribe-actions";

export const metadata: Metadata = { title: "My Account" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect("/auth/signin");

  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user) redirect("/auth/signin");

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="font-heading font-bold text-2xl text-brand-green mb-8">My Account</h1>

      <div className="bg-white border border-brand-green/10 rounded-2xl p-6 mb-6">
        <h2 className="font-semibold text-brand-green mb-4">Account Details</h2>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-brand-brown/50">Name</dt>
            <dd className="text-brand-brown/90">{user.name ?? "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-brand-brown/50">Email</dt>
            <dd className="text-brand-brown/90">{user.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-brand-brown/50">Access</dt>
            <dd>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${
                user.role === "PAID"
                  ? "text-brand-green bg-brand-mint/20 border-brand-mint"
                  : user.role === "ADMIN"
                  ? "text-amber-700 bg-amber-50 border-amber-300"
                  : "text-brand-brown/60 bg-brand-green/5 border-brand-green/15"
              }`}>
                {user.role === "PAID" ? "Paid subscriber" : user.role === "ADMIN" ? "Admin" : "Free"}
              </span>
            </dd>
          </div>
          {user.subCurrentPeriodEnd && (
            <div className="flex justify-between">
              <dt className="text-brand-brown/50">Subscription renews</dt>
              <dd className="text-brand-brown/90">{new Date(user.subCurrentPeriodEnd).toLocaleDateString()}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="flex flex-wrap gap-3">
        {user.role === "PAID" && user.stripeCustomerId && (
          <form action={manageSubscriptionPortal}>
            <button className="text-sm bg-brand-green/5 hover:bg-brand-green/10 border border-brand-green/20 text-brand-brown/80 px-5 py-2.5 rounded-full transition-colors">
              Manage Subscription
            </button>
          </form>
        )}
        {user.role === "UNPAID" && (
          <a
            href="/subscribe"
            className="text-sm bg-brand-green hover:bg-brand-green/90 text-brand-cream font-semibold px-5 py-2.5 rounded-full transition-colors"
          >
            Subscribe — from $7.86/month
          </a>
        )}
        <form action={logoutAction}>
          <button className="text-sm text-brand-brown/50 hover:text-brand-brown transition-colors px-2 py-2.5">
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
