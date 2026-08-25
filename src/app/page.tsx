import Link from "next/link";
import Image from "next/image";
import Logo from "@/components/Logo";
import { db } from "@/lib/db";
import { EXPERIENCE_TIERS } from "@/lib/experience-levels";
import { getDisplayPrices, type DisplayPrices } from "@/lib/stripe";

// Built per-render rather than as a module constant: the "Get Connected"
// paragraph quotes both prices, and those are read from Stripe so the copy can't
// drift from what checkout actually charges.
const buildHowItWorks = (prices: DisplayPrices) => [
  {
    title: "Apply to Join",
    body: [
      "The PCC is open to Pakistani creatives working in film, music, fashion, art, and media, wherever you're based. The application takes about 10–15 minutes and covers your background, creative work, experience, rates, skills, and the kinds of collaborators you're hoping to meet.",
      "Every application is reviewed individually, and because the directory is curated, not every application will be accepted. Creating a profile is free and always will be.",
    ],
  },
  {
    title: "Get Connected",
    body: [
      "Pakistani creatives are doing incredible work around the world, but there has never been a place to find one another. The PCC brings that community together by strengthening our collective digital footprint.",
      `Once your profile is approved, it becomes part of a directory where creatives across all mediums can discover Pakistani creatives for jobs, commissions, and collaborations. Anyone can browse basic profiles. Search filters, full profiles, community dashboard access, and connection requests are available through a paid subscription of ${prices.monthly} per month / ${prices.annual} per year.`,
    ],
  },
  {
    title: "Collaborate and Create",
    body: [
      "Profiles are designed to help people find the right collaborators based on their work, experience, and interests. Whether someone is building a crew, hiring an editor, or looking for a designer, they can search across disciplines instead of relying on personal networks.",
      "The PCC also highlights members through ongoing features and promotional opportunities.",
    ],
  },
  {
    title: "Privacy & Security",
    body: [
      "Your email address and phone number are never made public, and members can't contact each other directly through the platform.",
      "Connection requests are sent through Aneesa Talks first, and you choose whether to respond. You can update or remove your profile at any time.",
      "Applications are reviewed with the safety of the community in mind. Credible reports of misconduct may result in a profile being removed from the directory.",
    ],
  },
];

const SPOTLIGHT_HEADSHOT = "/brand/aneesa-khan-headshot.jpg";

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
  viewFullProfile: false,
};

const FREE_ACCESS = [
  "Creative's name",
  "Role",
  "Location",
  "Bio (200 words max)",
  "Search and filter by role and location",
];

const MEMBER_ACCESS = [
  "Full public creative profile, including headshot",
  "Work samples and notable achievements",
  "Languages spoken and current availability",
  "Preferred project types and past collaborators",
  "Rate range, if the creative chooses to share it",
  "Search and filter by experience level, medium, availability, language, and project type, in addition to role and location",
  "Ability to submit a contact request through Aneesa Talks",
];

