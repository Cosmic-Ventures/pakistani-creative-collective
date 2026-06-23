"use server";

import { revalidatePath } from "next/cache";
import { db } from "./db";
import { sendApprovalEmail, sendRejectionEmail, sendFeatureNotification, sendContactRequestNotification } from "./email";

export async function approveCreative(creativeId: string) {
  const creative = await db.creative.update({
    where: { id: creativeId },
    data: { status: "APPROVED" },
  });
  await sendApprovalEmail(creative.firstName, creative.email, creative.slug).catch(console.error);
  revalidatePath("/admin/applications");
  revalidatePath("/directory");
}

export async function rejectCreative(creativeId: string, notes?: string) {
  const creative = await db.creative.update({
    where: { id: creativeId },
    data: { status: "REJECTED", adminNotes: notes },
  });
  await sendRejectionEmail(creative.firstName, creative.email).catch(console.error);
  revalidatePath("/admin/applications");
}

export async function setCreativeStatus(creativeId: string, status: "APPROVED" | "INACTIVE" | "REJECTED") {
  await db.creative.update({ where: { id: creativeId }, data: { status } });
  revalidatePath("/admin/applications");
  revalidatePath("/directory");
}

export async function updateAdminNotes(creativeId: string, notes: string) {
  await db.creative.update({ where: { id: creativeId }, data: { adminNotes: notes } });
  revalidatePath("/admin/applications");
}

export async function forwardContactRequest(requestId: string) {
  const req = await db.contactRequest.update({
    where: { id: requestId },
    data: { status: "FORWARDED" },
    include: { creative: true, user: true },
  });
  await sendContactRequestNotification(
    `${req.creative.firstName} ${req.creative.lastName}`,
    req.requesterName,
    req.requestType === "Other" ? `Other — ${req.requestTypeOther}` : req.requestType,
    req.message,
    req.timeline,
    `${process.env.NEXT_PUBLIC_APP_URL}/admin/contact-requests`
  ).catch(console.error);
  revalidatePath("/admin/contact-requests");
}

export async function updateContactRequestStatus(
  requestId: string,
  status: "PENDING" | "FORWARDED" | "ACCEPTED" | "DECLINED" | "UNAVAILABLE",
  notes?: string
) {
  await db.contactRequest.update({
    where: { id: requestId },
    data: { status, adminNotes: notes },
  });
  revalidatePath("/admin/contact-requests");
}

export async function approveFeatureRequest(requestId: string, featuredUntil: Date) {
  const req = await db.featureRequest.update({
    where: { id: requestId },
    data: { status: "APPROVED" },
    include: { creative: true },
  });
  await db.creative.update({
    where: { id: req.creativeId },
    data: { featured: true, featuredUntil },
  });
  await sendFeatureNotification(req.creative.firstName, req.creative.email, req.creative.slug).catch(console.error);
  revalidatePath("/admin/feature-requests");
  revalidatePath("/directory");
}

export async function rejectFeatureRequest(requestId: string, notes?: string) {
  await db.featureRequest.update({
    where: { id: requestId },
    data: { status: "REJECTED", adminNotes: notes },
  });
  revalidatePath("/admin/feature-requests");
}
