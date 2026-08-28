"use server";

import { revalidatePath } from "next/cache";
import { db } from "./db";
import { requireAdmin } from "./session";
import { sendApprovalEmail, sendRejectionEmail, sendFeatureNotification, sendContactRequestForwardEmail, sendRevisionRequestEmail } from "./email";
import type { Prisma, UserRole } from "@prisma/client";

export async function approveCreative(creativeId: string) {
  await requireAdmin();
  const creative = await db.creative.update({
    where: { id: creativeId },
    data: { status: "APPROVED" },
  });
  await sendApprovalEmail(creative.firstName, creative.email, creative.slug).catch(console.error);
  revalidatePath("/admin/applications");
  revalidatePath("/directory");
}

export async function rejectCreative(creativeId: string, notes?: string) {
  await requireAdmin();
  const creative = await db.creative.update({
    where: { id: creativeId },
    data: { status: "REJECTED", adminNotes: notes },
  });
  await sendRejectionEmail(creative.firstName, creative.email).catch(console.error);
  revalidatePath("/admin/applications");
}

export async function setCreativeStatus(creativeId: string, status: "APPROVED" | "INACTIVE" | "REJECTED" | "PENDING") {
  await requireAdmin();
  await db.creative.update({ where: { id: creativeId }, data: { status } });
  revalidatePath("/admin/applications");
  revalidatePath("/directory");
}

export async function updateAdminNotes(creativeId: string, notes: string) {
  await requireAdmin();
  await db.creative.update({ where: { id: creativeId }, data: { adminNotes: notes } });
  revalidatePath("/admin/applications");
}

// Third action alongside Accept/Reject: send the applicant their revision note
// and an instruction to reapply, per the client's feedback-doc request.
export async function flagCreativeForReview(creativeId: string, note: string) {
  await requireAdmin();
  const creative = await db.creative.update({
    where: { id: creativeId },
    data: { status: "FLAGGED", adminNotes: note },
  });
  await sendRevisionRequestEmail(creative.firstName, creative.email, note).catch(console.error);
  revalidatePath("/admin/applications");
}

// Grammar fixes or guideline-violation trims before approving — scoped to the
// free-text fields most likely to need a touch-up, not the full application.
export async function updateCreativeFields(
  creativeId: string,
  data: Pick<Prisma.CreativeUpdateInput, "firstName" | "lastName" | "bio" | "notableAchievements" | "pccGoals">
) {
  await requireAdmin();
  await db.creative.update({ where: { id: creativeId }, data });
  revalidatePath("/admin/applications");
}

export async function forwardContactRequest(requestId: string) {
  await requireAdmin();
  const req = await db.contactRequest.update({
    where: { id: requestId },
    data: { status: "FORWARDED" },
    include: { creative: true, user: true },
  });
  const requestType = req.requestType === "Other" ? `Other — ${req.requestTypeOther}` : req.requestType;
  // The creative is the one who needs to act on this — email them directly,
  // not just log another admin-facing notification (client reported never
  // getting an email on the creative side after forwarding).
  await sendContactRequestForwardEmail(
    req.creative.firstName,
    req.creative.email,
    req.requesterName,
    requestType,
    req.message,
    req.timeline
  ).catch(console.error);
  revalidatePath("/admin/contact-requests");
}

export async function updateContactRequestStatus(
  requestId: string,
  status: "PENDING" | "FORWARDED" | "ACCEPTED" | "DECLINED" | "UNAVAILABLE",
  notes?: string
) {
  await requireAdmin();
  await db.contactRequest.update({
    where: { id: requestId },
    data: { status, adminNotes: notes },
  });
  revalidatePath("/admin/contact-requests");
}

export async function approveFeatureRequest(requestId: string, featuredUntil: Date) {
  await requireAdmin();
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
  await requireAdmin();
  await db.featureRequest.update({
    where: { id: requestId },
    data: { status: "REJECTED", adminNotes: notes },
  });
  revalidatePath("/admin/feature-requests");
}

export type SetUserRoleResult = { error: string } | { success: true };

export async function setUserRole(userId: string, role: UserRole): Promise<SetUserRoleResult> {
  const session = await requireAdmin();
  // Guards against an admin locking themselves out of /admin by demoting the
  // only account that can undo it.
  if (userId === session.userId && role !== "ADMIN") {
    return { error: "You can't remove your own admin access." };
  }
  await db.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin/users");
  return { success: true };
}

