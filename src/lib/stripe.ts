import Stripe from "stripe";

// Lazy initialization to avoid build-time errors when env vars aren't set
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-04-22.dahlia",
    });
  }
  return _stripe;
}

// Convenience export — use getStripe() at call-site in server actions / route handlers
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

// Price IDs — set these after creating products in your Stripe dashboard
export const PRICE_EARLY = process.env.STRIPE_PRICE_EARLY ?? "";    // $30/year
export const PRICE_STANDARD = process.env.STRIPE_PRICE_STANDARD ?? ""; // $50/year
