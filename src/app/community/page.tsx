import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import CommunityFeed from "@/components/CommunityFeed";
import NewPostForm from "@/components/NewPostForm";

export const metadata: Metadata = { title: "Community" };
export const dynamic = "force-dynamic";

export default async function CommunityPage() {
  const session = await getSession();
  if (!session) redirect("/auth/signin");
  if (session.role === "UNPAID") redirect("/subscribe");

  const myCreative = await db.creative.findFirst({ where: { userId: session.userId } });

  const posts = await db.post.findMany({
    where: {
      status: "APPROVED",
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: { createdAt: "desc" },
    include: {
      creative: { select: { firstName: true, lastName: true, roles: true, slug: true } },
      reactions: { select: { creativeId: true, type: true } },
      comments: {
        where: { isRemoved: false },
        orderBy: { createdAt: "asc" },
        include: { creative: { select: { firstName: true, lastName: true, roles: true } } },
      },
    },
  });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="font-heading font-bold text-3xl text-brand-green mb-2">Community Dashboard</h1>
      <p className="text-brand-brown/70 mb-8">
        Recent work, funding needs, collaborators, and availability — shared by PCC members.
      </p>

      {myCreative ? (
        <NewPostForm />
      ) : (
        <div className="bg-brand-mint/15 border border-brand-mint/50 rounded-xl px-5 py-4 mb-8 text-sm text-brand-brown/80">
          Posting is available to listed creatives with a linked account. Contact Aneesa Talks to link your profile
          if you&apos;re a member of the database.
        </div>
      )}

      <CommunityFeed posts={posts} myCreativeId={myCreative?.id ?? null} />
    </div>
  );
}
