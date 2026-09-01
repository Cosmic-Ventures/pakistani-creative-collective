import { createHash } from "node:crypto";
import { db } from "./db";
import { isMissingSchemaError } from "./db-availability";

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
  try {
    const record = await db.passwordResetToken.findUnique({ where: { tokenHash } });
    return Boolean(record && !record.usedAt && record.expiresAt > new Date());
  } catch (error) {
    // No table yet: no link can be valid, and the page says so instead of 500ing.
    if (!isMissingSchemaError(error)) throw error;
    return false;
  }
}
