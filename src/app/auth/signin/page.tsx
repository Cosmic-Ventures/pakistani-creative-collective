import type { Metadata } from "next";
import Link from "next/link";
import AuthForm from "@/components/AuthForm";
import { loginAction } from "@/lib/auth-actions";

export const metadata: Metadata = { title: "Sign In" };

export default function SigninPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-white mb-2">Sign in</h1>
        <p className="text-stone-400 text-sm mb-8">
          Welcome back to the Pakistani Creative Collective.
        </p>
        <AuthForm mode="signin" action={loginAction} />
        <p className="text-center text-sm text-stone-500 mt-6">
          No account?{" "}
          <Link href="/auth/signup" className="text-emerald-400 hover:text-emerald-300">
            Create one free
          </Link>
        </p>
      </div>
    </div>
  );
}
