import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getMembers, getMemberBySlug } from "@/lib/sheets";

export const revalidate = 3600;

export async function generateStaticParams() {
  const members = await getMembers();
  return members.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const member = await getMemberBySlug(slug);
  if (!member) return {};
  return {
    title: member.name,
    description: `${member.profession} · ${member.location} — Pakistani Creative Collective member`,
  };
}

export default async function MemberPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const member = await getMemberBySlug(slug);
  if (!member) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <Link
        href="/directory"
        className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-300 transition-colors mb-8"
      >
        ← Directory
      </Link>

      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-emerald-900/60 border border-emerald-700/40 flex items-center justify-center text-emerald-300 font-bold text-xl">
            {member.firstName[0] ?? "?"}
            {member.lastName[0] ?? ""}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {member.name}
              {member.pronouns && (
                <span className="ml-2 text-sm text-stone-500 font-normal">
                  ({member.pronouns})
                </span>
              )}
            </h1>
            {member.profession && (
              <p className="text-stone-400 mt-0.5">{member.profession}</p>
            )}
          </div>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {member.mediaType && (
            <div>
              <dt className="text-stone-500 text-xs uppercase tracking-wide mb-1">
                Media Type
              </dt>
              <dd className="text-stone-200">{member.mediaType}</dd>
            </div>
          )}
          {member.location && (
            <div>
              <dt className="text-stone-500 text-xs uppercase tracking-wide mb-1">
                Location
              </dt>
              <dd className="text-stone-200">{member.location}</dd>
            </div>
          )}
        </dl>

        {member.notes && (
          <div className="mt-6 pt-6 border-t border-stone-800">
            <p className="text-stone-500 text-xs uppercase tracking-wide mb-2">
              Notes
            </p>
            <p className="text-stone-300 text-sm leading-relaxed">
              {member.notes}
            </p>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-stone-800 flex flex-wrap gap-3">
          {member.imdb && (
            <a
              href={
                member.imdb.startsWith("http")
                  ? member.imdb
                  : `https://imdb.com/name/${member.imdb}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 hover:text-white px-4 py-2 rounded-lg transition-colors"
            >
              IMDb ↗
            </a>
          )}
          {member.instagram && (
            <a
              href={
                member.instagram.startsWith("http")
                  ? member.instagram
                  : `https://instagram.com/${member.instagram.replace("@", "")}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 hover:text-white px-4 py-2 rounded-lg transition-colors"
            >
              Instagram ↗
            </a>
          )}
          {member.linkedin && (
            <a
              href={
                member.linkedin.startsWith("http")
                  ? member.linkedin
                  : `https://linkedin.com/in/${member.linkedin}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 hover:text-white px-4 py-2 rounded-lg transition-colors"
            >
              LinkedIn ↗
            </a>
          )}
        </div>
      </div>

      <div className="mt-8 bg-emerald-950/40 border border-emerald-900/40 rounded-xl p-6 text-sm">
        <p className="text-stone-400">
          <span className="text-emerald-400 font-medium">Want to work with {member.firstName}?</span>{" "}
          Submit a talent request and our team will handle the introduction.
        </p>
        <Link
          href="/request"
          className="inline-block mt-3 text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
        >
          Submit a talent request →
        </Link>
      </div>
    </div>
  );
}
