import Link from "next/link";
import { getSession } from "@/lib/session";
import { logoutAction } from "@/lib/auth-actions";
import Logo from "@/components/Logo";
import { gateEnabled } from "@/lib/site-gate";

export default async function Nav() {
  const session = await getSession();
  const isMember = session?.role === "PAID" || session?.role === "ADMIN";
  const isAdmin = session?.role === "ADMIN";
  // Before launch the only published tab is the application, so don't offer
  // links the proxy will just bounce people back from. Admins see everything.
  const prelaunch = gateEnabled() && !isAdmin;

  if (prelaunch) {
    return (
      <header className="border-b border-brand-cream/15 bg-brand-green/95 backdrop-blur-sm sticky top-0 z-50 print:hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link href="/enroll" className="flex items-center group">
            <Logo variant="square" className="h-9 w-auto group-hover:opacity-80 transition-opacity" />
          </Link>
          {/* Apply sits last so it lands at the far right, as a white pill —
              it's the one thing we want people to do before launch. */}
          <nav className="flex items-center gap-5 text-sm">
            {session ? (
              <form action={logoutAction}>
                <button className="text-brand-cream/50 hover:text-brand-cream transition-colors">
                  Sign out
                </button>
              </form>
            ) : (
              <Link href="/auth/signin" className="text-brand-cream/80 hover:text-brand-cream transition-colors">
                Sign in
              </Link>
            )}
            <Link
              href="/enroll"
              className="bg-brand-cream hover:bg-white text-brand-green px-4 py-1.5 rounded-full transition-colors font-semibold"
            >
              Apply
            </Link>
          </nav>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b border-brand-cream/15 bg-brand-green/95 backdrop-blur-sm sticky top-0 z-50 print:hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center group">
          <Logo variant="square" className="h-9 w-auto group-hover:opacity-80 transition-opacity" />
        </Link>

        <nav className="flex items-center gap-5 text-sm">
          <Link href="/directory" className="text-brand-cream/80 hover:text-brand-cream transition-colors">
            Directory
          </Link>
          <Link href="/request" className="text-brand-cream/80 hover:text-brand-cream transition-colors hidden sm:inline">
            Hire Talent
          </Link>
          {/* Subscribe sits alongside the other tabs (client-requested), but is
              hidden from members who already have access — /subscribe bounces
              PAID and ADMIN users straight back to the directory, so showing it
              to them would be a link to nowhere. */}
          {!isMember && (
            <Link href="/subscribe" className="text-brand-cream/80 hover:text-brand-cream transition-colors">
              Subscribe
            </Link>
          )}

          {session ? (
            <>
              {(session.role === "PAID" || session.role === "ADMIN") && (
                <Link href="/community" className="text-brand-cream/80 hover:text-brand-cream transition-colors hidden sm:inline">
                  Community
                </Link>
              )}
              {(session.role === "PAID" || session.role === "ADMIN") && (
                <Link href="/account" className="text-brand-cream/80 hover:text-brand-cream transition-colors hidden sm:inline">
                  Account Dashboard
                </Link>
              )}
              {session.role === "ADMIN" && (
                <Link href="/admin" className="text-brand-mint hover:text-brand-mint/70 transition-colors hidden sm:inline">
                  Admin
                </Link>
              )}
              <form action={logoutAction}>
                <button className="text-brand-cream/50 hover:text-brand-cream transition-colors">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/auth/signin" className="text-brand-cream/80 hover:text-brand-cream transition-colors">
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="bg-brand-cream hover:bg-white text-brand-green px-4 py-1.5 rounded-full transition-colors font-semibold"
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
