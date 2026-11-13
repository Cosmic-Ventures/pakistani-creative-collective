import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import EnrollForm from "@/components/EnrollForm";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { loadEnrollmentDraft } from "@/lib/enroll-draft-actions";
import { gateEnabled } from "@/lib/site-gate";

export const metadata: Metadata = {
  title: "Apply to Join",
  description: "Apply to join the Pakistani Creative Collective database.",
};

// A signed-in applicant's saved draft is per-user state, so this page can't be
// statically cached.
export const dynamic = "force-dynamic";

export default async function EnrollPage() {
  // proxy.ts already bounces anonymous requests to /auth/signin?next=/enroll
  // at the edge, but that check only verifies the JWT's signature — it can't
  // confirm the account still exists. This is the real check, same pattern as
  // account/page.tsx.
  const session = await getSession();
  if (!session) redirect("/auth/signin?next=/enroll");

  // A signed-in applicant is linked to their listing at submit time
  // (enrollAction), so someone who already has one — pending, approved, or
  // rejected — shouldn't be able to file a second, unlinked application.
  const existingCreative = await db.creative.findUnique({
    where: { userId: session.userId },
    select: { status: true },
  });
  if (existingCreative) {
    // /account is behind the pre-launch gate for everyone but admins (see
    // site-gate.ts), so pointing applicants at "My Account" there is a dead
    // link until launch — it just bounces them back to this page.
    const accountIsReachable = !gateEnabled();
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="font-heading font-bold text-3xl text-black mb-2">Apply to Join the PCC</h1>
        <p className="text-black/70">
          {existingCreative.status === "APPROVED" && accountIsReachable ? (
            <>
              This account already has an application on file and it&apos;s approved — edit it from{" "}
              <Link href="/account?tab=profile" className="text-brand-green font-semibold hover:underline">
                My Account → My Profile
              </Link>
              .
            </>
          ) : (
            <>
              This account already has an application on file (currently{" "}
              {existingCreative.status.toLowerCase()}) — email pcc@aneesatalks.com if you need to change it.
            </>
          )}
        </p>
      </div>
    );
  }

  const draft = await loadEnrollmentDraft();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="font-heading font-bold text-3xl text-black mb-2">Apply to Join the PCC</h1>
      <p className="text-black/70 mb-2">
        All applications are reviewed manually by Aneesa Talks. Being listed is free.
      </p>
      <p className="text-black/50 text-sm mb-10">
        This form takes approximately 10–15 minutes. Only a few fields are required — you can leave
        the rest blank and still apply. Use “Save progress” at any point to finish it later.
      </p>
      <EnrollForm
        initialDraft={draft?.data ?? null}
        draftSavedAt={draft?.savedAt ?? null}
        canSaveProgress
      />
    </div>
  );
}
