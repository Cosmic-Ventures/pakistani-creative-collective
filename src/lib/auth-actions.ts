"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "./db";
import { PasswordSchema } from "./password-rules";
import { createSession, deleteSession } from "./session";

const SignupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Invalid email address"),
  // Shared with the password-reset flow, so a password you can't sign up with
  // is also one you can't reset to.
  password: PasswordSchema,
});

const LoginSchema = z.object({
  email: z.email("Invalid email"),
  password: z.string().min(1, "Password required"),
});

export type ActionResult = { error: string } | { success: true };

// Only a same-origin path is a safe redirect target — "next" comes off the
// query string of a page anyone can link to, so a value like
// "https://evil.example" or the protocol-relative "//evil.example" must fall
// back to the default rather than be honored.
function safeNext(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

const MAX_FAILED_ATTEMPTS = 10;
const LOCKOUT_MINUTES = 15;

// A real bcrypt hash of a value nobody will guess. When the email doesn't exist
// we still compare against this, so a request for an unknown account takes the
// same ~200ms as a wrong password for a real one. Without it, response time
// alone tells an attacker which addresses have accounts.
// A genuine cost-12 hash of a random string — it must be real, or bcrypt
// returns immediately and the timing gap it exists to close reopens. Measured:
// 221ms against this vs 222ms against a live user's hash.
const DUMMY_HASH = "$2b$12$Ktxau5oKziG9fGDeh5fzMeOkhC.F.S4MEOgnU/JWot.85TfFv9DhC";

const GENERIC_LOGIN_ERROR = "Invalid email or password.";

export async function signupAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const parsed = SignupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { name, email, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with that email already exists." };

  const passwordHash = await bcrypt.hash(password, 12);
  // Anyone signing up before public launch (Fall 2026) is early access
  const earlyAccess = new Date() < new Date("2026-09-01");

  const user = await db.user.create({
    data: { name, email, passwordHash, earlyAccess },
  });

  await createSession({ userId: user.id, email: user.email, role: user.role, name: user.name });
  redirect(safeNext(formData.get("next")) ?? "/directory");
}

export async function loginAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { email, password } = parsed.data;

  const user = await db.user.findUnique({ where: { email } });

  // Unknown address: still pay the cost of a bcrypt comparison, then give the
  // same message as a wrong password. Both the wording and the timing have to
  // match, or the form becomes an oracle for which emails are registered.
  if (!user) {
    await bcrypt.compare(password, DUMMY_HASH);
    return { error: GENERIC_LOGIN_ERROR };
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutes = Math.max(1, Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000));
    return {
      error: `Too many failed sign-in attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);

  if (!valid) {
    const attempts = user.failedLoginAttempts + 1;
    await db.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: attempts,
        lockedUntil:
          attempts >= MAX_FAILED_ATTEMPTS
            ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000)
            : null,
      },
    });
    return { error: GENERIC_LOGIN_ERROR };
  }

  if (user.failedLoginAttempts > 0 || user.lockedUntil) {
    await db.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  }

  await createSession({ userId: user.id, email: user.email, role: user.role, name: user.name });
  redirect(safeNext(formData.get("next")) ?? "/directory");
}

export async function logoutAction() {
  await deleteSession();
  redirect("/");
}
