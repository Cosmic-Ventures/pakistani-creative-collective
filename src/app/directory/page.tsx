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
      location: true,
      roles: true,
      experienceLevel: true,
      featured: true,
      featuredUntil: true,
      // paid fields — only include if user is paid
      ...(isPaid
        ? {
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
          <h1 className="font-heading font-bold text-3xl text-brand-green">Member Directory</h1>
          <p className="text-brand-brown/70 mt-1">
            {creatives.length} verified Pakistani creatives in film, music, and media.
          </p>
        </div>
        {!isPaid && (
          <Link
            href="/subscribe"
            className="shrink-0 bg-brand-green hover:bg-brand-green/90 text-brand-cream text-sm font-semibold px-5 py-2.5 rounded-full transition-colors"
          >
            Unlock full profiles →
          </Link>
        )}
      </div>

      {!isPaid && (
        <div className="bg-brand-mint/15 border border-brand-mint/50 rounded-xl px-5 py-4 mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="text-2xl">🔒</div>
          <div className="text-sm text-brand-brown/80">
            <span className="text-brand-green font-semibold">You&apos;re browsing in preview mode.</span>{" "}
            You can see each creative&apos;s name, role, experience level, location, and bio. Subscribe to
            unlock headshots, search & filter, work samples, and contact requests.
          </div>
        </div>
      )}

      <DirectoryClient members={creatives as Parameters<typeof DirectoryClient>[0]["members"]} isPaid={isPaid} />
    </div>
  );
}
