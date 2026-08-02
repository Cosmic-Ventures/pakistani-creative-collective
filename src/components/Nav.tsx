import Link from "next/link";
import { getSession } from "@/lib/session";
import { logoutAction } from "@/lib/auth-actions";
import Logo from "@/components/Logo";

export default async function Nav() {
  const session = await getSession();

  return (
    <header className="border-b border-brand-green/15 bg-brand-cream/90 backdrop-blur-sm sticky top-0 z-50 print:hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center group">
          <Logo variant="dark" className="h-9 w-auto group-hover:opacity-80 transition-opacity" />
        </Link>

        <nav className="flex items-center gap-5 text-sm">
          <Link href="/directory" className="text-brand-green/80 hover:text-brand-green transition-colors">
            Directory
          </Link>
          <Link href="/request" className="text-brand-green/80 hover:text-brand-green transition-colors hidden sm:inline">
            Hire Talent
          </Link>

          {session ? (
            <>
              {(session.role === "PAID" || session.role === "ADMIN") && (
                <Link href="/community" className="text-brand-green/80 hover:text-brand-green transition-colors hidden sm:inline">
                  Community
                </Link>
              )}
              {(session.role === "PAID" || session.role === "ADMIN") && (
                <Link href="/account" className="text-brand-green/80 hover:text-brand-green transition-colors hidden sm:inline">
                  Account Dashboard
                </Link>
              )}
              {session.role === "ADMIN" && (
                <Link href="/admin" className="text-brand-brown hover:text-brand-brown/70 transition-colors hidden sm:inline">
                  Admin
                </Link>
              )}
              {session.role === "UNPAID" && (
                <Link
                  href="/subscribe"
                  className="text-brand-green hover:text-brand-green/70 transition-colors font-semibold"
                >
                  Upgrade
                </Link>
              )}
              <form action={logoutAction}>
                <button className="text-brand-green/50 hover:text-brand-green transition-colors">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/auth/signin" className="text-brand-green/80 hover:text-brand-green transition-colors">
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="bg-brand-green hover:bg-brand-green/90 text-brand-cream px-4 py-1.5 rounded-full transition-colors font-semibold"
              >
                Join
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
