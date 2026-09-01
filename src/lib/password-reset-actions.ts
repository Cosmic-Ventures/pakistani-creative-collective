"use server";

import { createHash, randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "./db";
import { appUrl, PASSWORD_RESET_EXPIRY_HOURS, sendPasswordResetEmail } from "./email";
import { PasswordSchema } from "./password-rules";

export type ResetActionResult = { error: string } | { sent: true };

const RequestSchema = z.object({ email: z.email("Enter a valid email address") });

const ResetSchema = z
  .object({
    token: z.string().min(1),
    password: PasswordSchema,
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "The two passwords don't match",
    path: ["confirm"],
  });

/**
 * The link we email contains the raw token; only its SHA-256 lands in the
 * database. Same reasoning as the password hash — a leaked backup can't be
 * turned into working reset links. A plain hash (not bcrypt) is right here:
 * the token is 32 bytes of CSPRNG output, so there's nothing to brute-force,
 * and lookups need to be exact.
 */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// Enough to cover a genuine "it didn't arrive, try again" without letting the
// form be used to flood somebody's inbox.
const MAX_REQUESTS_PER_HOUR = 5;

export async function requestPasswordResetAction(
  _prev: ResetActionResult | null,
  formData: FormData
): Promise<ResetActionResult> {
  const parsed = RequestSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // Matched exactly as typed, the same way sign-in matches it — lowercasing
  // here would fail to find an account stored with a capital letter and then
  // silently send nothing.
  const email = parsed.data.email.trim();
  const user = await db.user.findUnique({ where: { email } });

  // Whether or not an account exists, the answer is the same. Anything else
  // turns this form into a way to find out who has a PCC account — the same
  // reasoning as the deliberately generic sign-in error.
  if (user) {
    const recent = await db.passwordResetToken.count({
      where: { userId: user.id, createdAt: { gt: new Date(Date.now() - 60 * 60_000) } },
    });

    if (recent < MAX_REQUESTS_PER_HOUR) {
      const token = randomBytes(32).toString("hex");

      // Any earlier link stops working the moment a new one is issued, so a
      // forwarded or leaked older email is spent.
      await db.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });
      await db.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(token),
          expiresAt: new Date(Date.now() + PASSWORD_RESET_EXPIRY_HOURS * 60 * 60_000),
        },
      });

      const firstName = user.name?.trim().split(/\s+/)[0] || "there";
      await sendPasswordResetEmail(
        firstName,
        user.email,
        `${appUrl()}/auth/reset?token=${token}`
      ).catch(console.error);
    }
  }

  return { sent: true };
}

export async function resetPasswordAction(
  _prev: ResetActionResult | null,
  formData: FormData
): Promise<ResetActionResult> {
  const parsed = ResetSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { token, password } = parsed.data;
  const record = await db.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } });

  if (!record || record.usedAt || record.expiresAt <= new Date()) {
    return { error: "This reset link has expired or has already been used. Request a new one below." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.$transaction([
    db.user.update({
      where: { id: record.userId },
      // Someone who has just proved control of the mailbox shouldn't then be
      // held out by a lockout an attacker's failed guesses caused.
      data: { passwordHash, failedLoginAttempts: 0, lockedUntil: null },
    }),
    db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    // Every other outstanding link for this account is spent too.
    db.passwordResetToken.deleteMany({ where: { userId: record.userId, usedAt: null } }),
  ]);

  // Deliberately not signing them in: making them use the new password once is
  // what confirms it's the one they think it is.
  redirect("/auth/signin?reset=1");
}
