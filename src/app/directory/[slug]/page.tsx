import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

function formatRoleLine(roles: string[]): string {
  if (roles.length === 0) return "";
  if (roles.length === 1) return roles[0];
  if (roles.length === 2) return `${roles[0]} & ${roles[1]}`;
  return `${roles.slice(0, -1).join(", ")}, & ${roles[roles.length - 1]}`;
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

  const showFull = isPaid || isFeaturedNow(creative);
  const headlineLink = creative.website ?? creative.publicLink;
  const workSamples = (creative.workSamples as
    | { title?: string; role?: string; link?: string; medium?: string; year?: string }[]
    | null) ?? [];
  const [primarySample, ...otherSamples] = workSamples;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <Link
        href="/directory"
        className="inline-flex items-center gap-1 text-sm text-brand-brown/50 hover:text-brand-brown transition-colors mb-8"
      >
        ← Directory
      </Link>

      <div className="bg-white border border-brand-green/10 rounded-2xl p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-5">
          {showFull && creative.headshot ? (
            <img
              src={creative.headshot}
              alt={`${creative.firstName} ${creative.lastName}`}
              className="w-16 h-16 rounded-full object-cover border border-brand-green/15"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-brand-mint/30 border border-brand-mint flex items-center justify-center text-brand-green font-bold text-xl">
              {creative.firstName[0]}{creative.lastName[0]}
            </div>
          )}
          <div>
            <h1 className="font-heading font-extrabold uppercase text-2xl text-brand-green leading-tight">
              {creative.firstName} {creative.lastName}
            </h1>
            <p className="text-sm text-brand-brown/60">
              {creative.pronouns && `${creative.pronouns}`}
              {creative.pronouns && creative.location && " · "}
              {creative.location}
            </p>
          </div>
        </div>

        {/* Badges — role(s) + experience level, visible to everyone */}
        <div className="flex flex-wrap gap-2 mb-5">
          {showFull
            ? creative.roles.map((r) => (
                <span key={r} className="text-xs uppercase font-semibold bg-brand-mint/25 border border-brand-mint text-brand-green px-3 py-1 rounded-full">
                  {r}
                </span>
              ))
            : creative.roles.length > 0 && (
                <span className="text-xs uppercase font-semibold bg-brand-mint/25 border border-brand-mint text-brand-green px-3 py-1 rounded-full">
                  {formatRoleLine(creative.roles)}
                </span>
              )}
          {creative.experienceLevel && (
            <span className="text-xs uppercase font-semibold bg-brand-green text-brand-cream px-3 py-1 rounded-full">
              {creative.experienceLevel}
            </span>
          )}
        </div>

        {/* Headline link — always visible */}
        {headlineLink && (
          <a
            href={headlineLink.startsWith("http") ? headlineLink : `https://${headlineLink}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-brand-green font-medium hover:text-brand-green/70 transition-colors mb-6"
          >
            {headlineLink.replace(/^https?:\/\//, "")} ↗
          </a>
        )}

        {/* Bio — always visible */}
        <div className="bg-brand-mint/15 border border-brand-mint/40 rounded-xl p-5 mb-6">
          <p className="text-xs uppercase tracking-wide text-brand-green/70 font-semibold mb-2">Biography</p>
          <p className="text-brand-brown/90 text-sm leading-relaxed">{creative.bio}</p>
        </div>

        {/* PAID TIER CONTENT */}
        {showFull ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm mb-6">
              {creative.education && (
                <div>
                  <dt className="text-brand-brown/50 text-xs uppercase tracking-wide mb-1">Education</dt>
                  <dd className="text-brand-brown/90">{creative.education}</dd>
                </div>
              )}
              {creative.availability && (
                <div>
                  <dt className="text-brand-brown/50 text-xs uppercase tracking-wide mb-1">Availability</dt>
                  <dd className="text-brand-brown/90">{creative.availability}</dd>
                </div>
              )}
              {creative.languages.length > 0 && (
                <div>
                  <dt className="text-brand-brown/50 text-xs uppercase tracking-wide mb-1">Language(s)</dt>
                  <dd className="text-brand-brown/90">{creative.languages.join(", ")}</dd>
                </div>
              )}
              {creative.mediums.length > 0 && (
                <div>
                  <dt className="text-brand-brown/50 text-xs uppercase tracking-wide mb-1">Medium(s)</dt>
                  <dd className="text-brand-brown/90">{creative.mediums.join(", ")}</dd>
                </div>
              )}
            </div>

            {/* Connect — social icons row */}
            <div className="flex flex-wrap gap-3 mb-6">
              {headlineLink && <SocialLink href={headlineLink} label="Website" />}
              {creative.instagram && <SocialLink href={creative.instagram} label="Instagram" prefix="https://instagram.com/" />}
              {creative.linkedin && <SocialLink href={creative.linkedin} label="LinkedIn" prefix="https://linkedin.com/in/" />}
              {creative.imdb && <SocialLink href={creative.imdb} label="IMDb" />}
              {creative.vimeo && <SocialLink href={creative.vimeo} label="Vimeo / YouTube" />}
            </div>

            {/* Primary Work Sample */}
            {primarySample && (
              <div className="border border-brand-green/15 rounded-xl p-5 mb-6">
                <p className="text-xs uppercase tracking-wide text-brand-green/70 font-semibold mb-3">Primary Work Sample</p>
                <p className="text-brand-brown font-semibold">
                  {primarySample.title}
                  {primarySample.medium && <span className="text-brand-brown/50 font-normal"> · {primarySample.medium}</span>}
                  {primarySample.year && <span className="text-brand-brown/50 font-normal"> · {primarySample.year}</span>}
                </p>
                {primarySample.role && <p className="text-sm text-brand-brown/60 mt-1">Role(s): {primarySample.role}</p>}
                {primarySample.link && (
                  <a
                    href={primarySample.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-3 text-sm bg-brand-green text-brand-cream px-4 py-2 rounded-full hover:bg-brand-green/90 transition-colors"
                  >
                    View Project ↗
                  </a>
                )}
              </div>
            )}

            {otherSamples.length > 0 && (
              <div className="mb-6">
                <p className="text-xs uppercase tracking-wide text-brand-green/70 font-semibold mb-3">More Work Samples</p>
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
                        <a href={ws.link} target="_blank" rel="noopener noreferrer" className="text-brand-green hover:text-brand-green/70 shrink-0">↗</a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {creative.notableAchievements && (
              <div className="mb-6">
                <p className="text-brand-green/70 text-xs uppercase tracking-wide font-semibold mb-2">Notable Achievements</p>
                <p className="text-brand-brown/90 text-sm leading-relaxed">{creative.notableAchievements}</p>
              </div>
            )}

            {/* Work For Hire */}
            {(creative.rateStructure || creative.collaborationPreferences || creative.travel || headlineLink) && (
              <div className="border-2 border-brand-green/20 rounded-xl p-5">
                <p className="text-xs uppercase tracking-wide text-brand-green font-semibold mb-3">Work For Hire</p>
                <dl className="space-y-3 text-sm">
                  {creative.ratePublic && creative.rateRange && (
                    <div>
                      <dt className="text-brand-brown/50 text-xs uppercase tracking-wide mb-1">Rate Structure</dt>
                      <dd className="text-brand-brown/90">
                        {creative.rateStructure && `${creative.rateStructure} · `}{creative.rateRange}
                      </dd>
                    </div>
                  )}
                  {headlineLink && (
                    <div>
                      <dt className="text-brand-brown/50 text-xs uppercase tracking-wide mb-1">Work Portfolio</dt>
                      <dd><a href={headlineLink.startsWith("http") ? headlineLink : `https://${headlineLink}`} target="_blank" rel="noopener noreferrer" className="text-brand-green hover:text-brand-green/70">{headlineLink.replace(/^https?:\/\//, "")} ↗</a></dd>
                    </div>
                  )}
                  {creative.collaborationPreferences && (
                    <div>
                      <dt className="text-brand-brown/50 text-xs uppercase tracking-wide mb-1">Open to working with</dt>
                      <dd className="text-brand-brown/90">{creative.collaborationPreferences}</dd>
                    </div>
                  )}
                  {creative.preferredProjectTypes.length > 0 && (
                    <div>
                      <dt className="text-brand-brown/50 text-xs uppercase tracking-wide mb-1">Preferred Projects</dt>
                      <dd className="text-brand-brown/90">{creative.preferredProjectTypes.join(", ")}</dd>
                    </div>
                  )}
                  {creative.travel && (
                    <div>
                      <dt className="text-brand-brown/50 text-xs uppercase tracking-wide mb-1">Travel</dt>
                      <dd className="text-brand-brown/90">{creative.travel}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}
          </>
        ) : (
          /* LOCKED CTA */
          <div className="bg-brand-green/5 border border-brand-green/15 rounded-xl p-5 text-center">
            <div className="text-2xl mb-2">🔒</div>
            <p className="text-brand-green font-semibold mb-1">Full profile locked</p>
            <p className="text-brand-brown/60 text-sm mb-4">
              Subscribe to see education, languages, work samples, all social links, and to submit contact requests.
            </p>
            <Link
              href="/subscribe"
              className="inline-block bg-brand-green hover:bg-brand-green/90 text-brand-cream font-semibold px-6 py-2.5 rounded-full transition-colors text-sm"
            >
              Subscribe — from $30/year
            </Link>
          </div>
        )}
      </div>

      {/* Contact request CTA for paid users */}
      {showFull && session && (
        <div className="mt-6 bg-brand-mint/15 border border-brand-mint/40 rounded-xl p-6 text-sm">
          <p className="text-brand-brown/80 mb-3">
            <span className="text-brand-green font-semibold">Want to work with {creative.firstName}?</span>{" "}
            Submit a contact request and our team will facilitate the introduction.
          </p>
          <Link
            href={`/directory/${creative.slug}/request`}
            className="inline-block text-brand-green font-medium hover:text-brand-green/70 transition-colors"
          >
            Submit contact request →
          </Link>
        </div>
      )}
    </div>
  );
}

function SocialLink({ href, label, prefix }: { href: string; label: string; prefix?: string }) {
  const url = href.startsWith("http") ? href : `${prefix ?? "https://"}${href.replace(/^@/, "")}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-sm bg-brand-green/5 hover:bg-brand-green/10 border border-brand-green/20 text-brand-green px-4 py-2 rounded-lg transition-colors"
    >
      {label} ↗
    </a>
  );
}
