import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

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

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <Link
        href="/directory"
        className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-300 transition-colors mb-8"
      >
        ← Directory
      </Link>

      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          {showFull && creative.headshot ? (
            <img
              src={creative.headshot}
              alt={`${creative.firstName} ${creative.lastName}`}
              className="w-16 h-16 rounded-full object-cover border border-stone-700"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-emerald-900/60 border border-emerald-700/40 flex items-center justify-center text-emerald-300 font-bold text-xl">
              {creative.firstName[0]}{creative.lastName[0]}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-white">
              {creative.firstName} {creative.lastName}
              {creative.pronouns && (
                <span className="ml-2 text-sm text-stone-500 font-normal">({creative.pronouns})</span>
              )}
            </h1>
            {showFull && creative.experienceLevel && (
              <span className="text-xs bg-stone-800 border border-stone-700 text-stone-400 px-2 py-0.5 rounded">
                {creative.experienceLevel}
              </span>
            )}
          </div>
        </div>

        {/* Bio — always visible */}
        <div className="mb-6">
          <p className="text-stone-300 text-sm leading-relaxed">{creative.bio}</p>
        </div>

        {/* Public link — always visible */}
        {creative.publicLink && (
          <a
            href={creative.publicLink.startsWith("http") ? creative.publicLink : `https://${creative.publicLink}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 transition-colors mb-6"
          >
            {creative.publicLink.replace(/^https?:\/\//, "")} ↗
          </a>
        )}

        {/* PAID TIER CONTENT */}
        {showFull ? (
          <>
            <div className="border-t border-stone-800 pt-6 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
              {creative.roles.length > 0 && (
                <div>
                  <dt className="text-stone-500 text-xs uppercase tracking-wide mb-1">Roles</dt>
                  <dd className="text-stone-200">{creative.roles.join(", ")}</dd>
                </div>
              )}
              {creative.mediums.length > 0 && (
                <div>
                  <dt className="text-stone-500 text-xs uppercase tracking-wide mb-1">Mediums</dt>
                  <dd className="text-stone-200">{creative.mediums.join(", ")}</dd>
                </div>
              )}
              {creative.languages.length > 0 && (
                <div>
                  <dt className="text-stone-500 text-xs uppercase tracking-wide mb-1">Languages</dt>
                  <dd className="text-stone-200">{creative.languages.join(", ")}</dd>
                </div>
              )}
              {creative.availability && (
                <div>
                  <dt className="text-stone-500 text-xs uppercase tracking-wide mb-1">Availability</dt>
                  <dd className="text-stone-200">{creative.availability}</dd>
                </div>
              )}
              {creative.ratePublic && creative.rateRange && (
                <div>
                  <dt className="text-stone-500 text-xs uppercase tracking-wide mb-1">Rate</dt>
                  <dd className="text-stone-200">
                    {creative.rateStructure && `${creative.rateStructure} · `}{creative.rateRange}
                  </dd>
                </div>
              )}
              {creative.preferredProjectTypes.length > 0 && (
                <div className="sm:col-span-2">
                  <dt className="text-stone-500 text-xs uppercase tracking-wide mb-1">Preferred Projects</dt>
                  <dd className="text-stone-200">{creative.preferredProjectTypes.join(", ")}</dd>
                </div>
              )}
            </div>

            {creative.notableAchievements && (
              <div className="mt-5 pt-5 border-t border-stone-800">
                <p className="text-stone-500 text-xs uppercase tracking-wide mb-2">Notable Achievements</p>
                <p className="text-stone-300 text-sm leading-relaxed">{creative.notableAchievements}</p>
              </div>
            )}

            {(creative.workSamples as { title?: string; role?: string; link?: string; medium?: string; year?: string }[] | null)?.length ? (
              <div className="mt-5 pt-5 border-t border-stone-800">
                <p className="text-stone-500 text-xs uppercase tracking-wide mb-3">Work Samples</p>
                <div className="space-y-2">
                  {(creative.workSamples as { title?: string; role?: string; link?: string; medium?: string; year?: string }[]).map((ws, i) => (
                    <div key={i} className="flex items-start justify-between gap-2 text-sm">
                      <div>
                        <span className="text-stone-200">{ws.title}</span>
                        {ws.role && <span className="text-stone-500"> · {ws.role}</span>}
                        {ws.medium && <span className="text-stone-500"> · {ws.medium}</span>}
                        {ws.year && <span className="text-stone-500"> · {ws.year}</span>}
                      </div>
                      {ws.link && (
                        <a href={ws.link} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 shrink-0">↗</a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Social links */}
            <div className="mt-5 pt-5 border-t border-stone-800 flex flex-wrap gap-3">
              {creative.imdb && <SocialLink href={creative.imdb} label="IMDb" />}
              {creative.instagram && <SocialLink href={creative.instagram} label="Instagram" prefix="https://instagram.com/" />}
              {creative.linkedin && <SocialLink href={creative.linkedin} label="LinkedIn" prefix="https://linkedin.com/in/" />}
              {creative.website && <SocialLink href={creative.website} label="Website" />}
              {creative.vimeo && <SocialLink href={creative.vimeo} label="Vimeo" />}
            </div>
          </>
        ) : (
          /* LOCKED CTA */
          <div className="border-t border-stone-800 pt-6 mt-2">
            <div className="bg-stone-800/60 border border-stone-700 rounded-xl p-5 text-center">
              <div className="text-2xl mb-2">🔒</div>
              <p className="text-white font-semibold mb-1">Full profile locked</p>
              <p className="text-stone-400 text-sm mb-4">
                Subscribe to see roles, work samples, availability, rate info, all social links, and to submit contact requests.
              </p>
              <Link
                href="/subscribe"
                className="inline-block bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-2.5 rounded-full transition-colors text-sm"
              >
                Subscribe — from $30/year
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Contact request CTA for paid users */}
      {showFull && session && (
        <div className="mt-6 bg-emerald-950/40 border border-emerald-900/40 rounded-xl p-6 text-sm">
          <p className="text-stone-400 mb-3">
            <span className="text-emerald-400 font-medium">Want to work with {creative.firstName}?</span>{" "}
            Submit a contact request and our team will facilitate the introduction.
          </p>
          <Link
            href={`/directory/${creative.slug}/request`}
            className="inline-block text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
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
      className="inline-flex items-center gap-1.5 text-sm bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 hover:text-white px-4 py-2 rounded-lg transition-colors"
    >
      {label} ↗
    </a>
  );
}
