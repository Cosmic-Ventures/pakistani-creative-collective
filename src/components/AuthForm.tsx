"use client";

import { useActionState } from "react";
import type { ActionResult } from "@/lib/auth-actions";

type Props = {
  mode: "signin" | "signup";
  action: (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;
};

export default function AuthForm({ mode, action }: Props) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-4">
      {state && "error" in state && (
        <p className="text-sm text-red-400 bg-red-950/40 border border-red-800 rounded-lg px-4 py-2">
          {state.error}
        </p>
      )}

      {mode === "signup" && (
        <div>
          <label className="block text-sm text-stone-400 mb-1.5" htmlFor="name">
            Full name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="name"
            className="w-full bg-stone-800 border border-stone-700 rounded-lg px-4 py-2.5 text-white placeholder-stone-500 focus:outline-none focus:border-emerald-600 text-sm"
          />
        </div>
      )}

      <div>
        <label className="block text-sm text-stone-400 mb-1.5" htmlFor="email">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full bg-stone-800 border border-stone-700 rounded-lg px-4 py-2.5 text-white placeholder-stone-500 focus:outline-none focus:border-emerald-600 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm text-stone-400 mb-1.5" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          className="w-full bg-stone-800 border border-stone-700 rounded-lg px-4 py-2.5 text-white placeholder-stone-500 focus:outline-none focus:border-emerald-600 text-sm"
        />
        {mode === "signup" && (
          <p className="text-xs text-stone-500 mt-1">
            At least 8 characters, one letter, one number.
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold py-3 rounded-full transition-colors"
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
