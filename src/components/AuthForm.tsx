"use client";

import { useActionState } from "react";
import type { ActionResult } from "@/lib/auth-actions";
import { PASSWORD_HINT } from "@/lib/password-rules";

type Props = {
  mode: "signin" | "signup";
  action: (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;
  next?: string;
};

export default function AuthForm({ mode, action, next }: Props) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      {state && "error" in state && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {state.error}
        </p>
      )}

      {mode === "signup" && (
        <div>
          <label className="block text-sm text-brand-brown/70 mb-1.5" htmlFor="name">
            Full name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="name"
            className="w-full bg-white border border-brand-green/20 rounded-lg px-4 py-2.5 text-brand-brown placeholder-brand-brown/40 focus:outline-none focus:border-brand-green text-sm"
          />
        </div>
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
          className="w-full bg-white border border-brand-green/20 rounded-lg px-4 py-2.5 text-brand-brown placeholder-brand-brown/40 focus:outline-none focus:border-brand-green text-sm"
        />
      </div>

      <div>
        <label className="block text-sm text-brand-brown/70 mb-1.5" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          className="w-full bg-white border border-brand-green/20 rounded-lg px-4 py-2.5 text-brand-brown placeholder-brand-brown/40 focus:outline-none focus:border-brand-green text-sm"
        />
        {mode === "signup" && <p className="text-xs text-brand-brown/40 mt-1">{PASSWORD_HINT}</p>}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-brand-green hover:bg-brand-green/90 disabled:opacity-50 text-brand-cream font-semibold py-3 rounded-full transition-colors"
      >
        {pending
          ? mode === "signup"
            ? "Creating account…"
            : "Signing in…"
          : mode === "signup"
          ? "Create account"
          : "Sign in"}
      </button>
    </form>
  );
}
