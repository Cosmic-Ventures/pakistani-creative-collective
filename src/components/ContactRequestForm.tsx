"use client";

import { useActionState, useState } from "react";
import { submitContactRequest, type ContactRequestResult } from "@/lib/contact-request-action";
import { EXPERIENCE_LEVELS, REQUEST_TYPES, TIMELINES } from "@/lib/contact-request-constants";

const inputCls =
  "w-full bg-white border border-brand-green/20 rounded-lg px-4 py-2.5 text-brand-brown placeholder-brand-brown/40 focus:outline-none focus:border-brand-green text-sm";
const textareaCls = `${inputCls} resize-none`;

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
  const [requestType, setRequestType] = useState("");

  if (state && "success" in state) {
    return (
      <div className="bg-brand-mint text-brand-green rounded-2xl p-8 text-center">
        <p className="font-heading font-extrabold uppercase text-xl mb-2">
          Your request has been submitted.
        </p>
        <p className="text-brand-green/80 text-sm">
          You&apos;ll be notified for further communications.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-8">
      {state && "error" in state && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {state.error}
        </p>
      )}

      <div>
        <h2 className="font-heading font-extrabold uppercase text-brand-green border-b border-brand-green/15 pb-3 mb-5">
          About You
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-brand-brown/70 mb-1.5">Full Name *</label>
            <input name="requesterName" required className={inputCls} />
          </div>
          <div>
            <label className="block text-sm text-brand-brown/70 mb-1.5">Email Address *</label>
            <input name="requesterEmail" type="email" required className={inputCls} />
          </div>
          <div>
            <label className="block text-sm text-brand-brown/70 mb-1.5">Company (if applicable)</label>
            <input name="company" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm text-brand-brown/70 mb-1.5">Your Role/Title</label>
            <input name="requesterRole" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm text-brand-brown/70 mb-1.5">Portfolio Link</label>
            <input name="portfolioLink" type="url" className={inputCls} placeholder="https://…" />
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-heading font-extrabold uppercase text-brand-green border-b border-brand-green/15 pb-3 mb-2">
          Your Experience Level
        </h2>
        <p className="text-xs text-brand-brown/50 mb-4">
          Requests are only forwarded if your experience level matches the creative&apos;s stated
          collaboration preferences.
        </p>
        <div className="space-y-2">
          {EXPERIENCE_LEVELS.map((level) => (
            <label key={level} className="flex items-start gap-2.5 text-sm text-brand-brown/80 cursor-pointer">
              <input type="radio" name="experienceLevel" value={level} required className="accent-brand-green mt-0.5 shrink-0" />
              {level}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-heading font-extrabold uppercase text-brand-green border-b border-brand-green/15 pb-3 mb-4">
          Request Type
        </h2>
        <p className="text-xs text-brand-brown/50 mb-3">Select the option that best describes your request.</p>
        <div className="space-y-2 mb-4">
          {REQUEST_TYPES.map((type) => (
            <label key={type} className="flex items-start gap-2.5 text-sm text-brand-brown/80 cursor-pointer">
              <input
                type="radio"
                name="requestType"
                value={type}
                required
                className="accent-brand-green mt-0.5 shrink-0"
                onChange={() => setRequestType(type)}
              />
              {type === "Other" ? "Other (please specify)" : type}
            </label>
          ))}
        </div>
        {requestType === "Other" && (
          <input name="requestTypeOther" className={`${inputCls} mb-4`} placeholder="Please specify…" />
        )}
        <label className="block text-sm text-brand-brown/70 mb-1.5">
          Tell us why you&apos;re looking to connect to this individual.
        </label>
        <textarea
          name="message"
          required
          rows={4}
          className={textareaCls}
          placeholder="Include the creative's name if you have someone specific in mind, or describe the type of creative you're looking for, what the project involves, and what you need from them."
        />
      </div>

      <div>
        <h2 className="font-heading font-extrabold uppercase text-brand-green border-b border-brand-green/15 pb-3 mb-4">
          Timeline
        </h2>
        <p className="text-xs text-brand-brown/50 mb-3">Select the option that best suits your request.</p>
        <div className="space-y-2">
          {TIMELINES.map((t) => (
            <label key={t} className="flex items-start gap-2.5 text-sm text-brand-brown/80 cursor-pointer">
              <input type="radio" name="timeline" value={t} required className="accent-brand-green mt-0.5 shrink-0" />
              {t}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-heading font-extrabold uppercase text-brand-green border-b border-brand-green/15 pb-3 mb-4">
          Consent
        </h2>
        <p className="text-xs text-brand-brown/50 mb-3">Select all of the below.</p>
        <div className="space-y-3">
          <label className="flex items-start gap-2.5 text-sm text-brand-brown/80 cursor-pointer">
            <input type="checkbox" name="consentAccurate" required className="accent-brand-green mt-0.5 shrink-0" />
            I confirm that the information provided in this form is accurate.
          </label>
          <label className="flex items-start gap-2.5 text-sm text-brand-brown/80 cursor-pointer">
            <input type="checkbox" name="consentRouting" required className="accent-brand-green mt-0.5 shrink-0" />
            I understand that all contact is routed through Aneesa Talks LLC and that the creative&apos;s
            personal contact information will not be shared without their consent.
          </label>
          <label className="flex items-start gap-2.5 text-sm text-brand-brown/80 cursor-pointer">
            <input type="checkbox" name="consentDiscretion" required className="accent-brand-green mt-0.5 shrink-0" />
            I understand that Aneesa Talks LLC reserves the right to decline any request at their discretion.
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-brand-green hover:bg-brand-green/90 disabled:opacity-50 text-brand-cream font-semibold py-3 rounded-full transition-colors"
      >
        {pending ? "Submitting…" : "Submit Contact Request"}
      </button>
    </form>
  );
}
