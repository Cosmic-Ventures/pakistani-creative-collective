import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "pcc_session";
const key = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "dev-secret-change-in-production-32chars!!"
);

const ADMIN_ROUTES = ["/admin"];
const PAID_ROUTES = ["/account"];
const AUTH_ROUTES = ["/auth/signin", "/auth/signup"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;

  let session: { role?: string } | null = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, key);
      session = payload as { role?: string };
    } catch {
      // invalid/expired token — treat as logged out
    }
  }

  // Redirect logged-in users away from auth pages
  if (AUTH_ROUTES.some((r) => pathname.startsWith(r)) && session) {
    return NextResponse.redirect(new URL("/directory", req.url));
  }

  // Protect admin routes
  if (ADMIN_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!session || session.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/auth/signin?next=" + encodeURIComponent(pathname), req.url));
    }
  }

  // Protect account route
  if (PAID_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!session) {
      return NextResponse.redirect(new URL("/auth/signin?next=" + encodeURIComponent(pathname), req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*", "/auth/:path*"],
};
