"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

// A read-only summary of what EnrollForm asks, step by step. Keep it in step
// with the form's STEPS and required fields when those change.
const PREVIEW_STEPS: { title: string; items: string[] }[] = [
  {
    title: "Personal / Basic Info",
    items: [
      "Name, pronouns, email and phone",
      "Public location",
      "Professional headshot (required)",
      "Professional bio (required)",
      "How you heard about the PCC",
    ],
  },
  {
    title: "Skills & Experience",
    items: [
      "Professional roles (at least one) across camera, directing, sound, music, styling, writing and more",
      "Mediums you work in",
      "Experience level (required), years of experience and completed projects",
    ],
  },
  {
    title: "Work Samples / Portfolio",
    items: ["Website, IMDb, Instagram, LinkedIn and Vimeo/YouTube links", "Up to three work samples with title, medium, year, your roles and a link"],
  },
  {
    title: "Additional Questions",
    items: [
      "Rate structure and range, and whether paid members can see it",
      "Travel and preferred project types",
      "Languages, special skills and equipment",
      "Who you'd like to collaborate with",
    ],
  },
  { title: "Review & Submit", items: ["Check everything, accept the terms and submit"] },
];

export default function ApplicationPreview({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    // Clicking the dimmed backdrop (the dialog element itself) closes it.
    const onClick = (e: MouseEvent) => {
      if (e.target === dialog) dialog.close();
    };
    dialog.addEventListener("click", onClick);
    return () => dialog.removeEventListener("click", onClick);
  }, []);

  return (
    <>
      <button type="button" onClick={() => ref.current?.showModal()} className={className}>
        Preview the Application
      </button>
      <dialog
        ref={ref}
        aria-labelledby="application-preview-title"
        className="m-auto w-[min(92vw,40rem)] max-h-[85vh] rounded-3xl bg-brand-cream text-brand-brown p-0 shadow-2xl backdrop:bg-black/60"
      >
        <div className="flex max-h-[85vh] flex-col">
          <div className="flex items-start justify-between gap-4 px-6 pt-6 sm:px-8 sm:pt-8">
            <div>
              <h2 id="application-preview-title" className="font-heading font-bold text-2xl sm:text-3xl text-brand-green">
                What the application asks
              </h2>
              <p className="mt-2 text-sm text-brand-brown/70">
                Five short steps. You can save your progress and come back, and nothing is submitted until the last step.
              </p>
            </div>
            <button
              type="button"
              onClick={() => ref.current?.close()}
              aria-label="Close preview"
              className="shrink-0 rounded-full border border-brand-green/20 h-9 w-9 text-brand-green hover:bg-brand-green/10"
            >
              &times;
            </button>
          </div>
          <ol className="mt-6 space-y-5 overflow-y-auto px-6 sm:px-8">
            {PREVIEW_STEPS.map((step, i) => (
              <li key={step.title} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-green text-brand-cream text-sm font-semibold">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-semibold text-brand-green">{step.title}</h3>
                  <ul className="mt-1 space-y-0.5 text-sm text-brand-brown/80 list-disc pl-4">
                    {step.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-brand-green/10 px-6 py-5 sm:px-8">
            <Link
              href="/enroll"
              className="rounded-full bg-brand-green hover:bg-brand-green/90 text-brand-cream font-semibold px-6 py-3 transition-colors"
            >
              Start your application
            </Link>
            <button
              type="button"
              onClick={() => ref.current?.close()}
              className="rounded-full px-4 py-3 text-sm font-medium text-brand-green hover:bg-brand-green/10"
            >
              Close
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
