import Link from "next/link";
import { getSession } from "@/lib/session";
import { logoutAction } from "@/lib/auth-actions";
import Logo from "@/components/Logo";
import MobileMenu from "@/components/MobileMenu";
import { gateEnabled } from "@/lib/site-gate";

// 08/24 feedback round: "make the subscription page one of the tabs on
// navigation (private for now)." The tab exists in code and is wired to
// /subscribe, but stays hidden until the client says it's ready to go public
// — flip this to true (and, if the site is still gated, add "/subscribe" to
// PRELAUNCH_ALLOWED in src/lib/site-gate.ts) to turn it on. No other change
// needed.
const NAV_SUBSCRIBE_TAB_ENABLED = false;

type Item = { href: string; label: string; tone?: "admin" };

export default async function Nav() {
  const session = await getSession();
  const isMember = session?.role === "PAID" || session?.role === "ADMIN";
  const isAdmin = session?.role === "ADMIN";
  // Before launch the only published tab is the application, so don't offer
  // links the proxy will just bounce people back from. Admins see everything.
  const prelaunch = gateEnabled() && !isAdmin;

  // One list drives both the desktop bar and the phone menu, so they can't drift
  // apart (client, 10/22: on a phone in portrait the tabs weren't reachable).
  const links: Item[] = [];
  let cta: Item | null = null;

  if (prelaunch) {
    if (NAV_SUBSCRIBE_TAB_ENABLED && !isMember) links.push({ href: "/subscribe", label: "Subscribe" });
    if (session && isMember) {
      links.push(
        { href: "/directory", label: "Directory" },
        { href: "/community", label: "Community" },
        { href: "/account", label: "Account" }
      );
    }
    // Apply sits last, as a white pill: the one thing we want people to do before launch.
    cta = { href: "/enroll", label: "Apply" };
  } else {
    links.push({ href: "/directory", label: "Directory" }, { href: "/request", label: "Hire Talent" });
    // Hidden from paid members, who have nothing to buy — but shown to admins
    // (09/01 round), who get the page as a read-only preview.
    if (!isMember || isAdmin) links.push({ href: "/subscribe", label: "Subscribe" });
    if (session && isMember) {
      links.push({ href: "/community", label: "Community" }, { href: "/account", label: "Account Dashboard" });
    }
    if (isAdmin) links.push({ href: "/admin", label: "Admin", tone: "admin" });
  }
  if (!session) {
    links.push({ href: "/auth/signin", label: "Sign in" });
    if (!prelaunch) cta = { href: "/auth/signup", label: "Join" };
  }

  const linkCls = (tone?: "admin") =>
    tone === "admin"
      ? "text-brand-mint hover:text-brand-mint/70 transition-colors"
      : "text-brand-cream/80 hover:text-brand-cream transition-colors";
  const ctaCls = "bg-brand-cream hover:bg-white text-brand-green px-4 py-1.5 rounded-full transition-colors font-semibold";

  const signOut = (cls: string) => (
    <form action={logoutAction}>
      <button className={cls}>Sign out</button>
    </form>
  );

  return (
    <header className="border-b border-brand-cream/15 bg-brand-green/95 backdrop-blur-sm sticky top-0 z-50 print:hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center group">
          <Logo variant="square" className="h-9 w-auto group-hover:opacity-80 transition-opacity" />
        </Link>

        {/* Desktop / tablet */}
        <nav className="hidden md:flex items-center gap-5 text-sm">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={linkCls(l.tone)}>
              {l.label}
            </Link>
          ))}
          {session && signOut("text-brand-cream/50 hover:text-brand-cream transition-colors")}
          {cta && (
            <Link href={cta.href} className={ctaCls}>
              {cta.label}
            </Link>
          )}
        </nav>

        {/* Phone */}
        <div className="flex items-center gap-2 md:hidden">
          {cta && (
            <Link href={cta.href} className={`${ctaCls} text-sm`}>
              {cta.label}
            </Link>
          )}
          {(links.length > 0 || session) && (
            <MobileMenu>
              {links.map((l) => (
                <Link key={l.href} href={l.href} className={`${linkCls(l.tone)} px-4 py-3 rounded-xl hover:bg-brand-cream/10`}>
                  {l.label}
                </Link>
              ))}
              {session && signOut("w-full text-left px-4 py-3 rounded-xl text-brand-cream/60 hover:text-brand-cream hover:bg-brand-cream/10 transition-colors")}
            </MobileMenu>
          )}
        </div>
      </div>
    </header>
  );
}
