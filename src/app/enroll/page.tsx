import type { Metadata } from "next";
import EnrollForm from "@/components/EnrollForm";
import { getSession } from "@/lib/session";
import { loadEnrollmentDraft } from "@/lib/enroll-draft-actions";

export const metadata: Metadata = {
  title: "Apply to Join",
  description: "Apply to join the Pakistani Creative Collective database.",
};

// A signed-in applicant's saved draft is per-user state, so this page can't be
// statically cached.
export const dynamic = "force-dynamic";

export default async function EnrollPage() {
  const session = await getSession();
  const draft = await loadEnrollmentDraft();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="font-heading font-bold text-3xl text-black mb-2">Apply to Join the PCC</h1>
      <p className="text-black/70 mb-2">
        All applications are reviewed manually by Aneesa Talks. Being listed is free.
      </p>
      <p className="text-black/50 text-sm mb-10">
        This form takes approximately 10–15 minutes. Only a few fields are required — you can leave
        the rest blank and still apply.
        {session
          ? " Use “Save progress” at any point to finish it later."
          : " Sign in first if you'd like to save your progress and come back to it."}
      </p>
      <EnrollForm
        initialDraft={draft?.data ?? null}
        draftSavedAt={draft?.savedAt ?? null}
        canSaveProgress={Boolean(session)}
      />
    </div>
  );
}
