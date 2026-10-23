import Link from "next/link";
import Image from "next/image";
import Logo from "@/components/Logo";
import Reveal from "@/components/Reveal";
import AccessComparison from "@/components/AccessComparison";
import { EXPERIENCE_TIERS } from "@/lib/experience-levels";
import { getDisplayPrices } from "@/lib/stripe";

// 10/02 round: "remove any information that is redundant to what has previously
// been articulated as you scroll" — each fact lives in exactly one place. Pricing
// and what each tier includes are covered once, in Free vs. Member Access below.
const HOW_IT_WORKS = [
  {
    title: "Apply to Join",
    body: [
      "Open to Pakistani creatives in film, music, fashion, art, and media, wherever you're based. The application takes 10–15 minutes and every one is reviewed individually. Creating a profile is free.",
    ],
  },
  {
    title: "Get Connected",
    body: [
      "Approved profiles join a searchable directory, so people can find Pakistani talent for jobs, commissions, and collaborations, instead of relying on personal networks.",
    ],
  },
  {
    title: "Collaborate and Create",
    body: [
      "Building a crew, hiring an editor, looking for a designer: search across disciplines to find the right fit. Members are also highlighted through ongoing features.",
    ],
  },
  {
    title: "Privacy & Security",
    body: [
      "Your email and phone number are never public, and members can't contact each other directly. Requests go through Aneesa Talks first, and you choose whether to respond.",
      "You can edit or remove your profile at any time. Credible reports of misconduct may result in removal.",
    ],
  },
];

// 08/24 feedback round: "hide all buttons for now, except Apply to Join" —
// the directory, contact-request, and profile pages aren't public yet, and
// several of them are also behind the pre-launch gate (see PRELAUNCH_ALLOWED
// in src/lib/site-gate.ts), so linking to them from the homepage just bounces
// visitors back to /enroll. Apply to Join is the one flow that's actually
// open. Flip any of these back to true — no other change needed — once the
// corresponding page is ready to be public.
const HOMEPAGE_CTAS = {
  applyToJoin: true,
  browseDirectory: false,
  submitRequest: false,
  };

