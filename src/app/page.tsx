import Link from "next/link";
import Image from "next/image";
import Logo from "@/components/Logo";
import AccessComparison from "@/components/AccessComparison";
import { db } from "@/lib/db";
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

export default async function Home() {
  const prices = await getDisplayPrices();

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
      education: true,
      availability: true,
      languages: true,
      mediums: true,
      workSamples: true,
    },
  });

  const spotlightSamples = (
    (featured?.workSamples as { title?: string; role?: string; medium?: string; year?: string }[] | null) ?? []
  )
    .filter((ws) => ws.title)
    .slice(0, 2) as { title: string; role?: string; medium?: string; year?: string }[];

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
          <Logo variant="square" className="h-28 sm:h-36 w-auto mb-8 opacity-95" />
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
        <p className="text-brand-cream/70 mb-8 text-sm max-w-2xl">
          Every creative is listed for free. Membership is {prices.monthly}/month or {prices.annual}/year
          and covers running the platform, reviewing applications, and handling requests so contact
          details stay private.
        </p>
        <AccessComparison />

        {featured && (
          <div className="mt-12">
            <h3 className="font-heading font-bold text-xl text-brand-cream mb-2">This month&apos;s spotlight</h3>
            <p className="text-brand-cream/70 text-sm max-w-2xl mb-5">
              This is a full member profile, exactly what subscribers see for every creative in the
              directory.
            </p>
            <div className="grid gap-4 lg:grid-cols-2 items-start">
              <div className="flex flex-col gap-4">
                <div className="bg-brand-green border border-brand-cream/15 rounded-3xl p-6 sm:p-7 text-brand-cream">
                  {/* Client-supplied spotlight portrait (08/08 round). Bundled as a
                      static asset rather than read from featured.headshot so the
                      spotlight shows the approved photo regardless of what's stored
                      on the directory record. */}
                  <Image
                    src={SPOTLIGHT_HEADSHOT}
                    alt={`${featured.firstName} ${featured.lastName}`}
                    width={800}
                    height={1200}
                    className="w-24 h-24 rounded-2xl object-cover object-top mb-4"
                  />
                  <h4 className="font-bold text-2xl leading-tight">
                    {featured.firstName} {featured.lastName}
                  </h4>
                  {featured.pronouns && <p className="text-sm text-brand-cream/60 mt-1">{featured.pronouns}</p>}
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {featured.location && (
                      <span className="text-[11px] uppercase font-semibold bg-brand-mint text-brand-green px-2.5 py-1 rounded-full">
                        {featured.location}
                      </span>
                    )}
                    {featured.roles.map((r) => (
                      <span key={r} className="text-[11px] uppercase font-semibold bg-brand-mint text-brand-green px-2.5 py-1 rounded-full">
                        {r}
                      </span>
                    ))}
                    {featured.experienceLevel && (
                      <span className="text-[11px] uppercase font-semibold bg-brand-cream text-brand-green px-2.5 py-1 rounded-full">
                        {featured.experienceLevel}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-brand-cream space-y-4 px-1 text-sm">
                  {featured.education && (
                    <div><p className="font-bold">Education</p><p className="text-brand-cream/80">{featured.education}</p></div>
                  )}
                  {featured.availability && (
                    <div><p className="font-bold">Availability</p><p className="text-brand-cream/80">{featured.availability}</p></div>
                  )}
                  {featured.languages.length > 0 && (
                    <div><p className="font-bold">Languages</p><p className="text-brand-cream/80">{featured.languages.join(", ")}</p></div>
                  )}
                  {featured.mediums.length > 0 && (
                    <div><p className="font-bold">Medium(s)</p><p className="text-brand-cream/80">{featured.mediums.join(", ")}</p></div>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <div className="bg-brand-mint rounded-3xl p-6 sm:p-7 text-brand-green">
                  <p className="font-bold mb-2">Biography</p>
                  <p className="text-sm leading-relaxed text-brand-green/90">{featured.bio}</p>
                </div>
                {spotlightSamples.map((ws, i) => (
                  <div key={i} className="bg-brand-green border border-brand-cream/15 rounded-3xl p-5 text-brand-cream">
                    <p className="font-bold leading-snug">{ws.title}</p>
                    {[ws.role, ws.medium, ws.year].some(Boolean) && (
                      <p className="text-sm text-brand-cream/70">{[ws.role, ws.medium, ws.year].filter(Boolean).join(" · ")}</p>
                    )}
                  </div>
                ))}
                {HOMEPAGE_CTAS.viewFullProfile && (
                  <Link
                    href={`/directory/${featured.slug}`}
                    className="text-brand-cream font-semibold text-sm underline underline-offset-2 hover:no-underline w-fit"
                  >
                    View full profile →
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {HOMEPAGE_CTAS.submitRequest && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
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
        </section>
      )}
    </div>
  );
}
