import type { Metadata } from "next";
import Link from "next/link";
import ResetPasswordForm from "@/components/ResetPasswordForm";
import { isResetTokenValid } from "@/lib/password-reset-lookup";

export const metadata: Metadata = { title: "Set a New Password" };
export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  // Checked before the form is drawn, so a link that's already been used says so
  // now rather than after they've typed a new password twice.
  const valid = token ? await isResetTokenValid(token) : false;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="font-heading font-bold text-2xl text-brand-green mb-2">Set a new password</h1>

        {valid ? (
          <>
            <p className="text-brand-brown/70 text-sm mb-8">
              Choose a new password for your Pakistani Creative Collective account.
            </p>
            <ResetPasswordForm token={token!} />
          </>
        ) : (
          <>
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6 mt-4">
              This reset link has expired or has already been used. Reset links are good for one
              hour and can only be used once.
            </p>
            <Link
              href="/auth/forgot"
              className="block text-center w-full bg-brand-green hover:bg-brand-green/90 text-brand-cream font-semibold py-3 rounded-full transition-colors"
            >
              Send me a new link
            </Link>
          </>
        )}

        <p className="text-center text-sm text-brand-brown/50 mt-6">
          <Link href="/auth/signin" className="text-brand-green hover:text-brand-green/70">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
