import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import type Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 });
  }

  switch (event.type) {
    case "customer.subscription.updated":
    case "customer.subscription.created": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;
      const isActive = sub.status === "active" || sub.status === "trialing";

      await db.user.updateMany({
        where: { stripeCustomerId: customerId },
        data: {
          role: isActive ? "PAID" : "UNPAID",
          stripeSubId: sub.id,
          subStatus: sub.status,
          subCurrentPeriodEnd: new Date((sub as unknown as { current_period_end: number }).current_period_end * 1000),
        },
      });
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;
      await db.user.updateMany({
        where: { stripeCustomerId: customerId },
        data: { role: "UNPAID", subStatus: "canceled" },
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
