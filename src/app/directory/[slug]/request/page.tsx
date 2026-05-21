import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import ContactRequestForm from "@/components/ContactRequestForm";

export const metadata: Metadata = { title: "Contact Request" };

export default async function ContactRequestPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getSession();

  if (!session) redirect(`/auth/signin?next=/directory/${slug}/request`);
  if (session.role === "UNPAID") redirect(`/subscribe`);

  const creative = await db.creative.findUnique({
    where: { slug, status: "APPROVED" },
    select: { id: true, firstName: true, lastName: true },
  });
  if (!creative) notFound();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <Link href={`/directory/${slug}`} className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-300 transition-colors mb-8">
        ← Back to profile
      </Link>
      <h1 className="text-2xl font-bold text-white mb-2">
        Contact Request for {creative.firstName} {creative.lastName}
      </h1>
      <p className="text-stone-400 text-sm mb-8">
        This request will be reviewed by Aneesa Talks and forwarded to the creative. They decide whether to connect.
      </p>
      <ContactRequestForm creativeId={creative.id} creativeSlug={slug} userId={session.userId} />
    </div>
  );
}
