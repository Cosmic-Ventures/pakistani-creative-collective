/**
 * Coarse routing gate only — NOT the authorization boundary.
 *
 * This runs on the edge, where it can verify the JWT's signature but cannot
 * reach the database. That makes its view of who someone is permanently one
 * step behind: the `role` claim is whatever it was when the token was issued, so
 * a demoted admin would keep sailing through for the 30-day life of their
 * cookie. It therefore checks only that a caller is *signed in*, and every
 * protected page and admin action re-checks the real role against the database
 * via `requireAdmin`/`getSession`.
 */
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { GATE_COOKIE, gateEnabled, gateToken, tokensMatch, isPrelaunchAllowed } from "@/lib/site-gate";

const SESSION_COOKIE = "pcc_session";

function sessionKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET is not set.");
    }
    return new TextEncoder().encode("dev-secret-change-in-production-32chars!!");
  }
  return new TextEncoder().encode(secret);
}

// Routes that require *a* signed-in user. Which role they need is decided
// server-side, against the database, by the page or action itself.
const SIGNED_IN_ROUTES = ["/admin", "/account", "/enroll", "/join"];
const AUTH_ROUTES = ["/auth/signin", "/auth/signup"];

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  // Every `next` we hand out must carry the query string, not just the path. A
  // password-reset link is `/auth/reset?token=…`; storing only the pathname sent
  // the user back from the gate with no token and an "expired link" message.
  const returnTo = `${pathname}${search}`;
  const token = req.cookies.get(SESSION_COOKIE)?.value;

  let signedIn = false;
  let claimedRole: string | undefined;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, sessionKey());
      signedIn = true;
      claimedRole = (payload as { role?: string }).role;
    } catch {
      // invalid/expired token — treat as logged out
    }
  }

  // ── Pre-launch gate ────────────────────────────────────────────────────────
  // Active only while SITE_GATE_PASSWORD is set; clearing it opens the site.
  if (gateEnabled()) {
    const unlocked = tokensMatch(req.cookies.get(GATE_COOKIE)?.value, await gateToken());

    if (!unlocked && pathname !== "/gate") {
      const url = new URL("/gate", req.url);
      // The homepage is itself a prelaunch-allowed destination (08/24 round),
      // so always carry `next` through — including for "/" — so someone who
      // hits the gate from the homepage lands back on it after entering the
      // password, instead of being bounced to /enroll by gate-actions.ts's
      // default.
      url.searchParams.set("next", returnTo);
      return NextResponse.redirect(url);
    }

    // Past the gate, applicants get the application and nothing else — the
    // remaining tabs aren't published yet. Admins keep full access so the rest
    // can still be worked on. This uses the JWT's role claim rather than the
    // database because it runs on the edge; it's a curtain over unfinished
    // pages, not an authorization boundary, and every protected page and admin
    // action still re-checks the real role server-side.
    if (unlocked && claimedRole !== "ADMIN" && !isPrelaunchAllowed(pathname)) {
      return NextResponse.redirect(new URL("/enroll", req.url));
    }
  }

  // Redirect logged-in users away from auth pages.
  //
  // This used to always send them to /directory, which pre-launch sits behind
  // the curtain: a signed-in non-admin was bounced /auth/signin → /directory →
  // /enroll (three hops), and an admin landed squarely on the member directory
  // — which is what the client saw as "clicking Sign in takes me to the member
  // directory", and not where sign-in should lead before launch. While the gate
  // is up the homepage is the neutral landing both roles can actually reach
  // (it's prelaunch-allowed); after launch the directory is the point of
  // signing in.
  //
  // Deliberately NOT honouring `?next=` here, tempting as it is. This rule sees
  // only the JWT, while every page re-reads the role from the database
  // (getSession returns null if the user row is gone or the database is
  // unreachable). When the two disagree — a deleted account with a live cookie,
  // or a database blip — the page bounces to /auth/signin?next=/admin and
  // honouring that `next` would send them straight back to /admin, forever.
  // A fixed destination cannot loop. `next` still does its real job in
  // loginAction, after an actual sign-in.
  if (AUTH_ROUTES.some((r) => pathname.startsWith(r)) && signedIn) {
    return NextResponse.redirect(new URL(gateEnabled() ? "/" : "/directory", req.url));
  }

  // Bounce anonymous visitors to sign-in. Role is enforced past this point.
  if (SIGNED_IN_ROUTES.some((r) => pathname.startsWith(r)) && !signedIn) {
    return NextResponse.redirect(new URL("/auth/signin?next=" + encodeURIComponent(returnTo), req.url));
  }

  return NextResponse.next();
}

export const config = {
  // Everything except Next's own assets, the brand images (the gate page needs
  // them before anyone is through it) and the Stripe webhook, which is a
  // machine-to-machine POST that must never be redirected to a password page.
  matcher: [
    "/((?!_next/static|_next/image|api/webhooks|brand/|favicon.ico|icon.png|apple-icon.png|robots.txt|sitemap.xml).*)",
  ],
};
