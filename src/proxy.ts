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

  // NOTE: there is deliberately no "already signed in, bounce away from the auth
  // pages" rule here any more, and it must not be reintroduced at the edge.
  //
  // This runs where the database is unreachable, so the only thing it can check
  // is the JWT's signature. `getSession` — which every page and action uses —
  // additionally requires the user row to still exist. The two therefore
  // disagree whenever a cookie is valid but the account is gone (or the database
  // is briefly unavailable), and the disagreement locked people out: the edge
  // bounced them off /auth/signin while every page rendered them as signed out,
  // so the header offered "Sign in", clicking it went nowhere, and the only
  // escape was clearing cookies. Reported as "works in incognito, glitches in my
  // own browser".
  //
  // The redirect now lives on the auth pages themselves (src/app/auth/*/page.tsx),
  // which resolve the session against the database and so can never contradict
  // the header they are rendered next to.

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
