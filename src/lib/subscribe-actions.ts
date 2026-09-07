"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "./db";
import { getSession, createSession } from "./session";
import { stripe, PRICE_MONTHLY, PRICE_ANNUAL } from "./stripe";

/**
 * Nobody who already has access has any business starting a checkout. The
 * subscribe page renders for admins now (so the client can review it) with the
 * button disabled, but a disabled button is styling — this is the check that
 * holds, and it also covers a PAID member replaying the POST.
 */
function alreadyHasAccess(role: string): boolean {
  return role === "PAID" || role === "ADMIN";
}

export async function createCheckoutSession(plan: "monthly" | "annual") {
  const session = await getSession();
  if (!session || alreadyHasAccess(session.role)) return;
  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user) return;

  const priceId = plan === "monthly" ? PRICE_MONTHLY : PRICE_ANNUAL;

  let customerId = user.stripeCustomerId ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email, name: user.name ?? undefined });
    customerId = customer.id;
    await db.user.update({ where: { id: user.id }, data: { stripeCustomerId: customer.id } });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscribe`,
    metadata: { userId: user.id },
  });

  redirect(checkoutSession.url!);
}

// Used in place of createCheckoutSession when Stripe isn't configured yet (pre-launch / no API keys).
export async function simulatePayment() {
  const session = await getSession();
  // An admin running this would write role: "PAID" over their own ADMIN role and
  // lock themselves out of the admin panel — the one way this demo shortcut can
  // do real damage, and reachable the moment the page renders for them.
  if (!session || alreadyHasAccess(session.role)) return;
  await db.user.update({
    where: { id: session.userId },
    data: { role: "PAID", subStatus: "active" },
  });
  await createSession({ ...session, role: "PAID" });
  // The role change adds the Community/Account tabs, so the cached root layout
  // has to be dropped or the nav keeps showing the unpaid one (see
  // refreshLayout in auth-actions.ts).
  revalidatePath("/", "layout");
  redirect("/subscribe/success?mock=1");
}

export async function manageSubscriptionPortal() {
  const session = await getSession();
  if (!session) return;
  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user?.stripeCustomerId) return;

  const portal = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/account`,
  });
  redirect(portal.url);
}
