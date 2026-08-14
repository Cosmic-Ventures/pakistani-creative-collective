import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Hire Talent" };

const steps = [
  {
    step: "1",
    title: "Browse the Directory",
    body: "Explore Pakistani creatives by role, location, medium, experience level, and more.",
  },
  {
    step: "2",
    title: "Submit a Contact Request",
    body: "Found someone you'd like to work with? Submit a request through their profile, sharing details about your project and what you're looking for.",
  },
  {
    step: "3",
    title: "We Facilitate the Introduction",
    body: "Aneesa Talks reviews each request and forwards it to the creative. If they're interested, we help facilitate the connection.",
  },
];

export default function RequestPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
      {/* Body background is cream, so the title/description must be dark — they
          were brand-cream, which rendered invisibly and read to the client as
          "the heading is missing, it's just blank at the top" (08/08 round). */}
      <h1 className="font-heading font-bold text-3xl sm:text-4xl text-black mb-4">
        Looking to hire Pakistani creative talent?
      </h1>
      <p className="text-black/70 text-lg leading-relaxed mb-12">
        The Pakistani Creative Collective connects you with Pakistani creatives across film, music,
        fashion, design, media, and more. Every contact request is reviewed by Aneesa Talks before it
        reaches the creative, giving you a curated introduction instead of a cold outreach.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
        {steps.map(({ step, title, body }) => (
          <div key={step} className="bg-white border border-brand-green/10 rounded-xl p-6 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-brand-mint/30 border border-brand-mint flex items-center justify-center text-black font-bold text-sm mb-4">
              {step}
            </div>
            <h3 className="font-semibold text-black mb-2">{title}</h3>
            <p className="text-black/70 text-sm leading-relaxed">{body}</p>
          </div>
        ))}
      </div>

      <div className="bg-brand-green border border-brand-cream/15 text-brand-cream rounded-2xl p-8 sm:p-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <h2 className="font-heading font-bold text-xl mb-2">Ready to find your creative?</h2>
          <p className="text-brand-cream/80 text-sm max-w-lg">
            Browse the full directory of Pakistani talent. Full profiles, advanced search, and
            contact requests are available through membership.
          </p>
        </div>
        <Link
          href="/directory"
          className="shrink-0 bg-brand-mint hover:bg-brand-mint/90 text-brand-green font-semibold px-6 py-3 rounded-full transition-colors"
        >
          Browse the Directory
        </Link>
      </div>

      <p className="text-center text-black/60 text-sm mt-10">
        Need a more hands-on match, or production support beyond the platform?{" "}
        <a
          href="https://aneesatalks.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-black underline hover:text-black/70"
        >
          Hire Aneesa Talks directly →
        </a>
      </p>
    </div>
  );
}