export default async function Home() {
  const prices = await getDisplayPrices();

  return (
    <div className="bg-brand-green">
      {/* The hero stays pinned while the sections below slide up over it (layering,
          10/22 round). Only when the screen is tall enough to hold it, so a short
          window never clips the hero. */}
      <section className="relative overflow-hidden bg-brand-green text-brand-cream [@media(min-width:768px)_and_(min-height:640px)]:sticky top-0 z-0">
        {/* Same textured green as every profile page. */}
        <Image
          src="/brand/hero-bg.png"
          alt=""
          fill
          priority
          className="object-cover opacity-70 pointer-events-none select-none"
        />
        {/* 4x4 logo on the left, a thin white line, then the message on the right. */}
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20 grid md:grid-cols-2 items-stretch">
          <div className="flex items-center justify-center pb-10 md:pb-0 md:pr-10">
            <Logo variant="square" className="w-64 sm:w-80 lg:w-96 h-auto" />
          </div>
          <div className="flex flex-col justify-center border-t border-brand-cream pt-10 md:border-t-0 md:border-l md:pt-0 md:pl-10 lg:pl-14">
            <h1 className="font-heading font-bold text-4xl sm:text-5xl leading-[1.05]">
              Built for Pakistani creatives to be discovered.
            </h1>
            <p className="mt-6 text-lg text-brand-cream/80 max-w-lg leading-relaxed">
              A curated database of Pakistani talent in film, music, and media —
              searchable, vetted, and built for sustainable global collaboration.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              {HOMEPAGE_CTAS.browseDirectory && (
                <Link
                  href="/directory"
                  className="bg-brand-cream hover:bg-white text-brand-green font-semibold px-6 py-3 rounded-full transition-colors"
                >
                  Browse the Directory
                </Link>
              )}
              {HOMEPAGE_CTAS.applyToJoin && (
                <Link
                  href="/join"
                  className="border border-brand-cream/40 hover:border-brand-cream text-brand-cream font-semibold px-6 py-3 rounded-full transition-colors"
                >
                  Apply to Join
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Everything below covers the hero as it scrolls. Opaque so the pinned hero
          never shows through; each section is split from the last by a 1px white line. */}
      <div className="relative z-10 bg-brand-green">
      <section className="border-t border-brand-cream">
      <Reveal>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <h2 className="font-heading font-bold text-2xl text-brand-cream mb-10">How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {HOW_IT_WORKS.map(({ title, body }) => (
            <div
              key={title}
              className="bg-white rounded-xl p-6 shadow-sm"
            >
              <h3 className="font-bold text-black mb-3">{title}</h3>
              {body.map((paragraph) => (
                <p key={paragraph} className="text-black/70 text-sm leading-relaxed mb-3 last:mb-0">
                  {paragraph}
                </p>
              ))}
            </div>
          ))}
        </div>
      </div>
      </Reveal>
      </section>

      <section className="border-t border-brand-cream bg-brand-mint/15">
      <Reveal>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          {/* White, not black: this band sits on the green page background, where
              black is unreadable (client called it out twice — 08/03 and 08/08). */}
          <h2 className="font-heading font-bold text-2xl text-brand-cream mb-2">Five Experience Tiers</h2>
          <p className="text-brand-cream/80 mb-10 text-sm max-w-2xl">
            Members are categorized based on professional experience, project count, and achievements —
            here&apos;s how to identify your level:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {EXPERIENCE_TIERS.map(({ name, years, projects, criteriaNote, criteria }) => (
              <div
                key={name}
                className="bg-white border border-brand-green/10 rounded-lg p-5 flex flex-col"
              >
                <p className="font-semibold text-sm text-black">{name}</p>
                <p className="text-black/60 text-xs mt-1 mb-3">{years} · {projects}</p>
                {criteriaNote && (
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-black/60 mb-1.5">{criteriaNote}</p>
                )}
                <ul className="text-black/70 text-xs space-y-1.5 leading-snug">
                  {criteria.map((c) => (
                    <li key={c} className="flex gap-1.5">
                      <span className="shrink-0">•</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
      </section>

      <section className="border-t border-brand-cream">
      <Reveal>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <h2 className="font-heading font-bold text-2xl text-brand-cream mb-2">The Work For Hire Card</h2>
        <p className="text-brand-cream/80 mb-8 text-sm max-w-2xl">
          Every profile has one. If you see it, that creative is open to working and collaborating:
          the thing to look for when you want to team up, rather than simply discover talent and
          work you resonate with.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="bg-brand-green border border-brand-cream/15 rounded-3xl p-7 text-brand-cream">
            <div className="flex items-center justify-center gap-3 mb-5">
              <span className="h-px flex-1 bg-brand-cream/30" />
              <span className="text-xs">☾</span>
              <h3 className="font-heading font-bold text-lg">Work For Hire</h3>
              <span className="text-xs">☾</span>
              <span className="h-px flex-1 bg-brand-cream/30" />
            </div>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="font-semibold mb-0.5">Rate structure</dt>
                <dd className="text-brand-cream/80">How they charge, and a range where they choose to share it</dd>
              </div>
              <div>
                <dt className="font-semibold mb-0.5">Open to working with</dt>
                <dd className="text-brand-cream/80">The experience levels they want to hear from</dd>
              </div>
              <div>
                <dt className="font-semibold mb-0.5">Role(s)</dt>
                <dd className="text-brand-cream/80">What they can do for your project</dd>
              </div>
              <div>
                <dt className="font-semibold mb-0.5">Travel</dt>
                <dd className="text-brand-cream/80">Whether they&apos;ll work on location or internationally</dd>
              </div>
            </dl>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-black mb-3">How to use it</h3>
            <ul className="text-black/70 text-sm leading-relaxed space-y-2">
              <li>Look for the card on a profile to know they&apos;re open to collaborating.</li>
              <li>
                Check <span className="font-semibold">Open to working with</span> before you reach
                out. Contact requests are only sent when your experience level matches.
              </li>
              <li>Submit a contact request and Aneesa Talks will make the introduction.</li>
            </ul>
          </div>
        </div>
      </div>
      </Reveal>
      </section>

      <section className="border-t border-brand-cream">
      <Reveal>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <h2 className="font-heading font-bold text-2xl text-brand-cream mb-2">Free vs. Member Access</h2>
        <p className="text-brand-cream/70 mb-8 text-sm max-w-2xl">
          Every creative is listed for free. Membership is {prices.monthly}/month or {prices.annual}/year
          and covers running the platform, reviewing applications, and handling requests so contact
          details stay private.
        </p>
        <AccessComparison />
      </div>
      </Reveal>
      </section>

      {HOMEPAGE_CTAS.submitRequest && (
        <section className="border-t border-brand-cream">
        <Reveal>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <div className="bg-white text-black rounded-2xl p-8 sm:p-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h2 className="font-bold text-xl mb-2 text-black">
                Looking to hire Pakistani creative talent?
              </h2>
              <p className="text-black/70 text-sm max-w-lg">
                Submit a talent request and we&apos;ll match you with vetted professionals.
                <span className="block pl-4 mt-1">All requests are screened before matching.</span>
              </p>
            </div>
            <Link
              href="/request"
              className="shrink-0 bg-brand-green hover:bg-brand-green/90 text-brand-cream font-semibold px-6 py-3 rounded-full transition-colors"
            >
              Submit a Request
            </Link>
          </div>
      </div>
      </Reveal>
        </section>
      )}
      </div>
    </div>
  );
}
