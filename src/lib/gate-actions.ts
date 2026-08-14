"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { GATE_COOKIE, gateToken } from "./site-gate";

export type GateResult = { error: string } | undefined;

export async function unlockSite(_prev: GateResult, formData: FormData): Promise<GateResult> {
  const entered = ((formData.get("password") as string) ?? "").trim();
  const expected = process.env.SITE_GATE_PASSWORD ?? "";

  // Case-insensitive: the password is shared by word of mouth and typed by
  // applicants on phones, where autocapitalisation is the norm.
  if (!expected || entered.toLowerCase() !== expected.toLowerCase()) {
    return { error: "That password isn't right. Please check and try again." };
  }

  const cookieStore = await cookies();
  cookieStore.set(GATE_COOKIE, await gateToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  const next = (formData.get("next") as string) ?? "/enroll";
  // Only ever redirect within this site — an attacker-supplied `next` must not
  // be able to bounce someone off to another domain.
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/enroll");
}
