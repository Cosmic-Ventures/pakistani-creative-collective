import type { Metadata } from "next";
import EnrollForm from "@/components/EnrollForm";

export const metadata: Metadata = {
  title: "Apply to Join",
  description: "Apply to join the Pakistani Creative Collective database.",
};

export default function EnrollPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-white mb-2">Apply to Join PCC</h1>
      <p className="text-stone-400 mb-2">
        All applications are reviewed manually by Aneesa Talks. Being listed is free.
      </p>
      <p className="text-stone-500 text-sm mb-10">
        This form takes approximately 10–15 minutes. Have your portfolio URL, professional bio (300–450 words), and three references ready.
      </p>
      <EnrollForm />
    </div>
  );
}
