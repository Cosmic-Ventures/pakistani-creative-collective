"use client";

import { useActionState, useState } from "react";
import { submitSupportRequest, type SupportResult } from "@/lib/support-actions";
import { SUPPORT_KINDS } from "@/lib/support-constants";
import { withSubmitFallback } from "@/lib/submit-fallback";

const inputCls =
  "w-full bg-white border border-brand-green/20 rounded-lg px-4 py-2.5 text-brand-brown focus:outline-none focus:border-brand-green text-sm";

export default function SupportForm() {
  const [state, formAction, pending] = useActionState<SupportResult, FormData>(
    withSubmitFallback<SupportResult>(
      submitSupportRequest,
      { error: "We couldn't reach the server. Nothing you typed was lost. Check your connection and try again." },
      "support"
    ),
    null
  );
  // Controlled so a failed submit doesn't wipe the message (AGENTS.md gotcha #6).
  const [kind, setKind] = useState<string>(SUPPORT_KINDS[0]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  if (state && "success" in state) {
    return (
      <div className="bg-brand-mint/20 border border-brand-mint rounded-2xl p-6 text-sm text-brand-green">
        <p className="font-semibold mb-1">Thanks, your message is on its way.</p>
        <p>The PCC team will reply to the email on your account.</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="bg-white border border-brand-green/10 rounded-2xl p-6 space-y-4">
      <p className="text-sm text-brand-brown/70">
        Leave a comment or file an inquiry. It goes straight to the PCC admins, who&apos;ll reply by email.
      </p>
      {state && "error" in state && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{state.error}</p>
      )}
      <label className="block text-sm font-semibold text-brand-green">
        What is this about?
        <select name="kind" value={kind} onChange={(e) => setKind(e.target.value)} className={`${inputCls} mt-1 font-normal`}>
          {SUPPORT_KINDS.map((k) => (
            <option key={k}>{k}</option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-semibold text-brand-green">
        Subject
        <input name="subject" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={150} className={`${inputCls} mt-1 font-normal`} />
      </label>
      <label className="block text-sm font-semibold text-brand-green">
        Message
        <textarea name="message" value={message} onChange={(e) => setMessage(e.target.value)} rows={6} maxLength={5000} className={`${inputCls} mt-1 font-normal resize-none`} />
      </label>
      <button
        disabled={pending}
        className="bg-brand-green hover:bg-brand-green/90 disabled:opacity-50 text-brand-cream font-semibold px-6 py-2.5 rounded-full transition-colors text-sm"
      >
        {pending ? "Sending…" : "Send to PCC team"}
      </button>
    </form>
  );
}
