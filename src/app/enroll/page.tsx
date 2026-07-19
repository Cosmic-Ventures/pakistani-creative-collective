import type { Metadata } from "next";
import EnrollForm from "@/components/EnrollForm";

export const metadata: Metadata = {
  title: "Apply to Join",
  description: "Apply to join the Pakistani Creative Collective database.",
};

export default function EnrollPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="font-heading font-bold text-3xl text-brand-green mb-2">Apply to Join PCC</h1>
      <p className="text-brand-brown/70 mb-2">
        All applications are reviewed manually by Aneesa Talks. Being listed is free.
      </p>
      <p className="text-brand-brown/50 text-sm mb-10">
        This form takes approximately 10–15 minutes. Have your portfolio URL, professional bio (200 words max), and three references ready.
      </p>
      <EnrollForm />
    </div>
  );
}
