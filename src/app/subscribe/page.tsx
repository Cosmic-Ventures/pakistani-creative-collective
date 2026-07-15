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

  const features = [
    "Full creative profiles including headshots",
    "Search & filter by role, level, availability, language",
    "Submit contact requests — routed through Aneesa Talks",
    "Rate information (where creatives opt in)",
    "All social and portfolio links",
  ];

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="font-heading font-bold text-2xl text-brand-green mb-2">Subscribe to PCC</h1>
          <p className="text-brand-brown/70 text-sm">
            Unlock full profiles, search & filter, and contact requests. Both plans include the
            exact same access — pick whichever billing works for you.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
          <div className="bg-white border border-brand-green/10 rounded-2xl p-6">
            <p className="text-sm text-brand-brown/60 mb-1">Monthly</p>
            <div className="flex items-end gap-2 mb-4">
              <span className="text-4xl font-bold text-brand-green">$7.86</span>
              <span className="text-brand-brown/60 text-sm mb-1">/month</span>
            </div>
            {isStripeConfigured ? (
              <form action={createCheckoutSession.bind(null, "monthly")}>
                <button
                  type="submit"
                  className="w-full bg-brand-green hover:bg-brand-green/90 text-brand-cream font-semibold py-3 rounded-full transition-colors"
                >
                  Subscribe monthly →
                </button>
              </form>
            ) : (
              <form action={simulatePayment}>
                <button
                  type="submit"
                  className="w-full bg-brand-green hover:bg-brand-green/90 text-brand-cream font-semibold py-3 rounded-full transition-colors"
                >
                  Simulate payment (demo)
                </button>
              </form>
            )}
          </div>

          <div className="bg-white border border-brand-mint rounded-2xl p-6 relative">
            <span className="absolute -top-3 right-6 text-xs bg-brand-mint text-brand-green font-semibold px-2.5 py-0.5 rounded-full">
              Save ~15%
            </span>
            <p className="text-sm text-brand-brown/60 mb-1">Annual</p>
            <div className="flex items-end gap-2 mb-4">
              <span className="text-4xl font-bold text-brand-green">$80</span>
              <span className="text-brand-brown/60 text-sm mb-1">/year</span>
            </div>
            {isStripeConfigured ? (
              <form action={createCheckoutSession.bind(null, "annual")}>
                <button
                  type="submit"
                  className="w-full bg-brand-green hover:bg-brand-green/90 text-brand-cream font-semibold py-3 rounded-full transition-colors"
                >
                  Subscribe annually →
                </button>
              </form>
            ) : (
              <form action={simulatePayment}>
                <button
                  type="submit"
                  className="w-full bg-brand-green hover:bg-brand-green/90 text-brand-cream font-semibold py-3 rounded-full transition-colors"
                >
                  Simulate payment (demo)
                </button>
              </form>
            )}
          </div>
        </div>

        {!isStripeConfigured && (
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-300 rounded-lg px-3 py-2 mb-6 max-w-md mx-auto text-center">
            Stripe not configured yet — this is a demo flow. Payment will be simulated.
          </div>
        )}

        <div className="bg-brand-green/5 border border-brand-green/10 rounded-2xl p-6 max-w-md mx-auto mb-6">
          <p className="text-sm font-semibold text-brand-green mb-3">Every plan includes</p>
          <ul className="space-y-2 text-sm text-brand-brown/80">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <span className="text-brand-green shrink-0">✓</span> {f}
              </li>
            ))}
          </ul>
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
