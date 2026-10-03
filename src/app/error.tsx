"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Last backstop for anything that escapes a form's own error handling.
 *
 * Without a boundary, an unhandled render or action error leaves the visitor on
 * Next's bare "Application error" screen with no wording of ours and no way
 * back — indistinguishable, from their side, from a page that simply broke.
 * Applicants have already reported this shape of failure on the enrollment form
 * twice, so it gets a real message and a way onward.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[boundary] unhandled error", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md text-center">
        <h1 className="font-heading font-bold text-2xl text-brand-green mb-3">
          Something went wrong on our side
        </h1>
        <p className="text-brand-brown/70 text-sm leading-relaxed mb-8">
          This wasn&apos;t anything you did. If you were part-way through the application,
          your saved progress is safe — reopen it and your answers will be waiting.
          If this keeps happening, email{" "}
          <a href="mailto:pcc@aneesatalks.com" className="text-brand-green underline underline-offset-2">
            pcc@aneesatalks.com
          </a>
          {error.digest ? <> and quote reference <code className="text-brand-green">{error.digest}</code></> : null}.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-brand-green hover:bg-brand-green/90 text-brand-cream font-semibold px-6 py-3 rounded-full transition-colors text-sm"
          >
            Try again
          </button>
          <Link
            href="/"
            className="border border-brand-green/30 hover:border-brand-green text-brand-green font-semibold px-6 py-3 rounded-full transition-colors text-sm"
          >
            Back to the homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
