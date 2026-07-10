import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Hire Talent" };

const steps = [
  {
    step: "1",
    title: "Browse the Directory",
    body: "Search vetted Pakistani creatives in film, music, and media by role, location, medium, and more.",
  },
  {
    step: "2",
    title: "Submit a Contact Request",
    body: "Found someone? Submit a contact request from their profile — tell us about your project and what you're looking for.",
  },
  {
    step: "3",
    title: "We Facilitate the Introduction",
    body: "Aneesa Talks reviews every request and forwards it to the creative. If they're interested, we make the connection.",
  },
];

export default function RequestPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
      <h1 className="font-heading font-bold text-3xl sm:text-4xl text-brand-green mb-4">
        Looking to hire Pakistani creative talent?
      </h1>
      <p className="text-brand-brown/70 text-lg leading-relaxed max-w-2xl mb-12">
        The Pakistani Creative Collective connects you with vetted creatives across film, music, and
        media. Every contact request is screened by Aneesa Talks before it reaches the creative — so
        you get a curated introduction, not a cold outreach.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
        {steps.map(({ step, title, body }) => (
          <div key={step} className="bg-white border border-brand-green/10 rounded-xl p-6 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-brand-mint/30 border border-brand-mint flex items-center justify-center text-brand-green font-bold text-sm mb-4">
              {step}
            </div>
            <h3 className="font-semibold text-brand-green mb-2">{title}</h3>
            <p className="text-brand-brown/70 text-sm leading-relaxed">{body}</p>
          </div>
        ))}
      </div>

      <div className="bg-brand-green text-brand-cream rounded-2xl p-8 sm:p-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <h2 className="font-heading font-bold text-xl mb-2">Ready to find your creative?</h2>
          <p className="text-brand-cream/80 text-sm max-w-lg">
            Browse the full directory of vetted Pakistani talent. Full profiles, search, and contact
            requests require a subscription.
          </p>
        </div>
        <Link
          href="/directory"
          className="shrink-0 bg-brand-mint hover:bg-brand-mint/90 text-brand-green font-semibold px-6 py-3 rounded-full transition-colors"
        >
          Browse the Directory
        </Link>
      </div>

      <p className="text-center text-brand-brown/60 text-sm mt-10">
        Need a more hands-on match, or production support beyond the platform?{" "}
        <a
          href="https://aneesatalks.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-green underline hover:text-brand-green/70"
        >
          Hire Aneesa Talks directly →
        </a>
      </p>
    </div>
  );
}
