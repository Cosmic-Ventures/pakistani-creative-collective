/**
 * Recognises "that table doesn't exist yet" from Prisma.
 *
 * The 09/01 round added two tables (EmailTemplate, PasswordResetToken) whose
 * migration has to be applied to the client's live database by hand. Until it
 * is, the code that reads them would throw and take the whole page down —
 * which would make deploying the far more urgent application-form fix
 * conditional on a database change. It isn't: every read of those tables is
 * guarded with this, so the new features announce that they're waiting on the
 * migration and the rest of the site is unaffected.
 *
 * P2021 = table does not exist; P2022 = column does not exist. Both mean the
 * schema is behind the code, which is the case this is for. Anything else is a
 * real fault and is deliberately left to propagate.
 */
export function isMissingSchemaError(error: unknown): boolean {
  const code = (error as { code?: unknown })?.code;
  return code === "P2021" || code === "P2022";
}

export const MIGRATION_PENDING_MESSAGE =
  "This feature needs a one-time database update that hasn't been applied yet " +
  "(migration 20260901120000_email_templates_and_password_reset). Everything else on the site is unaffected.";
