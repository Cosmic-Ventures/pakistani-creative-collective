import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { db } from "@/lib/db";
import { createSession, getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Subscribed!" };

export default async function SubscribeSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; mock?: string }>;
}) {
  const { session_id, mock } = await searchParams;
  if (!session_id && !mock) redirect("/");

  const session = await getSession();
  if (!session) redirect("/auth/signin");

  // Verify the checkout session and update user role (skipped for the mocked dev-mode flow)
  if (session_id && isStripeConfigured) {
    try {
      const checkoutSession = await stripe.checkout.sessions.retrieve(session_id, {
        expand: ["subscription"],
      });

      if (checkoutSession.payment_status === "paid") {
        const sub = checkoutSession.subscription as unknown as { id: string; current_period_end: number; status: string };
        await db.user.update({
          where: { id: session.userId },
          data: {
            role: "PAID",
            stripeSubId: sub.id,
            subStatus: sub.status,
            subCurrentPeriodEnd: new Date(sub.current_period_end * 1000),
          },
        });
        // Re-issue session with updated role
        await createSession({ ...session, role: "PAID" });
      }
    } catch {
      // If verification fails, still show success (webhook will handle the rest)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-brand-mint/30 border border-brand-mint flex items-center justify-center text-3xl mx-auto mb-6">
          ✓
        </div>
        <h1 className="font-heading font-extrabold uppercase text-2xl text-brand-green mb-3">You&apos;re subscribed!</h1>
        <p className="text-brand-brown/70 mb-6 leading-relaxed">
          Welcome to the full Pakistani Creative Collective. You now have access to all profiles, search & filter, and contact requests.
        </p>
        {mock && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-300 rounded-lg px-3 py-2 mb-6 inline-block">
            Demo mode — payment was simulated. No real charge was made; connect Stripe to accept real payments.
          </p>
        )}
        <Link
          href="/directory"
          className="inline-block bg-brand-green hover:bg-brand-green/90 text-brand-cream font-semibold px-6 py-3 rounded-full transition-colors"
        >
          Browse the full directory →
        </Link>
      </div>
    </div>
  );
}
