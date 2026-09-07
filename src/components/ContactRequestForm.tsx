"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import { submitContactRequest, type ContactRequestResult } from "@/lib/contact-request-action";
import { EXPERIENCE_LEVELS, REQUEST_TYPES, TIMELINES } from "@/lib/contact-request-constants";

const inputCls =
  "w-full bg-white border border-brand-green/20 rounded-lg px-4 py-2.5 text-brand-brown placeholder-brand-brown/40 focus:outline-none focus:border-brand-green text-sm";
const textareaCls = `${inputCls} resize-none`;

// Stable DOM id for a radio option, so the label's htmlFor gives every option
// an unambiguous accessible name (implicit label-wrapping alone proved flaky
// in accessibility-tree extraction for some of the longer option strings).
const optionId = (group: string, value: string) =>
  `${group}-${value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;

export default function ContactRequestForm({ creativeId }: { creativeId: string }) {
  // Only the creative's id is bound. The requester's identity is read from the
  // session inside the action — a bound argument round-trips through the
  // browser, so it can never be trusted to say who is asking.
  const action = submitContactRequest.bind(null, creativeId);
  const [state, formAction, pending] = useActionState<ContactRequestResult | null, FormData>(action, null);

  // Controlled by local state so values survive a failed submission — see
  // the identical fix (and root-cause explanation) in EnrollForm.tsx.
  const [requesterName, setRequesterName] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [company, setCompany] = useState("");
  const [requesterRole, setRequesterRole] = useState("");
  const [portfolioLink, setPortfolioLink] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [requestType, setRequestType] = useState("");
  const [requestTypeOther, setRequestTypeOther] = useState("");
  const [message, setMessage] = useState("");
  const [timeline, setTimeline] = useState("");
  const [consentAccurate, setConsentAccurate] = useState(false);
  const [consentRouting, setConsentRouting] = useState(false);
  const [consentDiscretion, setConsentDiscretion] = useState(false);

  if (state && "success" in state) {
    return (
      <div className="bg-brand-mint text-brand-green rounded-3xl p-10 sm:p-12 text-center">
        <p className="font-heading font-bold text-2xl sm:text-3xl leading-tight mb-3">
          Your request has been submitted.
        </p>
        <p className="text-brand-green/80 italic mb-8">
          You&apos;ll be notified for further communications.
        </p>
        <Image
          src="/brand/aneesa-talks-logo.png"
          alt="Aneesa Talks"
          width={1317}
          height={208}
          className="h-6 w-auto mx-auto"
        />
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
        <h2 className="font-heading font-bold text-brand-green border-b border-brand-green/15 pb-3 mb-5">
          About You
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-brand-brown/70 mb-1.5">Full Name *</label>
            <input name="requesterName" required value={requesterName} onChange={(e) => setRequesterName(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm text-brand-brown/70 mb-1.5">Email Address *</label>
            <input name="requesterEmail" type="email" required value={requesterEmail} onChange={(e) => setRequesterEmail(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm text-brand-brown/70 mb-1.5">Company (if applicable)</label>
            <input name="company" value={company} onChange={(e) => setCompany(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm text-brand-brown/70 mb-1.5">Your Role/Title</label>
            <input name="requesterRole" value={requesterRole} onChange={(e) => setRequesterRole(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm text-brand-brown/70 mb-1.5">Portfolio Link</label>
            <input name="portfolioLink" type="url" value={portfolioLink} onChange={(e) => setPortfolioLink(e.target.value)} className={inputCls} placeholder="https://…" />
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-heading font-bold text-brand-green border-b border-brand-green/15 pb-3 mb-2">
          Your Experience Level
        </h2>
        <p className="text-xs text-brand-brown/50 mb-4">
          Requests are only forwarded if your experience level matches the creative&apos;s stated
          collaboration preferences.
        </p>
        <div className="space-y-2">
          {EXPERIENCE_LEVELS.map((level) => (
            <label key={level} htmlFor={optionId("experienceLevel", level)} className="flex items-start gap-2.5 text-sm text-brand-brown/80 cursor-pointer">
              <input
                type="radio"
                id={optionId("experienceLevel", level)}
                name="experienceLevel"
                value={level}
                required
                checked={experienceLevel === level}
                onChange={() => setExperienceLevel(level)}
                className="accent-brand-green mt-0.5 shrink-0"
              />
              {level}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-heading font-bold text-brand-green border-b border-brand-green/15 pb-3 mb-4">
          Request Type
        </h2>
        <p className="text-xs text-brand-brown/50 mb-3">Select the option that best describes your request.</p>
        <div className="space-y-2 mb-4">
          {REQUEST_TYPES.map((type) => (
            <label key={type} htmlFor={optionId("requestType", type)} className="flex items-start gap-2.5 text-sm text-brand-brown/80 cursor-pointer">
              <input
                type="radio"
                id={optionId("requestType", type)}
                name="requestType"
                value={type}
                required
                checked={requestType === type}
                className="accent-brand-green mt-0.5 shrink-0"
                onChange={() => setRequestType(type)}
              />
              {type === "Other" ? "Other (please specify)" : type}
            </label>
          ))}
        </div>
        {requestType === "Other" && (
          <input
            name="requestTypeOther"
            value={requestTypeOther}
            onChange={(e) => setRequestTypeOther(e.target.value)}
            className={`${inputCls} mb-4`}
            placeholder="Please specify…"
          />
        )}
        <label className="block text-sm text-brand-brown/70 mb-1.5">
          Tell us why you&apos;re looking to connect to this individual.
        </label>
        <textarea
          name="message"
          required
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={textareaCls}
          placeholder="Include the creative's name if you have someone specific in mind, or describe the type of creative you're looking for, what the project involves, and what you need from them."
        />
      </div>

      <div>
        <h2 className="font-heading font-bold text-brand-green border-b border-brand-green/15 pb-3 mb-4">
          Timeline
        </h2>
        <p className="text-xs text-brand-brown/50 mb-3">Select the option that best suits your request.</p>
        <div className="space-y-2">
          {TIMELINES.map((t) => (
            <label key={t} htmlFor={optionId("timeline", t)} className="flex items-start gap-2.5 text-sm text-brand-brown/80 cursor-pointer">
              <input
                type="radio"
                id={optionId("timeline", t)}
                name="timeline"
                value={t}
                required
                checked={timeline === t}
                onChange={() => setTimeline(t)}
                className="accent-brand-green mt-0.5 shrink-0"
              />
              {t}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-heading font-bold text-brand-green border-b border-brand-green/15 pb-3 mb-4">
          Consent
        </h2>
        <p className="text-xs text-brand-brown/50 mb-3">Select all of the below.</p>
        <div className="space-y-3">
          <label className="flex items-start gap-2.5 text-sm text-brand-brown/80 cursor-pointer">
            <input
              type="checkbox"
              name="consentAccurate"
              required
              checked={consentAccurate}
              onChange={(e) => setConsentAccurate(e.target.checked)}
              className="accent-brand-green mt-0.5 shrink-0"
            />
            I confirm that the information provided in this form is accurate.
          </label>
          <label className="flex items-start gap-2.5 text-sm text-brand-brown/80 cursor-pointer">
            <input
              type="checkbox"
              name="consentRouting"
              required
              checked={consentRouting}
              onChange={(e) => setConsentRouting(e.target.checked)}
              className="accent-brand-green mt-0.5 shrink-0"
            />
            I understand that all contact is routed through Aneesa Talks LLC and that the creative&apos;s
            personal contact information will not be shared without their consent.
          </label>
          <label className="flex items-start gap-2.5 text-sm text-brand-brown/80 cursor-pointer">
            <input
              type="checkbox"
              name="consentDiscretion"
              required
              checked={consentDiscretion}
              onChange={(e) => setConsentDiscretion(e.target.checked)}
              className="accent-brand-green mt-0.5 shrink-0"
            />
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
