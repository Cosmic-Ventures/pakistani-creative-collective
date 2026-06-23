import type { Metadata } from "next";
import Link from "next/link";
import AuthForm from "@/components/AuthForm";
import { loginAction } from "@/lib/auth-actions";

export const metadata: Metadata = { title: "Sign In" };

export default function SigninPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="font-heading font-extrabold uppercase text-2xl text-brand-green mb-2">Sign in</h1>
        <p className="text-brand-brown/70 text-sm mb-8">
          Welcome back to the Pakistani Creative Collective.
        </p>
        <AuthForm mode="signin" action={loginAction} />
        <p className="text-center text-sm text-brand-brown/50 mt-6">
          No account?{" "}
          <Link href="/auth/signup" className="text-brand-green hover:text-brand-green/70">
            Create one free
          </Link>
        </p>
      </div>
    </div>
  );
}
