import type { Metadata } from "next";
import Link from "next/link";
import AuthForm from "@/components/AuthForm";
import { signupAction } from "@/lib/auth-actions";

export const metadata: Metadata = { title: "Create Account" };

export default function SignupPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="font-heading font-extrabold uppercase text-2xl text-brand-green mb-2">Create an account</h1>
        <p className="text-brand-brown/70 text-sm mb-8">
          Free to sign up. A paid subscription unlocks the full directory.
        </p>
        <AuthForm mode="signup" action={signupAction} />
        <p className="text-center text-sm text-brand-brown/50 mt-6">
          Already have an account?{" "}
          <Link href="/auth/signin" className="text-brand-green hover:text-brand-green/70">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
