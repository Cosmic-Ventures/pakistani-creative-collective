import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { stripe, PRICE_EARLY, PRICE_STANDARD } from "@/lib/stripe";

export const metadata: Metadata = { title: "Subscribe" };

export default async function SubscribePage() {
  const session = await getSession();
  if (!session) redirect("/auth/signup");
  if (session.role === "PAID" || session.role === "ADMIN") redirect("/directory");

  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user) redirect("/auth/signin");

  const priceId = user.earlyAccess ? PRICE_EARLY : PRICE_STANDARD;
  const amount = user.earlyAccess ? 30 : 50;

  async function checkout() {
    "use server";
    const sess = await getSession();
    if (!sess) return;
    const u = await db.user.findUnique({ where: { id: sess.userId } });
    if (!u) return;

    const pid = u.earlyAccess ? PRICE_EARLY : PRICE_STANDARD;

    let customerId = u.stripeCustomerId ?? undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: u.email, name: u.name ?? undefined });
      customerId = customer.id;
      await db.user.update({ where: { id: u.id }, data: { stripeCustomerId: customer.id } });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: pid, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscribe`,
      metadata: { userId: u.id },
    });

    redirect(checkoutSession.url!);
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-white mb-2">Subscribe to PCC</h1>
        <p className="text-stone-400 text-sm mb-8">
          Unlock full profiles, search & filter, and contact requests.
        </p>

        <div className={`bg-stone-900 border rounded-2xl p-6 mb-6 ${user.earlyAccess ? "border-emerald-700/60" : "border-stone-800"}`}>
          {user.earlyAccess && (
            <span className="inline-block text-xs bg-emerald-900/60 border border-emerald-700 text-emerald-400 px-2 py-0.5 rounded-full mb-3">
              Early access rate
            </span>
          )}
          <div className="flex items-end gap-2 mb-4">
            <span className="text-4xl font-bold text-white">${amount}</span>
            <span className="text-stone-400 text-sm mb-1">/year</span>
            {user.earlyAccess && (
              <span className="text-stone-500 text-xs mb-1 line-through ml-1">$50</span>
            )}
          </div>
          <ul className="space-y-2 text-sm text-stone-300 mb-6">
            {[
              "Full creative profiles including headshots",
              "Search & filter by role, level, availability, language",
              "Submit contact requests — routed through Aneesa Talks",
              "Rate information (where creatives opt in)",
              "All social and portfolio links",
            ].map((f) => (
              <li key={f} className="flex items-start gap-2">
                <span className="text-emerald-400 shrink-0">✓</span> {f}
              </li>
            ))}
          </ul>
          {user.earlyAccess && (
            <p className="text-xs text-stone-500 mb-4">
              Early access rate applies to your first year only. Renewals are $50/year.
            </p>
          )}
          <form action={checkout}>
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-full transition-colors"
            >
              Subscribe for ${amount}/year →
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-stone-600">
          Payments processed securely by Stripe. Cancel anytime.
        </p>
        <p className="text-center text-xs text-stone-600 mt-1">
          Are you a creative?{" "}
          <Link href="/enroll" className="text-stone-500 hover:text-stone-400">
            Apply to join the database (free)
          </Link>
        </p>
      </div>
    </div>
  );
}
