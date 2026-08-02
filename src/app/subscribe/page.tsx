import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { isStripeConfigured } from "@/lib/stripe";
import { createCheckoutSession, simulatePayment } from "@/lib/subscribe-actions";
import { PricingCard } from "@/components/PricingCard";

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
    "Access to the private Community Dashboard",
  ];

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="font-heading font-bold text-2xl text-brand-green mb-2">Subscribe to PCC</h1>
          <p className="text-brand-brown/70 text-sm">
            Unlock full profiles, search & filter, and contact requests. Pick monthly or yearly
            billing — access is identical either way.
          </p>
        </div>

        <PricingCard
          isStripeConfigured={isStripeConfigured}
          monthlyAction={createCheckoutSession.bind(null, "monthly")}
          annualAction={createCheckoutSession.bind(null, "annual")}
          simulateAction={simulatePayment}
        />

        {!isStripeConfigured && (
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-300 rounded-lg px-3 py-2 mb-6 max-w-md mx-auto text-center">
            Stripe not configured yet — this is a demo flow. Payment will be simulated.
          </div>
        )}

        <div className="bg-brand-green/5 border border-brand-green/10 rounded-2xl p-6 max-w-md mx-auto mb-6">
          <p className="text-sm font-semibold text-brand-green mb-3">What's included</p>
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
