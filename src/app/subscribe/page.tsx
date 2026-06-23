import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { isStripeConfigured } from "@/lib/stripe";
import { createCheckoutSession, simulatePayment } from "@/lib/subscribe-actions";

export const metadata: Metadata = { title: "Subscribe" };

export default async function SubscribePage() {
  const session = await getSession();
  if (!session) redirect("/auth/signup");
  if (session.role === "PAID" || session.role === "ADMIN") redirect("/directory");

  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user) redirect("/auth/signin");

  const amount = user.earlyAccess ? 30 : 50;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <h1 className="font-heading font-extrabold uppercase text-2xl text-brand-green mb-2">Subscribe to PCC</h1>
        <p className="text-brand-brown/70 text-sm mb-8">
          Unlock full profiles, search & filter, and contact requests.
        </p>

        <div className={`bg-white border rounded-2xl p-6 mb-6 ${user.earlyAccess ? "border-brand-mint" : "border-brand-green/10"}`}>
          {user.earlyAccess && (
            <span className="inline-block text-xs bg-brand-mint/30 border border-brand-mint text-brand-green px-2 py-0.5 rounded-full mb-3">
              Early access rate
            </span>
          )}
          <div className="flex items-end gap-2 mb-4">
            <span className="text-4xl font-bold text-brand-green">${amount}</span>
            <span className="text-brand-brown/60 text-sm mb-1">/year</span>
            {user.earlyAccess && (
              <span className="text-brand-brown/40 text-xs mb-1 line-through ml-1">$50</span>
            )}
          </div>
          <ul className="space-y-2 text-sm text-brand-brown/80 mb-6">
            {[
              "Full creative profiles including headshots",
              "Search & filter by role, level, availability, language",
              "Submit contact requests — routed through Aneesa Talks",
              "Rate information (where creatives opt in)",
              "All social and portfolio links",
            ].map((f) => (
              <li key={f} className="flex items-start gap-2">
                <span className="text-brand-green shrink-0">✓</span> {f}
              </li>
            ))}
          </ul>
          {user.earlyAccess && (
            <p className="text-xs text-brand-brown/50 mb-4">
              Early access rate applies to your first year only. Renewals are $50/year.
            </p>
          )}
          {isStripeConfigured ? (
            <form action={createCheckoutSession}>
              <button
                type="submit"
                className="w-full bg-brand-green hover:bg-brand-green/90 text-brand-cream font-semibold py-3 rounded-full transition-colors"
              >
                Subscribe for ${amount}/year →
              </button>
            </form>
          ) : (
            <div>
              <div className="text-xs text-amber-700 bg-amber-50 border border-amber-300 rounded-lg px-3 py-2 mb-3">
                Stripe not configured yet — this is a demo flow. Payment will be simulated.
              </div>
              <form action={simulatePayment}>
                <button
                  type="submit"
                  className="w-full bg-brand-green hover:bg-brand-green/90 text-brand-cream font-semibold py-3 rounded-full transition-colors"
                >
                  Simulate payment (demo)
                </button>
              </form>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-brand-brown/40">
          Payments processed securely by Stripe. Cancel anytime.
        </p>
        <p className="text-center text-xs text-brand-brown/40 mt-1">
          Are you a creative?{" "}
          <Link href="/enroll" className="text-brand-brown/60 hover:text-brand-brown">
            Apply to join the database (free)
          </Link>
        </p>
      </div>
    </div>
  );
}
