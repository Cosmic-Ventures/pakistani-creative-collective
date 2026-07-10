import Link from "next/link";
import Image from "next/image";
import Logo from "@/components/Logo";
import { db } from "@/lib/db";
import { EXPERIENCE_TIERS } from "@/lib/experience-levels";

const howItWorks = [
  {
    step: "1",
    title: "Apply to Join",
    body: "Submit your profile through our intake form. Every application is reviewed before acceptance.",
  },
  {
    step: "2",
    title: "Get Matched",
    body: "Organizations submit vetted talent requests. We match them to the right members privately.",
  },
  {
    step: "3",
    title: "Collaborate & Get Hired",
    body: "All communication is routed through PCC for safety and accountability.",
  },
];

const heroIllustrations = [
  { name: "dancer", width: 1080, height: 1080 },
  { name: "videoguy", width: 468, height: 934 },
  { name: "director", width: 1080, height: 1080 },
  { name: "tapestry-worker", width: 810, height: 860 },
  { name: "cameraman", width: 1080, height: 1080 },
  { name: "performer", width: 472, height: 859 },
  { name: "guitarist", width: 1080, height: 1080 },
  { name: "singer", width: 1080, height: 1080 },
];

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
  "Rate range, where the creative has opted to share it",
  "Search and filter by experience level, medium, availability, language, and project type, in addition to role and location",
  "Ability to submit a contact request through Aneesa Talks",
];

