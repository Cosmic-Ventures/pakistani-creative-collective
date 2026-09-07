import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import AuthForm from "@/components/AuthForm";
import { loginAction } from "@/lib/auth-actions";
import { getSession } from "@/lib/session";
import { gateEnabled } from "@/lib/site-gate";
import { signedInLanding } from "@/lib/safe-redirect";

export const metadata: Metadata = { title: "Sign In" };

export default async function SigninPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reset?: string }>;
}) {
  const { next, reset } = await searchParams;

  // Resolved against the database, the same way the header is, so the two can
  // never contradict each other. This used to live in proxy.ts, where only the
  // JWT is visible — a cookie whose account no longer exists was treated as
  // signed in there and signed out everywhere else, which made this page
  // unreachable and left people unable to sign in at all.
  const session = await getSession();
  if (session) redirect(signedInLanding(next, gateEnabled()));

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="font-heading font-bold text-2xl text-brand-green mb-2">Sign in</h1>
        <p className="text-brand-brown/70 text-sm mb-8">
          Welcome back to the Pakistani Creative Collective.
        </p>
        {/* Where resetPasswordAction lands people — they're deliberately not
            signed in automatically, so the confirmation has to be here. */}
        {reset && (
          <p className="text-sm text-brand-green bg-brand-mint/20 border border-brand-mint rounded-lg px-4 py-3 mb-6">
            Your password has been updated. Sign in with your new password.
          </p>
        )}
        <AuthForm mode="signin" action={loginAction} next={next} />
        <p className="text-center text-sm text-brand-brown/50 mt-4">
          <Link href="/auth/forgot" className="text-brand-green hover:text-brand-green/70">
            Forgot your password?
          </Link>
        </p>
        <p className="text-center text-sm text-brand-brown/50 mt-3">
          No account?{" "}
          <Link
            href={next ? `/auth/signup?next=${encodeURIComponent(next)}` : "/auth/signup"}
            className="text-brand-green hover:text-brand-green/70"
          >
            Create one free
          </Link>
        </p>
      </div>
    </div>
  );
}
