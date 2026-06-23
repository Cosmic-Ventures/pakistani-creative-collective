import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Application Submitted" };

export default function EnrollSuccessPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-brand-mint/30 border border-brand-mint flex items-center justify-center text-3xl mx-auto mb-6">
          ✓
        </div>
        <h1 className="font-heading font-extrabold uppercase text-2xl text-brand-green mb-3">Application submitted!</h1>
        <p className="text-brand-brown/70 mb-6 leading-relaxed">
          Thank you for applying to the Pakistani Creative Collective. Aneesa Talks will review your application and be in touch via email.
        </p>
        <Link href="/" className="text-brand-green hover:text-brand-green/70 transition-colors text-sm">
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
