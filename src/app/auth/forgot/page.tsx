import type { Metadata } from "next";
import Link from "next/link";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";

export const metadata: Metadata = { title: "Forgot Password" };

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="font-heading font-bold text-2xl text-brand-green mb-2">Forgot your password?</h1>
        <p className="text-brand-brown/70 text-sm mb-8">
          Enter the email address you signed up with and we&apos;ll send you a link to set a new
          password.
        </p>
        <ForgotPasswordForm />
        <p className="text-center text-sm text-brand-brown/50 mt-6">
          Remembered it?{" "}
          <Link href="/auth/signin" className="text-brand-green hover:text-brand-green/70">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
