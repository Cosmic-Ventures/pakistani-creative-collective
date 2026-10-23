import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Sent Email · Admin" };
export const dynamic = "force-dynamic";

export default async function SentEmailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const email = await db.emailLog.findUnique({ where: { id } });
  if (!email) notFound();

  return (
    <div>
      <Link href="/admin/sent-emails" className="text-sm text-stone-500 hover:text-stone-300">
        ← Sent Emails
      </Link>
      <h2 className="text-lg font-semibold text-white mt-3 mb-1">{email.subject}</h2>
      <p className="text-xs text-stone-500 mb-1">
        To {email.to} · {email.createdAt.toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })} ·{" "}
        {email.kind} · {email.status === "sent" ? "Sent" : `Failed${email.error ? `: ${email.error}` : ""}`}
      </p>
      {email.batchId && (
        <Link href={`/admin/sent-emails?batch=${email.batchId}`} className="text-xs text-emerald-500 hover:text-emerald-400">
          See everyone who got this mass email →
        </Link>
      )}
      {/* sandbox with no permissions: this is stored HTML, rendered without scripts or navigation. */}
      <iframe
        title="Email as sent"
        sandbox=""
        srcDoc={email.html}
        className="w-full h-[75vh] mt-4 rounded-xl bg-white border border-stone-800"
      />
    </div>
  );
}