// Full profile editor for the admin application-detail page — the client
// asked to be able to edit and revise every part of any creative's profile
// (her own included), not just the narrow grammar-fix fields `updateCreativeFields`
// covers pre-approval. One big form, one big update; required fields fall back
// to the existing value rather than being wiped if the field is left blank.
export async function updateCreativeProfile(creativeId: string, formData: FormData) {
  await requireAdmin();
  const existing = await db.creative.findUniqueOrThrow({ where: { id: creativeId } });

  const str = (name: string) => {
    const v = formData.get(name);
    return typeof v === "string" ? v.trim() : "";
  };
  const strOrNull = (name: string) => str(name) || null;
  const list = (name: string) =>
    str(name)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  const bool = (name: string) => formData.get(name) === "on";

  const workSamples = [1, 2, 3]
    .map((n) => ({
      title: str(`ws${n}Title`),
      medium: str(`ws${n}Medium`),
      year: str(`ws${n}Year`),
      role: str(`ws${n}Role`),
      link: str(`ws${n}Link`),
    }))
    .filter((ws) => ws.title);

  const featuredUntilRaw = str("featuredUntil");

  const creative = await db.creative.update({
    where: { id: creativeId },
    data: {
      firstName: str("firstName") || existing.firstName,
      lastName: str("lastName") || existing.lastName,
      pronouns: strOrNull("pronouns"),
      email: str("email") || existing.email,
      phone: strOrNull("phone"),
      address: strOrNull("address"),
      location: strOrNull("location"),
      howHeard: strOrNull("howHeard"),
      referralName: strOrNull("referralName"),
      bio: str("bio") || existing.bio,
      pccGoals: strOrNull("pccGoals"),
      previousCollaborators: strOrNull("previousCollaborators"),
      unionMemberships: strOrNull("unionMemberships"),
      education: strOrNull("education"),
      additionalNotes: strOrNull("additionalNotes"),
      specialSkills: strOrNull("specialSkills"),
      equipment: strOrNull("equipment"),
      references: strOrNull("references"),
      experienceLevel: strOrNull("experienceLevel"),
      yearsExperience: strOrNull("yearsExperience"),
      completedProjects: strOrNull("completedProjects"),
      notableAchievements: strOrNull("notableAchievements"),
      website: strOrNull("website"),
      imdb: strOrNull("imdb"),
      instagram: strOrNull("instagram"),
      linkedin: strOrNull("linkedin"),
      vimeo: strOrNull("vimeo"),
      publicLink: strOrNull("publicLink"),
      rateStructure: strOrNull("rateStructure"),
      rateRange: strOrNull("rateRange"),
      availability: strOrNull("availability"),
      travel: strOrNull("travel"),
      collaborationPreferences: strOrNull("collaborationPreferences"),
      roles: list("roles"),
      mediums: list("mediums"),
      languages: list("languages"),
      preferredProjectTypes: list("preferredProjectTypes"),
      ratePublic: bool("ratePublic"),
      promoConsent: bool("promoConsent"),
      featured: bool("featured"),
      commentSuspended: bool("commentSuspended"),
      commentFlagged: bool("commentFlagged"),
      featuredUntil: featuredUntilRaw ? new Date(featuredUntilRaw) : null,
      workSamples,
    },
  });

  revalidatePath("/admin/applications");
  revalidatePath(`/admin/applications/${creativeId}`);
  revalidatePath("/directory");
  revalidatePath(`/directory/${creative.slug}`);
  revalidatePath("/");
}

// Admin-side re-crop: the client asked to be able to re-crop any creative's
// photo after the fact, not just what the applicant originally uploaded.
export async function updateCreativeHeadshot(creativeId: string, dataUrl: string) {
  await requireAdmin();
  await db.creative.update({ where: { id: creativeId }, data: { headshot: dataUrl } });
  revalidatePath("/admin/applications");
  revalidatePath(`/admin/applications/${creativeId}`);
  const c = await db.creative.findUnique({ where: { id: creativeId }, select: { slug: true } });
  if (c) revalidatePath(`/directory/${c.slug}`);
}
