"use server";

import { revalidatePath } from "next/cache";
import { db } from "./db";
import { requireAdmin } from "./session";
import { easternToDate } from "./eastern-time";
import { MASS_EMAIL_DEF, unknownVariables } from "./email-templates";
import { MASS_EMAIL_SEGMENTS } from "./mass-email-constants";

export type ScheduledEmailResult = { error: string } | { ok: true; message: string } | null;

/**
 * Save an email as a draft, or schedule it (`intent=schedule`). Only drafts and
 * scheduled emails can be edited — one that is sending or has gone out is history.
 */
export async function saveScheduledEmail(
  _prev: ScheduledEmailResult,
  formData: FormData
): Promise<ScheduledEmailResult> {
  const admin = await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const segmentId = String(formData.get("segmentId") ?? "");
  const subject = String(formData.get("subject") ?? "").trim();
  const preheader = String(formData.get("preheader") ?? "").trim();
  const body = String(formData.get("body") ?? "").replace(/\r\n/g, "\n").trim();
  const sendAt = easternToDate(String(formData.get("sendAt") ?? ""));
  const schedule = formData.get("intent") === "schedule";

  if (!name) return { error: "Give it a name so you can find it later." };
  if (!MASS_EMAIL_SEGMENTS.some((s) => s.id === segmentId)) return { error: "Choose who it goes to." };
  if (!subject) return { error: "The subject line can't be empty." };
  if (!body) return { error: "The email body can't be empty." };
  if (subject.length > 200 || preheader.length > 200 || body.length > 20_000) {
    return { error: "That's longer than the email limits allow." };
  }
  if (!sendAt) return { error: "Pick a send date and time." };
  const bad = unknownVariables(MASS_EMAIL_DEF, { subject, preheader, body });
  if (bad.length) return { error: `Unknown placeholder${bad.length > 1 ? "s" : ""}: ${bad.map((v) => `{{${v}}}`).join(", ")}` };
  if (schedule && sendAt.getTime() < Date.now() + 60_000) {
    return { error: "That time has already passed. Pick a time in the future." };
  }

  const data = {
    name, segmentId, subject, preheader, body, sendAt,
    status: schedule ? "scheduled" : "draft",
    updatedBy: admin.email,
  };

  if (id) {
    const res = await db.scheduledEmail.updateMany({
      where: { id, status: { in: ["draft", "scheduled", "cancelled"] } },
      data,
    });
    if (res.count === 0) return { error: "This email has already started sending, so it can't be changed." };
  } else {
    await db.scheduledEmail.create({ data });
  }
  revalidatePath("/admin/scheduled-emails");
  return { ok: true, message: schedule ? "Scheduled." : "Saved as a draft. It will not send until you schedule it." };
}

/** Pull a scheduled email back to a draft so it won't go out. */
export async function cancelScheduledEmail(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  await db.scheduledEmail.updateMany({ where: { id, status: "scheduled" }, data: { status: "cancelled" } });
  revalidatePath("/admin/scheduled-emails");
}

export async function deleteScheduledEmail(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  await db.scheduledEmail.deleteMany({ where: { id, status: { in: ["draft", "cancelled"] } } });
  revalidatePath("/admin/scheduled-emails");
}