export default async function Home() {
  const prices = await getDisplayPrices();
  const howItWorks = buildHowItWorks(prices);

  const featured = await db.creative.findUnique({
    where: { slug: "aneesa-khan" },
    select: {
      slug: true,
      firstName: true,
      lastName: true,
      pronouns: true,
      location: true,
      roles: true,
      experienceLevel: true,
      bio: true,
    },
  });

  return (
    <div className="bg-brand-green">
      <section className="relative overflow-hidden bg-brand-green text-brand-cream">
        {/* Client-supplied header artwork (PCC Header.png, 08/08 round). It already
            carries the line-art figures on its right side, so the separate vector
            overlay grid that used to sit on top of hero-bg.png is gone — keeping
            both double-printed the illustrations. */}
        <Image
          src="/brand/pcc-header.png"
          alt=""
          fill
          priority
          className="object-cover pointer-events-none select-none"
        />
        {/* Left-to-right scrim: the artwork keeps its figures on the right, so
            the copy sits over the clear left side and this keeps it legible
            against the lighter swirls there. */}
        <div className="absolute inset-0 bg-gradient-to-r from-brand-green via-brand-green/85 to-brand-green/10 pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-24 sm:py-32 lg:max-w-6xl">
          <Logo variant="square" className="h-20 sm:h-24 w-auto mb-8 opacity-95" />
          <h1 className="font-heading font-bold text-4xl sm:text-6xl leading-[1.05] max-w-2xl">
            Built for Pakistani creatives to be discovered.
          </h1>
          <p className="mt-6 text-lg text-brand-cream/80 max-w-lg leading-relaxed">
            A curated database of Pakistani talent in film, music, and media —
            searchable, vetted, and built for sustainable global collaboration.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
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
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <h2 className="font-heading font-bold text-2xl text-brand-cream mb-10">How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {howItWorks.map(({ title, body }) => (
            <div
              key={title}
              className="bg-white rounded-xl p-6 shadow-sm"
            >
              <h3 className="font-heading font-bold text-black mb-3">{title}</h3>
              {body.map((paragraph) => (
                <p key={paragraph} className="text-black/70 text-sm leading-relaxed mb-3 last:mb-0">
                  {paragraph}
                </p>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-brand-green/10 bg-brand-mint/15">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          {/* White, not black: this band sits on the green page background, where
              black is unreadable (client called it out twice — 08/03 and 08/08). */}
          <h2 className="font-heading font-bold text-2xl text-brand-cream mb-2">Five Experience Tiers</h2>
          <p className="text-brand-cream/80 mb-10 text-sm max-w-2xl">
            Members are categorized based on professional experience, project count, and achievements —
            here&apos;s how to identify your level.
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
                      <span className="text-brand-mint shrink-0">•</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <h2 className="font-heading font-bold text-2xl text-brand-cream mb-2">Free vs. Member Access</h2>
        <p className="text-brand-cream/70 mb-10 text-sm max-w-2xl">
          Every creative is listed in the database for free. Seeing full profiles and contacting
          creatives requires a membership.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white border border-brand-green/15 rounded-2xl p-6 sm:p-8">
            <h3 className="font-heading font-bold text-black mb-4">Free Access</h3>
            <ul className="space-y-3">
              {FREE_ACCESS.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm text-black/80">
                  <span className="text-black shrink-0">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-brand-mint rounded-2xl p-6 sm:p-8">
            <h3 className="font-heading font-bold text-black mb-4">Member Access</h3>
            <ul className="space-y-3">
              {MEMBER_ACCESS.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm text-black/90">
                  <span className="text-black shrink-0">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-6 bg-white border border-brand-green/15 rounded-2xl p-6 sm:p-8">
          <p className="font-heading font-bold text-black mb-2">Why Become a Member?</p>
          <p className="text-black/70 text-sm leading-relaxed mb-3">
            Joining the Pakistani Creative Collective is free, and it always will be. A membership
            gives you access to the platform&apos;s full features, including advanced search,
            community dashboard access, full profiles, and connection requests.
          </p>
          <p className="text-black/70 text-sm leading-relaxed">
            Membership fees cover the cost of running the platform, reviewing applications, and
            managing connection requests so members&apos; contact information stays private.
            Keeping the directory active and up to date takes ongoing work, and memberships make
            that possible.
          </p>
        </div>

        {featured && (
          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-cream/60 mb-3">
              This month&apos;s spotlight — what a member profile looks like
            </p>
            <div className="bg-brand-green border border-brand-cream/15 rounded-3xl p-6 sm:p-8 grid gap-5 lg:grid-cols-3">
              <div className="bg-brand-cream rounded-2xl p-6 lg:col-span-1">
                {/* Client-supplied spotlight portrait (08/08 round). Bundled as a
                    static asset rather than read from featured.headshot so the
                    spotlight shows the approved photo regardless of what's stored
                    on the directory record. */}
                <Image
                  src={SPOTLIGHT_HEADSHOT}
                  alt={`${featured.firstName} ${featured.lastName}`}
                  width={800}
                  height={1200}
                  className="w-20 h-20 rounded-2xl object-cover object-top mb-4"
                />
                <h3 className="font-heading font-bold text-2xl text-black leading-none">
                  {featured.firstName} {featured.lastName}
                </h3>
                {featured.pronouns && <p className="text-xs text-black/60 mt-1.5">{featured.pronouns}</p>}
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {featured.location && (
                    <span className="text-[11px] uppercase font-semibold bg-brand-mint text-black px-2.5 py-1 rounded-full">
                      {featured.location}
                    </span>
                  )}
                  {featured.experienceLevel && (
                    <span className="text-[11px] uppercase font-semibold bg-brand-green text-brand-cream px-2.5 py-1 rounded-full">
                      {featured.experienceLevel}
                    </span>
                  )}
                </div>
              </div>
              <div className="bg-brand-mint/90 rounded-2xl p-6 lg:col-span-2 flex flex-col justify-center">
                {featured.roles.length > 0 && (
                  <p className="text-black font-semibold text-sm mb-2">{featured.roles.join(" · ")}</p>
                )}
                <p className="text-black/80 text-sm leading-relaxed line-clamp-5">{featured.bio}</p>
                {HOMEPAGE_CTAS.viewFullProfile && (
                  <Link
                    href={`/directory/${featured.slug}`}
                    className="inline-block mt-4 text-black font-semibold text-sm underline underline-offset-2 hover:no-underline w-fit"
                  >
                    View full profile →
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="bg-white text-black rounded-2xl p-8 sm:p-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h2 className="font-heading font-bold text-xl mb-2 text-black">
              Looking to hire Pakistani creative talent?
            </h2>
            <p className="text-black/70 text-sm max-w-lg">
              Submit a talent request and we&apos;ll match you with vetted professionals.
              <span className="block pl-4 mt-1">All requests are screened before matching.</span>
            </p>
          </div>
          {HOMEPAGE_CTAS.submitRequest && (
            <Link
              href="/request"
              className="shrink-0 bg-brand-green hover:bg-brand-green/90 text-brand-cream font-semibold px-6 py-3 rounded-full transition-colors"
            >
              Submit a Request
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
