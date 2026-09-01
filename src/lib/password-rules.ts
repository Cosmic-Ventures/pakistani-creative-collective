import { z } from "zod";

/**
 * One definition of "an acceptable password", shared by sign-up and the reset
 * flow. A plain module rather than an export from either "use server" file —
 * those may only export async functions (AGENTS.md gotcha #1) — and shared so a
 * password that can't be created also can't be reset to.
 */
export const PasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Za-z]/, "Password must contain a letter")
  .regex(/[0-9]/, "Password must contain a number");

export const PASSWORD_HINT = "At least 8 characters, one letter, one number.";
