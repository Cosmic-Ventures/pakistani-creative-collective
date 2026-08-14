import { cache } from "react";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { UserRole } from "@prisma/client";
import { db } from "./db";

const SESSION_COOKIE = "pcc_session";

// Resolved lazily rather than at module load, so a missing secret surfaces as a
// clear runtime error instead of breaking the build.
//
// In production a missing SESSION_SECRET is fatal: falling back to a value
// committed to this repository would make every session token forgeable by
// anyone who can read the source, and it would fail silently — the site would
// look perfectly healthy. Dev keeps a fixed fallback so a fresh clone runs.
let cachedKey: Uint8Array | null = null;
function sessionKey(): Uint8Array {
  if (cachedKey) return cachedKey;
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "SESSION_SECRET is not set. Refusing to sign sessions with the development fallback."
      );
    }
    cachedKey = new TextEncoder().encode("dev-secret-change-in-production-32chars!!");
    return cachedKey;
  }
  cachedKey = new TextEncoder().encode(secret);
  return cachedKey;
}

type SessionPayload = {
  userId: string;
  email: string;
  role: UserRole;
  name?: string | null;
};

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(sessionKey());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

// The JWT only proves identity; role comes fresh from the DB so changes made
// outside the login flow (Stripe webhook flipping PAID/UNPAID, admin
// promotions, cancellations) apply immediately instead of after re-login.
// Cookie mutation is not allowed during server-component render, so the
// stale cookie is left alone — reading the DB here makes it not matter.
// cache() memoizes per request: layout + page + actions share one query.
export const getSession = cache(async (): Promise<SessionPayload | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, sessionKey());
    const jwt = payload as unknown as SessionPayload;
    const user = await db.user.findUnique({
      where: { id: jwt.userId },
      select: { role: true, name: true },
    });
    if (!user) return null;
    return { ...jwt, role: user.role, name: user.name ?? jwt.name };
  } catch {
    return null;
  }
});

/**
 * Authorization gate for anything only an admin may do.
 *
 * Every admin Server Action calls this. They are ordinary POST endpoints, so
 * being rendered on a protected route is not by itself protection — and the
 * route guard in `proxy.ts` can only read the JWT, whose `role` claim goes stale
 * the moment someone is demoted. `getSession` reads the role from the database
 * on every request, so this is the check that actually holds.
 */
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    throw new Error("Not authorized.");
  }
  return session;
}

/** Same, for anything gated on a paid membership. */
export async function requireMember(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session || (session.role !== "PAID" && session.role !== "ADMIN")) {
    throw new Error("Not authorized.");
  }
  return session;
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
