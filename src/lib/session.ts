import { cache } from "react";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { UserRole } from "@prisma/client";
import { db } from "./db";

const SESSION_COOKIE = "pcc_session";
const key = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "dev-secret-change-in-production-32chars!!"
);

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
    .sign(key);

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
    const { payload } = await jwtVerify(token, key);
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

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
