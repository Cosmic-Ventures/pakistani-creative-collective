import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import DirectoryClient from "@/components/DirectoryClient";

export const metadata: Metadata = {
  title: "Directory",
  description: "Browse Pakistani creatives in film, music, and media.",
};

export default async function DirectoryPage() {
  const session = await getSession();
  const isPaid = session?.role === "PAID" || session?.role === "ADMIN";

  const creatives = await db.creative.findMany({
    where: { status: "APPROVED" },
    orderBy: { firstName: "asc" },
    select: {
      id: true,
      slug: true,
      firstName: true,
      lastName: true,
      pronouns: true,
      bio: true,
      publicLink: true,
      featured: true,
      featuredUntil: true,
      // paid fields — only include if user is paid
      ...(isPaid
        ? {
            roles: true,
            experienceLevel: true,
            mediums: true,
            languages: true,
            availability: true,
            preferredProjectTypes: true,
            rateStructure: true,
            rateRange: true,
            ratePublic: true,
            headshot: true,
          }
        : {}),
    },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Member Directory</h1>
          <p className="text-stone-400 mt-1">
            {creatives.length} verified Pakistani creatives in film, music, and media.
          </p>
        </div>
        {!isPaid && (
          <Link
            href="/subscribe"
            className="shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors"
          >
            Unlock full profiles →
          </Link>
        )}
      </div>

      {!isPaid && (
        <div className="bg-stone-900/60 border border-stone-700 rounded-xl px-5 py-4 mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="text-2xl">🔒</div>
          <div className="text-sm text-stone-400">
            <span className="text-white font-medium">You're browsing in preview mode.</span>{" "}
            You can see each creative's name, pronouns, bio, and one link. Subscribe to unlock full
            profiles, search & filter, and contact requests.
          </div>
        </div>
      )}

      <DirectoryClient members={creatives as Parameters<typeof DirectoryClient>[0]["members"]} isPaid={isPaid} />
    </div>
  );
}
