import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import AuthForm from "@/components/AuthForm";
import { signupAction } from "@/lib/auth-actions";
import { getSession } from "@/lib/session";
import { gateEnabled } from "@/lib/site-gate";
import { signedInLanding } from "@/lib/safe-redirect";

export const metadata: Metadata = { title: "Create Account" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  // Same database-backed check as the sign-in page — see the note there.
  const session = await getSession();
  if (session) redirect(signedInLanding(next, gateEnabled()));

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="font-heading font-bold text-2xl text-brand-green mb-2">Create an account</h1>
        <p className="text-brand-brown/70 text-sm mb-8">
          Free to sign up. A paid subscription unlocks the full directory.
        </p>
        <AuthForm mode="signup" action={signupAction} next={next} />
        <p className="text-center text-sm text-brand-brown/50 mt-6">
          Already have an account?{" "}
          <Link
            href={next ? `/auth/signin?next=${encodeURIComponent(next)}` : "/auth/signin"}
            className="text-brand-green hover:text-brand-green/70"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
