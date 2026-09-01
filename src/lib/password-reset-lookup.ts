import { createHash } from "node:crypto";
import { db } from "./db";

/**
 * Whether a reset link is still good. Read directly by the reset page so an
 * expired link says so up front, instead of after someone has typed a new
 * password twice. Kept out of the "use server" actions file on purpose: an
 * exported async function there is a callable endpoint, and this check has no
 * business being one.
 */
export async function isResetTokenValid(token: string): Promise<boolean> {
  if (!token) return false;
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const record = await db.passwordResetToken.findUnique({ where: { tokenHash } });
  return Boolean(record && !record.usedAt && record.expiresAt > new Date());
}
