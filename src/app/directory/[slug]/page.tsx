import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { toggleProfileBookmark } from "@/lib/bookmark-actions";
import { getDisplayPrices } from "@/lib/stripe";

export const dynamic = "force-dynamic";

function formatRoleLine(roles: string[]): string {
  if (roles.length === 0) return "";
  if (roles.length === 1) return roles[0];
  if (roles.length === 2) return `${roles[0]} & ${roles[1]}`;
  return `${roles.slice(0, -1).join(", ")}, & ${roles[roles.length - 1]}`;
}

function toEmbedUrl(link: string): string | null {
  const yt = link.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = link.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

function normalizeUrl(href: string, prefix = "https://"): string {
  return href.startsWith("http") ? href : `${prefix}${href.replace(/^@/, "")}`;
}

function truncateWords(text: string, max: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= max) return text;
  return `${words.slice(0, max).join(" ")}…`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = await db.creative.findUnique({ where: { slug }, select: { firstName: true, lastName: true } });
  if (!c) return {};
  return { title: `${c.firstName} ${c.lastName}` };
}

export default async function MemberPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getSession();
  const isPaid = session?.role === "PAID" || session?.role === "ADMIN";

  const isFeaturedNow = (c: { featured: boolean; featuredUntil: Date | null }) =>
    c.featured && (!c.featuredUntil || new Date(c.featuredUntil) > new Date());

  const creative = await db.creative.findUnique({
    where: { slug, status: "APPROVED" },
  });
  if (!creative) notFound();

  const isBookmarked = isPaid
    ? Boolean(
        await db.bookmark.findUnique({
          where: { userId_creativeId: { userId: session!.userId, creativeId: creative.id } },
        })
      )
    : false;

  const prices = await getDisplayPrices();
  const showFull = isPaid || isFeaturedNow(creative);
  // Only shown on the full (paid/featured) view — free profiles don't list a link at all.
  const headlineLink = showFull ? (creative.website ?? creative.publicLink) : null;
  const workSamples = (creative.workSamples as
    | { title?: string; role?: string; link?: string; medium?: string; year?: string }[]
    | null) ?? [];
  const [primarySample, ...otherSamples] = workSamples;

  const fullName = `${creative.firstName} ${creative.lastName}`;
  const subtitle = [creative.pronouns].filter(Boolean).join(" ");
  const bio = showFull ? creative.bio : truncateWords(creative.bio, 200);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-brand-green print-area">
      <Image
        src="/brand/hero-bg.png"
        alt=""
        fill
        priority
        className="object-cover opacity-70 pointer-events-none select-none print:hidden"
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="flex items-center justify-between mb-8 print:hidden">
          <Link
            href="/directory"
            className="inline-flex items-center gap-1 text-sm text-brand-cream/70 hover:text-brand-cream transition-colors"
          >
            ← Directory
          </Link>
          {isPaid && (
            <form action={async () => { "use server"; await toggleProfileBookmark(creative.id); }}>
              <button
                className={`text-sm font-semibold px-4 py-1.5 rounded-full border transition-colors ${
                  isBookmarked
                    ? "bg-brand-mint text-brand-green border-brand-mint"
                    : "border-brand-cream/30 text-brand-cream/80 hover:text-brand-cream"
                }`}
              >
                {isBookmarked ? "★ Bookmarked" : "☆ Bookmark"}
              </button>
            </form>
          )}
        </div>

        {/* ── Row 1 ─────────────────────────────────────────────── */}
        {/* items-start: grid items default to stretching to the row's height, which
            left the shorter card (the name/tags block on free profiles, the bio
            block on paid ones) padded out with empty space below its content —
            the "dead or blank space in the shape blocks" from the 08/08 round. */}
        <div className={`grid gap-6 items-start ${showFull ? "lg:grid-cols-3" : "lg:grid-cols-5"}`}>
          {/* Identity card — white */}
          <IdentityCard
            fullName={fullName}
            subtitle={subtitle}
            headshot={showFull ? creative.headshot : null}
            location={creative.location}
            roles={creative.roles}
            experienceLevel={creative.experienceLevel}
            headlineLink={headlineLink}
            showRolesAsPills={showFull}
            className={showFull ? "" : "lg:col-span-2"}
          />

          {showFull ? (
            <>
              {/* Details column — on green */}
              <div className="text-brand-cream space-y-5">
                {creative.education && <Detail label="Education" value={creative.education} />}
                {creative.availability && <Detail label="Availability" value={creative.availability} />}
                {creative.languages.length > 0 && (
                  <Detail label="Languages" value={creative.languages.join(", ")} />
                )}
                {creative.mediums.length > 0 && (
                  <Detail label="Medium(s)" value={creative.mediums.join(", ")} />
                )}
                <div>
                  <p className="font-heading font-bold text-sm tracking-wide mb-2">Connect</p>
                  <div className="flex flex-wrap gap-2">
                    {headlineLink && <SocialIcon href={normalizeUrl(headlineLink)} kind="globe" />}
                    {creative.instagram && (
                      <SocialIcon href={normalizeUrl(creative.instagram, "https://instagram.com/")} kind="instagram" />
                    )}
                    {creative.linkedin && (
                      <SocialIcon href={normalizeUrl(creative.linkedin, "https://linkedin.com/in/")} kind="linkedin" />
                    )}
                    {creative.imdb && <SocialIcon href={normalizeUrl(creative.imdb)} kind="imdb" />}
                    {creative.vimeo && <SocialIcon href={normalizeUrl(creative.vimeo)} kind="play" />}
                  </div>
                </div>
              </div>

              {/* Primary work sample column — on green */}
              <div className="text-brand-cream space-y-5">
                {primarySample && (
                  <>
                    <Detail
                      label="Primary Work Sample"
                      value={[primarySample.title, primarySample.medium, primarySample.year]
                        .filter(Boolean)
                        .join(", ")}
                    />
                    {primarySample.role && <Detail label="Role(s)" value={primarySample.role} />}
                    {primarySample.link && <ProjectEmbed link={primarySample.link} />}
                  </>
                )}
              </div>
            </>
          ) : (
            /* Biography card — mint (public view) */
            <BiographyCard bio={bio} className="lg:col-span-3" />
          )}
        </div>

        {/* ── Row 2 (paid) ──────────────────────────────────────── */}
        {showFull && (
          <div className="grid gap-6 items-start lg:grid-cols-2 mt-6">
            <BiographyCard bio={bio} />

            {(creative.rateStructure ||
              creative.collaborationPreferences ||
              creative.travel ||
              headlineLink ||
              creative.preferredProjectTypes.length > 0) && (
              <div className="bg-brand-cream rounded-3xl p-7 sm:p-8">
                <div className="flex items-center justify-center gap-3 mb-6">
                  <span className="h-px flex-1 bg-brand-green/30" />
                  <span className="text-brand-green text-xs">☾</span>
                  <h2 className="font-heading font-bold text-brand-green text-lg tracking-tight">
                    Work For Hire
                  </h2>
                  <span className="text-brand-green text-xs">☾</span>
                  <span className="h-px flex-1 bg-brand-green/30" />
                </div>
                <dl className="space-y-4">
                  {creative.ratePublic && (creative.rateRange || creative.rateStructure) && (
                    <WfhRow
                      label="Rate structure"
                      value={[creative.rateStructure, creative.ratePublic ? creative.rateRange : null]
                        .filter(Boolean)
                        .join(" · ")}
                    />
                  )}
                  {headlineLink && (
                    <div>
                      <dt className="font-semibold text-brand-brown mb-0.5">Work Portfolio</dt>
                      <dd>
                        <a
                          href={normalizeUrl(headlineLink)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-brand-green underline decoration-brand-green/30 underline-offset-2 hover:decoration-brand-green"
                        >
                          <GlobeGlyph /> {headlineLink.replace(/^https?:\/\//, "")}
                        </a>
                      </dd>
                    </div>
                  )}
                  {creative.collaborationPreferences && (
                    <WfhRow label="Open to working with" value={creative.collaborationPreferences} />
                  )}
                  {creative.roles.length > 0 && (
                    <div>
                      <dt className="font-semibold text-brand-brown mb-2">Role(s)</dt>
                      <dd className="flex flex-wrap gap-2">
                        {creative.roles.map((r) => (
                          <span
                            key={r}
                            className="text-xs uppercase font-semibold border border-brand-green/40 text-brand-green px-3 py-1 rounded-full"
                          >
                            {r}
                          </span>
                        ))}
                      </dd>
                    </div>
                  )}
                  {creative.travel && <WfhRow label="Travel" value={creative.travel} />}
                </dl>
              </div>
            )}
          </div>
        )}

        {/* Locked CTA for non-paid viewers */}
        {!showFull && (
          <div className="mt-6 bg-brand-cream/95 rounded-3xl p-7 text-center max-w-xl print:hidden">
            <div className="text-2xl mb-2">🔒</div>
            <p className="text-brand-green font-semibold mb-1">Full profile locked</p>
            <p className="text-brand-brown/60 text-sm mb-4">
              Subscribe to see education, languages, work samples, all social links, and to submit
              contact requests.
            </p>
            <Link
              href="/subscribe"
              className="inline-block bg-brand-green hover:bg-brand-green/90 text-brand-cream font-semibold px-6 py-2.5 rounded-full transition-colors text-sm"
            >
              Subscribe — from {prices.monthly}/month
            </Link>
          </div>
        )}

        {/* Contact request CTA for paid users */}
        {showFull && session && (
          <div className="mt-6 bg-brand-mint rounded-3xl p-7 max-w-xl print:hidden">
            <p className="text-brand-green mb-3 text-sm">
              <span className="font-semibold">Want to work with {creative.firstName}?</span>{" "}
              Submit a contact request and our team will facilitate the introduction.
            </p>
            <Link
              href={`/directory/${creative.slug}/request`}
              className="inline-block bg-brand-green text-brand-cream font-semibold px-5 py-2.5 rounded-full hover:bg-brand-green/90 transition-colors text-sm"
            >
              Submit contact request →
            </Link>
          </div>
        )}

        {/* More work samples (paid) */}
        {showFull && otherSamples.length > 0 && (
          <div className="mt-6 bg-brand-cream rounded-3xl p-7 max-w-xl">
            <p className="font-heading font-bold text-brand-green text-sm mb-3">
              More Work Samples
            </p>
            <div className="space-y-2">
              {otherSamples.map((ws, i) => (
                <div key={i} className="flex items-start justify-between gap-2 text-sm">
                  <div>
                    <span className="text-brand-brown">{ws.title}</span>
                    {ws.role && <span className="text-brand-brown/50"> · {ws.role}</span>}
                    {ws.medium && <span className="text-brand-brown/50"> · {ws.medium}</span>}
                    {ws.year && <span className="text-brand-brown/50"> · {ws.year}</span>}
                  </div>
                  {ws.link && (
                    <a
                      href={ws.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-green hover:text-brand-green/70 shrink-0"
                    >
                      ↗
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function IdentityCard({
  fullName,
  subtitle,
  headshot,
  location,
  roles,
  experienceLevel,
  headlineLink,
  showRolesAsPills,
  className = "",
}: {
  fullName: string;
  subtitle: string;
  headshot: string | null;
  location: string | null;
  roles: string[];
  experienceLevel: string | null;
  headlineLink: string | null;
  showRolesAsPills: boolean;
  className?: string;
}) {
  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
  return (
    <div className={`bg-brand-cream rounded-3xl p-7 sm:p-8 ${className}`}>
      {/* Free profiles don't include a headshot slot at all (not just a hidden one) —
          per the client's Free Access spec, a photo is a member-tier field. */}
      {showRolesAsPills &&
        (headshot ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={headshot}
            alt={fullName}
            className="w-28 h-28 rounded-2xl object-cover mb-5"
          />
        ) : (
          <div className="w-20 h-20 rounded-2xl bg-brand-mint/40 flex items-center justify-center text-brand-green font-heading font-bold text-2xl mb-5">
            {initials}
          </div>
        ))}
      <h1 className="font-heading font-bold text-3xl sm:text-4xl text-brand-brown leading-[0.95] tracking-tight">
        {fullName}
      </h1>
      {subtitle && <p className="text-sm text-brand-brown/60 mt-2">{subtitle}</p>}

      <div className="flex flex-wrap gap-2 mt-5">
        {location && (
          <span className="text-xs uppercase font-semibold bg-brand-mint text-brand-green px-3 py-1 rounded-full">
            {location}
          </span>
        )}
        {showRolesAsPills
          ? roles.map((r) => (
              <span
                key={r}
                className="text-xs uppercase font-semibold bg-brand-mint text-brand-green px-3 py-1 rounded-full"
              >
                {r}
              </span>
            ))
          : roles.length > 0 && (
              <span className="text-xs uppercase font-semibold bg-brand-green text-brand-cream px-3 py-1 rounded-full">
                {formatRoleLine(roles)}
              </span>
            )}
        {experienceLevel && (
          <span className="text-xs uppercase font-semibold bg-brand-green text-brand-cream px-3 py-1 rounded-full">
            {experienceLevel}
          </span>
        )}
      </div>

      {headlineLink && (
        <a
          href={normalizeUrl(headlineLink)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-brand-green font-medium hover:text-brand-green/70 transition-colors mt-5"
        >
          <GlobeGlyph /> {headlineLink.replace(/^https?:\/\//, "")}
        </a>
      )}
    </div>
  );
}

function BiographyCard({ bio, className = "" }: { bio: string; className?: string }) {
  return (
    <div className={`bg-brand-mint rounded-3xl p-7 sm:p-8 ${className}`}>
      <p className="font-heading font-bold text-brand-green text-sm tracking-wide mb-3">
        Biography
      </p>
      <p className="text-brand-green/90 text-sm leading-relaxed">{bio}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-heading font-bold text-sm tracking-wide">{label}</p>
      <p className="text-brand-cream/80 text-sm mt-1 leading-relaxed">{value}</p>
    </div>
  );
}

function WfhRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-semibold text-brand-brown mb-0.5">{label}</dt>
      <dd className="text-brand-brown/80 text-sm">{value}</dd>
    </div>
  );
}

function ProjectEmbed({ link }: { link: string }) {
  const embed = toEmbedUrl(link);
  return (
    <div>
      <p className="font-heading font-bold text-sm tracking-wide mb-2">Project Link</p>
      {embed ? (
        <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
          <iframe
            src={embed}
            title="Work sample"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      ) : (
        <a
          href={normalizeUrl(link)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex aspect-video w-full items-center justify-center rounded-xl bg-black text-brand-cream/80 hover:text-brand-cream"
        >
          <span className="inline-flex items-center gap-2 text-sm">
            <span className="grid place-items-center w-10 h-10 rounded-full bg-red-600 text-white">▶</span>
            View Project ↗
          </span>
        </a>
      )}
    </div>
  );
}

function GlobeGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" />
    </svg>
  );
}

function SocialIcon({ href, kind }: { href: string; kind: "globe" | "instagram" | "linkedin" | "imdb" | "play" }) {
  const glyph: Record<typeof kind, React.ReactNode> = {
    globe: <GlobeGlyph />,
    instagram: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
    linkedin: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.3c0-1.26-.02-2.9-1.77-2.9-1.77 0-2.04 1.38-2.04 2.8V21H9z" />
      </svg>
    ),
    imdb: <span className="text-[10px] font-bold tracking-tight">IMDb</span>,
    play: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M8 5v14l11-7z" />
      </svg>
    ),
  };
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="grid place-items-center w-9 h-9 rounded-lg bg-brand-cream/15 hover:bg-brand-cream/30 text-brand-cream transition-colors"
    >
      {glyph[kind]}
    </a>
  );
}
