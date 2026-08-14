"use client";

import { useActionState, useState } from "react";
import { unlockSite, type GateResult } from "@/lib/gate-actions";

export function GateForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState<GateResult, FormData>(unlockSite, undefined);
  // Controlled, so a wrong password doesn't wipe what was typed when
  // useActionState re-renders the form (AGENTS.md gotcha #6).
  const [password, setPassword] = useState("");

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="next" value={next ?? "/enroll"} />
      <input
        name="password"
        type="password"
        autoFocus
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        aria-label="Site password"
        className="w-full bg-brand-cream/95 border border-brand-cream/30 rounded-full px-6 py-3 text-black placeholder-black/40 text-center focus:outline-none focus:border-brand-cream"
      />
      {state && "error" in state && (
        <p className="text-sm text-red-200 bg-red-900/40 border border-red-400/40 rounded-lg px-4 py-2">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-brand-cream hover:bg-white disabled:opacity-60 text-brand-green font-semibold px-6 py-3 rounded-full transition-colors"
      >
        {pending ? "Checking…" : "Continue to the application →"}
      </button>
    </form>
  );
}
