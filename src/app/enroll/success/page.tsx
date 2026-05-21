import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Application Submitted" };

export default function EnrollSuccessPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-900/60 border border-emerald-700 flex items-center justify-center text-3xl mx-auto mb-6">
          ✓
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">Application submitted!</h1>
        <p className="text-stone-400 mb-6 leading-relaxed">
          Thank you for applying to the Pakistani Creative Collective. Aneesa Talks will review your application and be in touch via email.
        </p>
        <Link href="/" className="text-emerald-400 hover:text-emerald-300 transition-colors text-sm">
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
