import Stripe from "stripe";
import { unstable_cache } from "next/cache";

export const isStripeConfigured = !!process.env.STRIPE_SECRET_KEY;

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

// Price IDs — set these after creating products in your Stripe dashboard.
// Both plans grant identical PAID access; the only difference is billing cadence.
// The amounts themselves live on the Stripe Price objects, not here.
export const PRICE_MONTHLY = process.env.STRIPE_PRICE_MONTHLY ?? "";
export const PRICE_ANNUAL = process.env.STRIPE_PRICE_ANNUAL ?? "";

export type DisplayPrices = {
  monthly: string;
  annual: string;
  /** Percentage saved by paying yearly, or null when it can't be computed. */
  annualSavingPercent: number | null;
};

/**
 * Shown when Stripe isn't configured (the pre-launch demo mode) or a price
 * lookup fails. These are the only hard-coded amounts left in the app and they
 * are a fallback, not the source of truth — keep them in step with the live
 * Stripe Prices so a degraded render doesn't advertise something different.
 */
export const FALLBACK_PRICES: DisplayPrices = {
  monthly: "$7.99",
  annual: "$80",
  annualSavingPercent: 17,
};

function formatAmount(unitAmount: number | null, currency: string): string | null {
  if (unitAmount == null) return null;
  const major = unitAmount / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    // Whole amounts read better without the trailing ".00" ($80, not $80.00).
    minimumFractionDigits: Number.isInteger(major) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(major);
}

/**
 * The prices to display, read from Stripe itself.
 *
 * Every price shown to a user comes from here, so the page can't advertise one
 * amount while checkout charges another — the two are set in completely
 * different places (this app's copy vs. the Stripe Price behind
 * STRIPE_PRICE_MONTHLY), and Stripe Prices are immutable, so changing an amount
 * always means pointing at a new Price ID. Reading it back is the only way the
 * two stay honest.
 *
 * Cached for an hour: prices change roughly never, and this is called from
 * several pages that would otherwise hit the Stripe API on every render.
 * A failed lookup degrades to FALLBACK_PRICES rather than breaking the page.
 */
export const getDisplayPrices = unstable_cache(
  async (): Promise<DisplayPrices> => {
    if (!isStripeConfigured || !PRICE_MONTHLY || !PRICE_ANNUAL) return FALLBACK_PRICES;

    try {
      const client = getStripe();
      const [monthly, annual] = await Promise.all([
        client.prices.retrieve(PRICE_MONTHLY),
        client.prices.retrieve(PRICE_ANNUAL),
      ]);

      const monthlyLabel = formatAmount(monthly.unit_amount, monthly.currency);
      const annualLabel = formatAmount(annual.unit_amount, annual.currency);

      const saving =
        monthly.unit_amount && annual.unit_amount
          ? Math.round((1 - annual.unit_amount / (monthly.unit_amount * 12)) * 100)
          : null;

      return {
        monthly: monthlyLabel ?? FALLBACK_PRICES.monthly,
        annual: annualLabel ?? FALLBACK_PRICES.annual,
        annualSavingPercent: saving && saving > 0 ? saving : null,
      };
    } catch (err) {
      console.error("Could not read prices from Stripe — showing fallback amounts.", err);
      return FALLBACK_PRICES;
    }
  },
  ["stripe-display-prices"],
  { revalidate: 3600, tags: ["stripe-prices"] }
);
