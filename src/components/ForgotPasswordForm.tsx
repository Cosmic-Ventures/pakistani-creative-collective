"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { requestPasswordResetAction, type ResetActionResult } from "@/lib/password-reset-actions";

const inputCls =
  "w-full bg-white border border-brand-green/20 rounded-lg px-4 py-2.5 text-brand-brown placeholder-brand-brown/40 focus:outline-none focus:border-brand-green text-sm";

export default function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState<ResetActionResult | null, FormData>(
    requestPasswordResetAction,
    null
  );
  // Controlled so a validation error doesn't clear what they typed
  // (AGENTS.md gotcha #6).
  const [email, setEmail] = useState("");

  if (state && "sent" in state) {
    return (
      <div className="text-sm text-brand-brown/80 bg-brand-mint/20 border border-brand-mint rounded-lg px-4 py-4">
        <p className="font-semibold text-brand-green mb-1">Check your inbox</p>
        <p>
          If there&apos;s a PCC account for that address, a link to set a new password is on its
          way. It expires in an hour.
        </p>
        <p className="mt-3 text-brand-brown/60">
          Didn&apos;t get it? Check your spam folder, or{" "}
          <Link href="/auth/forgot" className="text-brand-green hover:text-brand-green/70">
            try again
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state && "error" in state && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {state.error}
        </p>
      )}

      <div>
        <label className="block text-sm text-brand-brown/70 mb-1.5" htmlFor="email">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputCls}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-brand-green hover:bg-brand-green/90 disabled:opacity-50 text-brand-cream font-semibold py-3 rounded-full transition-colors"
      >
        {pending ? "Sending…" : "Email me a reset link"}
      </button>
    </form>
  );
}
