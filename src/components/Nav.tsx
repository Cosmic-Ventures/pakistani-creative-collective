import Link from "next/link";
import { getSession } from "@/lib/session";
import { logoutAction } from "@/lib/auth-actions";

export default async function Nav() {
  const session = await getSession();

  return (
    <header className="border-b border-stone-800 bg-stone-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-emerald-400 font-bold text-lg tracking-tight group-hover:text-emerald-300 transition-colors">
            PCC
          </span>
          <span className="text-stone-400 text-sm hidden sm:inline">
            Pakistani Creative Collective
          </span>
        </Link>

        <nav className="flex items-center gap-5 text-sm">
          <Link href="/directory" className="text-stone-300 hover:text-white transition-colors">
            Directory
          </Link>
          <Link href="/request" className="text-stone-300 hover:text-white transition-colors hidden sm:inline">
            Hire Talent
          </Link>

          {session ? (
            <>
              {session.role === "ADMIN" && (
                <Link href="/admin" className="text-amber-400 hover:text-amber-300 transition-colors hidden sm:inline">
                  Admin
                </Link>
              )}
              {session.role === "UNPAID" && (
                <Link
                  href="/subscribe"
                  className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
                >
                  Upgrade
                </Link>
              )}
              <form action={logoutAction}>
                <button className="text-stone-500 hover:text-stone-300 transition-colors">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/auth/signin" className="text-stone-300 hover:text-white transition-colors">
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-full transition-colors font-medium"
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
