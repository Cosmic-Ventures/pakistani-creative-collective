import Link from "next/link";
import { linkThumbnail } from "@/lib/link-thumbnail";
import WorkSamplesCarousel from "@/components/WorkSamplesCarousel";

type Sample = { title?: string; role?: string; medium?: string; year?: string; link?: string };

export type SpotlightCreative = {
  slug: string;
  firstName: string;
  lastName: string;
  pronouns: string | null;
  headshot: string | null;
  location: string | null;
  roles: string[];
  experienceLevel: string | null;
  bio: string;
  education: string | null;
  availability: string | null;
  languages: string[];
  mediums: string[];
  workSamples: unknown;
  collaborationPreferences: string | null;
  rateStructure: string | null;
  rateRange: string | null;
  ratePublic: boolean;
  travel: string | null;
};

function normalize(link: string): string {
  return /^https?:\/\//i.test(link.trim()) ? link.trim() : `https://${link.trim()}`;
}

/**
 * This month's spotlight, laid out like the member's real full profile
 * (/directory/[slug]): identity card, details, biography, work samples with
 * preview images, and the Work For Hire card. Members see it at the top of the
 * Community Dashboard, so it has to read as exactly what a full profile is.
 */
export default async function SpotlightProfile({ c }: { c: SpotlightCreative }) {
  const samples = ((c.workSamples as Sample[] | null) ?? []).filter((s) => s.title);
  const thumbs = await Promise.all(samples.map((s) => linkThumbnail(s.link ? normalize(s.link) : undefined)));
  const name = `${c.firstName} ${c.lastName}`;
  const initials = `${c.firstName[0] ?? ""}${c.lastName[0] ?? ""}`;
  const rate = [c.rateStructure, c.ratePublic ? c.rateRange : null].filter(Boolean).join(" · ");
  const hasWfh = rate || c.collaborationPreferences || c.travel || c.roles.length > 0;

  return (
    <section className="mb-10 rounded-[2rem] bg-brand-green p-4 sm:p-6 text-brand-cream">
      <div className="flex items-center justify-between gap-3 mb-4 px-1">
        <h2 className="font-heading font-bold text-xl">This month&apos;s spotlight</h2>
        <Link
          href={`/directory/${c.slug}`}
          className="text-sm font-semibold underline underline-offset-2 hover:no-underline"
        >
          View full profile →
        </Link>
      </div>
      <p className="text-sm text-brand-cream/70 mb-5 px-1">
        A full member profile, exactly as it appears for every creative in the directory.
      </p>

      <div className="grid gap-4 lg:grid-cols-2 items-start">
        <div className="flex flex-col gap-4">
          <div className="bg-brand-green border border-brand-cream/15 rounded-3xl p-6">
            {c.headshot ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.headshot} alt={name} className="w-28 h-28 rounded-2xl object-cover mb-4" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-brand-mint/40 flex items-center justify-center text-brand-green font-heading font-bold text-2xl mb-4">
                {initials}
              </div>
            )}
            <h3 className="font-heading font-bold text-3xl leading-[0.95] tracking-tight">{name}</h3>
            {c.pronouns && <p className="text-sm text-brand-cream/60 mt-2">{c.pronouns}</p>}
            <div className="flex flex-wrap gap-2 mt-4">
              {c.location && <Pill>{c.location}</Pill>}
              {c.roles.map((r) => (
                <Pill key={r}>{r}</Pill>
              ))}
              {c.experienceLevel && <Pill cream>{c.experienceLevel}</Pill>}
            </div>
          </div>
          <div className="space-y-4 px-1 text-sm">
            {c.education && <Detail label="Education" value={c.education} />}
            {c.availability && <Detail label="Availability" value={c.availability} />}
            {c.languages.length > 0 && <Detail label="Languages" value={c.languages.join(", ")} />}
            {c.mediums.length > 0 && <Detail label="Medium(s)" value={c.mediums.join(", ")} />}
          </div>
        </div>

        <div className="flex flex-col gap-4 min-w-0">
          <div className="bg-brand-mint rounded-3xl p-6 text-brand-green">
            <p className="font-heading font-bold text-lg tracking-wide mb-2">Biography</p>
            <p className="text-sm leading-relaxed text-brand-green/90">{c.bio}</p>
          </div>
          {samples.length > 0 && (
            <div>
              <p className="font-heading font-bold text-lg tracking-wide mb-3 px-1">Work Samples</p>
              <WorkSamplesCarousel
                samples={samples.map((s, i) => ({
                  title: s.title ?? "",
                  role: s.role,
                  medium: s.medium,
                  year: s.year,
                  link: s.link ? normalize(s.link) : undefined,
                  thumbnail: thumbs[i],
                }))}
              />
            </div>
          )}
          {hasWfh && (
            <div className="bg-brand-green border border-brand-cream/15 rounded-3xl p-6">
              <p className="font-heading font-bold text-lg text-center mb-4">☾ Work For Hire ☾</p>
              <dl className="space-y-3 text-sm">
                {rate && <Detail label="Rate structure" value={rate} small />}
                {c.collaborationPreferences && (
                  <Detail label="Open to working with" value={c.collaborationPreferences} small />
                )}
                {c.travel && <Detail label="Travel" value={c.travel} small />}
              </dl>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Pill({ children, cream }: { children: React.ReactNode; cream?: boolean }) {
  return (
    <span
      className={`text-xs uppercase font-semibold px-3 py-1 rounded-full text-brand-green ${
        cream ? "bg-brand-cream" : "bg-brand-mint"
      }`}
    >
      {children}
    </span>
  );
}

function Detail({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div>
      <p className={small ? "font-semibold" : "font-heading font-bold text-lg tracking-wide"}>{label}</p>
      <p className="text-brand-cream/80 mt-0.5 leading-relaxed">{value}</p>
    </div>
  );
}
