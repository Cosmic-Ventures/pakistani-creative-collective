import { db } from "./db";
import { sendMassEmail } from "./email";
import { segmentRecipients } from "./mass-email-recipients";

/**
 * Sends every scheduled email whose time has come. Called by the cron endpoint.
 *
 * Each row is claimed with a conditional update (scheduled → sending) before
 * anything is sent, so two overlapping runs can never both send the same email.
 * Recipients are resolved now, not when it was written, and deduped by address.
 */
export async function runDueScheduledEmails(now: Date = new Date()): Promise<{ id: string; sent: number }[]> {
  const due = await db.scheduledEmail.findMany({
    where: { status: "scheduled", sendAt: { lte: now } },
    orderBy: { sendAt: "asc" },
  });

  const results: { id: string; sent: number }[] = [];
  for (const email of due) {
    const claim = await db.scheduledEmail.updateMany({
      where: { id: email.id, status: "scheduled" },
      data: { status: "sending" },
    });
    if (claim.count === 0) continue;

    try {
      const seen = new Set<string>();
      const recipients = (await segmentRecipients(email.segmentId)).filter((r) => {
        const key = r.email.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      const sent = await sendMassEmail(recipients, {
        subject: email.subject,
        preheader: email.preheader,
        body: email.body,
      });
      await db.scheduledEmail.update({
        where: { id: email.id },
        data: { status: "sent", sentAt: new Date(), sentCount: sent, recipientCount: recipients.length },
      });
      results.push({ id: email.id, sent });
    } catch (error) {
      // Back to "scheduled" would retry and could double-send to people who
      // already got it; park it as a draft so an admin decides.
      console.error(`[scheduled-email] ${email.id} failed mid-send`, error);
      await db.scheduledEmail.update({ where: { id: email.id }, data: { status: "draft" } }).catch(() => {});
    }
  }
  return results;
}
