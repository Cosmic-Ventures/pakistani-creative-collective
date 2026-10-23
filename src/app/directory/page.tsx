import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import SpotlightProfile from "@/components/SpotlightProfile";
import { getSpotlights } from "@/lib/spotlight";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import DirectoryClient from "@/components/DirectoryClient";

export const metadata: Metadata = {
  title: "Directory",
  description: "Browse Pakistani creatives in film, music, and media.",
};

export default async function DirectoryPage() {
  const session = await getSession();
  const spotlights = await getSpotlights();
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
      // mediums is filterable by everyone (free tier filters by medium + location only);
      // the rest stay paid-gated.
      mediums: true,
      // Photos are visible to everyone (10/02 round).
      headshot: true,
      ...(isPaid
        ? {
            languages: true,
            availability: true,
            preferredProjectTypes: true,
            rateStructure: true,
            rateRange: true,
            ratePublic: true,
          }
        : {}),
    },
  });

  return (
    // 10/22 round: same textured green as the profile pages, with white and grey
    // text on top. Cards carry a white outline and drop shadow so they stand off it.
    <div className="relative bg-brand-green">
      <Image
        src="/brand/hero-bg.png"
        alt=""
        fill
        priority
        className="object-cover opacity-70 pointer-events-none select-none"
      />
    <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <SpotlightProfile creatives={spotlights} />

      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-3xl text-brand-cream">Member Directory</h1>
          <p className="text-brand-cream/70 mt-1">
            {creatives.length} verified Pakistani creatives in film, music, and media.
          </p>
        </div>
        {!isPaid && (
          <Link
            href="/subscribe"
            className="shrink-0 bg-brand-cream hover:bg-white text-brand-green text-sm font-semibold px-5 py-2.5 rounded-full transition-colors"
          >
            Unlock full profiles →
          </Link>
        )}
      </div>

      {!isPaid && (
        <div className="bg-brand-green border border-white/70 shadow-lg shadow-black/40 rounded-xl px-5 py-4 mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="text-2xl">🔒</div>
          <div className="text-sm text-brand-cream/80">
            <span className="text-brand-cream font-semibold">You&apos;re browsing in preview mode.</span>{" "}
            You can see each creative&apos;s photo, name, role, location, and bio, and filter by role,
            medium, and location. Subscribe to unlock full profiles, advanced search, and contact requests.
          </div>
        </div>
      )}

      <DirectoryClient members={creatives as Parameters<typeof DirectoryClient>[0]["members"]} isPaid={isPaid} />
    </div>
    </div>
  );
}
