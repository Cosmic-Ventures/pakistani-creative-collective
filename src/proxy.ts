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
const SIGNED_IN_ROUTES = ["/admin", "/account"];
const AUTH_ROUTES = ["/auth/signin", "/auth/signup"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;

  let signedIn = false;
  if (token) {
    try {
      await jwtVerify(token, sessionKey());
      signedIn = true;
    } catch {
      // invalid/expired token — treat as logged out
    }
  }

  // Redirect logged-in users away from auth pages
  if (AUTH_ROUTES.some((r) => pathname.startsWith(r)) && signedIn) {
    return NextResponse.redirect(new URL("/directory", req.url));
  }

  // Bounce anonymous visitors to sign-in. Role is enforced past this point.
  if (SIGNED_IN_ROUTES.some((r) => pathname.startsWith(r)) && !signedIn) {
    return NextResponse.redirect(new URL("/auth/signin?next=" + encodeURIComponent(pathname), req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*", "/auth/:path*"],
};
