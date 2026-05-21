"use client";

import { useActionState } from "react";
import { submitContactRequest, type ContactRequestResult } from "@/lib/contact-request-action";

export default function ContactRequestForm({
  creativeId,
  creativeSlug,
  userId,
}: {
  creativeId: string;
  creativeSlug: string;
  userId: string;
}) {
  const action = submitContactRequest.bind(null, creativeId, userId, creativeSlug);
  const [state, formAction, pending] = useActionState<ContactRequestResult | null, FormData>(action, null);

  if (state && "success" in state) {
    return (
      <div className="bg-emerald-950/40 border border-emerald-800 rounded-xl p-6 text-center">
        <p className="text-emerald-400 font-medium mb-2">Request submitted!</p>
        <p className="text-stone-400 text-sm">
          Aneesa Talks will review your request and be in touch. Typical turnaround is 2–3 business days.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      {state && "error" in state && (
        <p className="text-sm text-red-400 bg-red-950/40 border border-red-800 rounded-lg px-4 py-2">
          {state.error}
        </p>
      )}

      <div>
        <label className="block text-sm text-stone-400 mb-1.5">Your Organization / Name *</label>
        <input
          name="organization"
          required
          className="w-full bg-stone-800 border border-stone-700 rounded-lg px-4 py-2.5 text-white placeholder-stone-500 focus:outline-none focus:border-emerald-600 text-sm"
          placeholder="Production company, studio, or your name"
        />
      </div>

      <div>
        <label className="block text-sm text-stone-400 mb-1.5">Project Description *</label>
        <textarea
          name="projectDesc"
          required
          rows={4}
          className="w-full bg-stone-800 border border-stone-700 rounded-lg px-4 py-2.5 text-white placeholder-stone-500 focus:outline-none focus:border-emerald-600 text-sm resize-none"
          placeholder="Brief description of your project, timeline, and budget range"
        />
      </div>

      <div>
        <label className="block text-sm text-stone-400 mb-1.5">What are you looking for? *</label>
        <textarea
          name="lookingFor"
          required
          rows={3}
          className="w-full bg-stone-800 border border-stone-700 rounded-lg px-4 py-2.5 text-white placeholder-stone-500 focus:outline-none focus:border-emerald-600 text-sm resize-none"
          placeholder="Specific role, skills, availability needed…"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold py-3 rounded-full transition-colors"
      >
        {pending ? "Submitting…" : "Submit Contact Request"}
      </button>

      <p className="text-xs text-stone-600 text-center">
        Your contact details will not be shared with the creative without their consent.
      </p>
    </form>
  );
}
