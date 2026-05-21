import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { createSession, getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Subscribed!" };

export default async function SubscribeSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  if (!session_id) redirect("/");

  const session = await getSession();
  if (!session) redirect("/auth/signin");

  // Verify the checkout session and update user role
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

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-900/60 border border-emerald-700 flex items-center justify-center text-3xl mx-auto mb-6">
          ✓
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">You're subscribed!</h1>
        <p className="text-stone-400 mb-6 leading-relaxed">
          Welcome to the full Pakistani Creative Collective. You now have access to all profiles, search & filter, and contact requests.
        </p>
        <Link
          href="/directory"
          className="inline-block bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-3 rounded-full transition-colors"
        >
          Browse the full directory →
        </Link>
      </div>
    </div>
  );
}
