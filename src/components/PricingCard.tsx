"use client";

import { useState } from "react";
import type { DisplayPrices } from "@/lib/stripe";

type Plan = "monthly" | "annual";

export function PricingCard({
  isStripeConfigured,
  prices,
  monthlyAction,
  annualAction,
  simulateAction,
  preview = false,
}: {
  isStripeConfigured: boolean;
  // Read from Stripe by the server component that renders this — never
  // hard-coded here, so the advertised amount is the amount checkout charges.
  prices: DisplayPrices;
  monthlyAction: () => Promise<void>;
  annualAction: () => Promise<void>;
  simulateAction: () => Promise<void>;
  /**
   * Admins are shown this page so they can review it before launch, but they
   * already have full access — the plan toggle and pricing stay live, the
   * purchase button does not, so a review click can't open a checkout session
   * or (in mock mode) rewrite their own role.
   */
  preview?: boolean;
}) {
  const [plan, setPlan] = useState<Plan>("annual");

  const action = isStripeConfigured ? (plan === "monthly" ? monthlyAction : annualAction) : simulateAction;

  return (
    <div className="bg-white border border-brand-green/10 rounded-2xl p-6 max-w-md mx-auto mb-6">
      <div className="flex justify-center mb-6">
        <div className="inline-flex bg-brand-green/5 rounded-full p-1">
          <button
            type="button"
            onClick={() => setPlan("monthly")}
            aria-pressed={plan === "monthly"}
            className={`px-5 py-2 rounded-full text-sm font-semibold uppercase transition-colors ${
              plan === "monthly" ? "bg-brand-green text-brand-cream" : "text-brand-brown/60"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setPlan("annual")}
            aria-pressed={plan === "annual"}
            className={`relative px-5 py-2 rounded-full text-sm font-semibold uppercase transition-colors ${
              plan === "annual" ? "bg-brand-green text-brand-cream" : "text-brand-brown/60"
            }`}
          >
            Yearly
            {prices.annualSavingPercent !== null && (
              <span className="absolute -top-3 -right-2 text-[10px] bg-brand-mint text-brand-green font-semibold px-2 py-0.5 rounded-full">
                Save ~{prices.annualSavingPercent}%
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="text-center mb-6">
        <div className="flex items-end justify-center gap-2">
          <span className="text-5xl font-bold text-brand-green">{plan === "monthly" ? prices.monthly : prices.annual}</span>
          <span className="text-brand-brown/60 text-sm mb-1.5">{plan === "monthly" ? "/month" : "/year"}</span>
        </div>
        {plan === "annual" && <p className="text-xs text-brand-brown/50 mt-1">Billed once a year</p>}
      </div>

      {preview ? (
        <button
          type="button"
          disabled
          className="w-full bg-brand-green/40 text-brand-cream font-semibold py-3 rounded-full cursor-not-allowed"
        >
          {isStripeConfigured ? `Subscribe ${plan === "monthly" ? "monthly" : "annually"} →` : "Simulate payment (demo)"}
        </button>
      ) : (
        <form action={action}>
          <button
            type="submit"
            className="w-full bg-brand-green hover:bg-brand-green/90 text-brand-cream font-semibold py-3 rounded-full transition-colors"
          >
            {isStripeConfigured ? `Subscribe ${plan === "monthly" ? "monthly" : "annually"} →` : "Simulate payment (demo)"}
          </button>
        </form>
      )}
    </div>
  );
}