export default async function Home() {
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
      headshot: true,
    },
  });

  return (
    <>
      <section className="relative overflow-hidden bg-brand-green text-brand-cream">
        <Image
          src="/brand/hero-bg.png"
          alt=""
          fill
          priority
          className="object-cover opacity-80 pointer-events-none select-none"
        />
        <div className="hidden lg:grid absolute inset-y-0 right-0 w-3/5 grid-cols-4 grid-rows-2 items-center justify-items-center py-10 pointer-events-none select-none">
          {heroIllustrations.map(({ name, width, height }) => (
            <Image key={name} src={`/brand/vector-${name}.png`} alt="" width={width} height={height} className="h-28 w-auto opacity-20" />
          ))}
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-24 sm:py-32">
          <Logo variant="light" className="h-12 sm:h-14 w-auto mb-8 opacity-95" />
          <h1 className="font-heading font-bold text-4xl sm:text-6xl leading-[1.05] max-w-3xl">
            The networking infrastructure Pakistani creatives have always needed.
          </h1>
          <p className="mt-6 text-lg text-brand-cream/80 max-w-2xl leading-relaxed">
            A curated database of Pakistani talent in film, music, and media —
            searchable, vetted, and built for sustainable global collaboration.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/directory"
              className="bg-brand-mint hover:bg-brand-mint/90 text-brand-green font-semibold px-6 py-3 rounded-full transition-colors"
            >
              Browse the Directory
            </Link>
            <Link
              href="/join"
              className="border border-brand-cream/40 hover:border-brand-cream text-brand-cream font-semibold px-6 py-3 rounded-full transition-colors"
            >
              Apply to Join
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <h2 className="font-heading font-bold text-2xl text-brand-green mb-10">How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {howItWorks.map(({ step, title, body }) => (
            <div
              key={step}
              className="bg-white border border-brand-green/10 rounded-xl p-6 shadow-sm"
            >
              <div className="w-8 h-8 rounded-full bg-brand-mint/30 border border-brand-mint flex items-center justify-center text-brand-green font-bold text-sm mb-4">
                {step}
              </div>
              <h3 className="font-semibold text-brand-green mb-2">{title}</h3>
              <p className="text-brand-brown/70 text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-brand-green/10 bg-brand-mint/15">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <h2 className="font-heading font-bold text-2xl text-brand-green mb-2">Five Experience Tiers</h2>
          <p className="text-brand-brown/70 mb-10 text-sm max-w-2xl">
            Members are categorized based on professional experience, project count, and achievements —
            here&apos;s how to identify your level.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {EXPERIENCE_TIERS.map(({ name, years, projects, criteriaNote, criteria }) => (
              <div
                key={name}
                className="bg-white border border-brand-green/10 rounded-lg p-5 flex flex-col"
              >
                <p className="font-semibold text-sm text-brand-green">{name}</p>
                <p className="text-brand-brown/60 text-xs mt-1 mb-3">{years} · {projects}</p>
                {criteriaNote && (
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-green/60 mb-1.5">{criteriaNote}</p>
                )}
                <ul className="text-brand-brown/70 text-xs space-y-1.5 leading-snug">
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
        <h2 className="font-heading font-bold text-2xl text-brand-green mb-2">Free vs. Member Access</h2>
        <p className="text-brand-brown/70 mb-10 text-sm max-w-2xl">
          Every creative is listed in the database for free. Seeing full profiles and contacting
          creatives requires a membership.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white border border-brand-green/15 rounded-2xl p-6 sm:p-8">
            <h3 className="font-heading font-bold text-brand-green mb-4">Free Access</h3>
            <ul className="space-y-3">
              {FREE_ACCESS.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm text-brand-brown/80">
                  <span className="text-brand-green shrink-0">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-brand-mint rounded-2xl p-6 sm:p-8">
            <h3 className="font-heading font-bold text-brand-green mb-4">Member Access</h3>
            <ul className="space-y-3">
              {MEMBER_ACCESS.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm text-brand-green/90">
                  <span className="text-brand-green shrink-0">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-6 border border-brand-green/15 rounded-2xl p-6 sm:p-8">
          <p className="font-heading font-bold text-brand-green mb-2">Why the Difference</p>
          <p className="text-brand-brown/70 text-sm leading-relaxed max-w-3xl">
            Listing your work in the Pakistani Creative Collective is free, and it always will be.
            Membership funds the database that makes finding and connecting with Pakistani creatives
            possible, and keeps every creative in control of who they want to collaborate with.
          </p>
        </div>

        {featured && (
          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-green/60 mb-3">
              This month&apos;s spotlight — what a member profile looks like
            </p>
            <div className="bg-brand-green rounded-3xl p-6 sm:p-8 grid gap-5 lg:grid-cols-3">
              <div className="bg-brand-cream rounded-2xl p-6 lg:col-span-1">
                {featured.headshot ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={featured.headshot}
                    alt={`${featured.firstName} ${featured.lastName}`}
                    className="w-20 h-20 rounded-2xl object-cover mb-4"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-brand-mint/40 mb-4" />
                )}
                <h3 className="font-heading font-bold text-2xl text-brand-brown leading-none">
                  {featured.firstName} {featured.lastName}
                </h3>
                {featured.pronouns && <p className="text-xs text-brand-brown/60 mt-1.5">{featured.pronouns}</p>}
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {featured.location && (
                    <span className="text-[11px] uppercase font-semibold bg-brand-mint text-brand-green px-2.5 py-1 rounded-full">
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
                  <p className="text-brand-green font-semibold text-sm mb-2">{featured.roles.join(" · ")}</p>
                )}
                <p className="text-brand-green/90 text-sm leading-relaxed line-clamp-5">{featured.bio}</p>
                <Link
                  href={`/directory/${featured.slug}`}
                  className="inline-block mt-4 text-brand-green font-semibold text-sm underline underline-offset-2 hover:no-underline w-fit"
                >
                  View full profile →
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="bg-brand-green text-brand-cream rounded-2xl p-8 sm:p-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h2 className="font-heading font-bold text-xl mb-2">
              Looking to hire Pakistani creative talent?
            </h2>
            <p className="text-brand-cream/80 text-sm max-w-lg">
              Submit a talent request and we&apos;ll match you with vetted professionals. All requests are screened before matching.
            </p>
          </div>
          <Link
            href="/request"
            className="shrink-0 bg-brand-mint hover:bg-brand-mint/90 text-brand-green font-semibold px-6 py-3 rounded-full transition-colors"
          >
            Submit a Request
          </Link>
        </div>
      </section>
    </>
  );
}
