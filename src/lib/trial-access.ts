/**
 * Founding-member trial: every approved creative with a linked login gets
 * premium access until this moment, with no database write and no Stripe
 * involvement (client, 10/22: "admin would automatically give all accounts that
 * are enrolled premium user access until November 14th", and nobody should be
 * able to subscribe yet).
 *
 * It is a rule evaluated at read time, so it switches itself off — nothing to
 * revert, nothing to forget. Members who later pay keep their real PAID role.
 * It begins at TRIAL_STARTS_AT, which is also when the "founding member" email is
 * scheduled to go out (Admin → Scheduled Emails), so members hear about it the
 * moment it turns on. Ends at the end of Nov 14 US Eastern; to move either end,
 * change the constant.
 */
export const TRIAL_STARTS_AT = new Date("2026-10-25T13:00:00Z"); // Sun Oct 25, 9:00 AM Eastern
export const TRIAL_ENDS_AT = new Date("2026-11-15T05:00:00Z");
export const TRIAL_ENDS_LABEL = "November 14";

export function trialActive(now: Date = new Date()): boolean {
  return now >= TRIAL_STARTS_AT && now < TRIAL_ENDS_AT;
}
