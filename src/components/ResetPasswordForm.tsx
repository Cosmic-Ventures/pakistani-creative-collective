"use client";

import { useActionState, useState } from "react";
import { resetPasswordAction, type ResetActionResult } from "@/lib/password-reset-actions";
import { PASSWORD_HINT } from "@/lib/password-rules";

const inputCls =
  "w-full bg-white border border-brand-green/20 rounded-lg px-4 py-2.5 text-brand-brown placeholder-brand-brown/40 focus:outline-none focus:border-brand-green text-sm";

export default function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState<ResetActionResult | null, FormData>(
    resetPasswordAction,
    null
  );
  // Controlled, so a mismatch error doesn't wipe both boxes and make them start
  // over (AGENTS.md gotcha #6).
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      {state && "error" in state && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {state.error}
        </p>
      )}

      <div>
        <label className="block text-sm text-brand-brown/70 mb-1.5" htmlFor="password">
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputCls}
        />
        <p className="text-xs text-brand-brown/40 mt-1">{PASSWORD_HINT}</p>
      </div>

      <div>
        <label className="block text-sm text-brand-brown/70 mb-1.5" htmlFor="confirm">
          Confirm new password
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          required
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={inputCls}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-brand-green hover:bg-brand-green/90 disabled:opacity-50 text-brand-cream font-semibold py-3 rounded-full transition-colors"
      >
        {pending ? "Saving…" : "Set new password"}
      </button>
    </form>
  );
}
