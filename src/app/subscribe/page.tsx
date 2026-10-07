import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { isStripeConfigured, getDisplayPrices } from "@/lib/stripe";
import { createCheckoutSession, simulatePayment } from "@/lib/subscribe-actions";
import { PricingCard } from "@/components/PricingCard";
import AccessComparison from "@/components/AccessComparison";

export const metadata: Metadata = { title: "Subscribe" };

export default async function SubscribePage() {
  const session = await getSession();
  if (!session) redirect("/auth/signup");
  // 09/01 round: "can we make the subscription tab visible for admin login at
  // least". Admins already have access, so subscribing is meaningless for them —
  // but bouncing them to /directory meant the client could never actually look
  // at the page she's selling. Admins get it read-only instead; paid members,
  // who have nothing to review, still get sent back.
  const isAdminPreview = session.role === "ADMIN";
  if (session.role === "PAID") redirect("/directory");

  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user) redirect("/auth/signin");

  const prices = await getDisplayPrices();

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-3xl">
        {isAdminPreview && (
          <div className="text-xs text-amber-800 bg-amber-50 border border-amber-300 rounded-lg px-4 py-2.5 mb-6 max-w-md mx-auto text-center">
            <strong>Admin preview.</strong> This is what a signed-in visitor without a
            subscription sees. Your account already has full access, so the subscribe
            button is disabled here.
          </div>
        )}
        <div className="text-center mb-8">
          <h1 className="font-heading font-bold text-2xl text-brand-green mb-2">Subscribe to PCC</h1>
          <p className="text-brand-brown/70 text-sm">
            Unlock full profiles, advanced search, and contact requests. Pick monthly or yearly
            billing — access is identical either way.
          </p>
        </div>

        <PricingCard
          isStripeConfigured={isStripeConfigured}
          prices={prices}
          monthlyAction={createCheckoutSession.bind(null, "monthly")}
          annualAction={createCheckoutSession.bind(null, "annual")}
          simulateAction={simulatePayment}
          preview={isAdminPreview}
        />

        {!isStripeConfigured && (
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-300 rounded-lg px-3 py-2 mb-6 max-w-md mx-auto text-center">
            Stripe not configured yet — this is a demo flow. Payment will be simulated.
          </div>
        )}

        <div className="mb-6">
          <p className="text-sm font-semibold text-brand-green mb-3 text-center">What&apos;s included</p>
          <AccessComparison />
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
