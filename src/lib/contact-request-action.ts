"use server";

import { z } from "zod";
import { db } from "./db";
import { sendContactRequestNotification } from "./email";
import { EXPERIENCE_LEVELS, REQUEST_TYPES, TIMELINES } from "./contact-request-constants";

const Schema = z.object({
  requesterName: z.string().min(1, "Full name is required"),
  requesterEmail: z.email("Invalid email address"),
  company: z.string().optional(),
  requesterRole: z.string().optional(),
  portfolioLink: z.string().optional(),
  experienceLevel: z.enum(EXPERIENCE_LEVELS, { error: "Select your experience level" }),
  requestType: z.enum(REQUEST_TYPES, { error: "Select a request type" }),
  requestTypeOther: z.string().optional(),
  message: z.string().min(20, "Please tell us more about why you're looking to connect"),
  timeline: z.enum(TIMELINES, { error: "Select a timeline" }),
  consentAccurate: z.literal("on", { error: "Please confirm all consent checkboxes" }),
  consentRouting: z.literal("on", { error: "Please confirm all consent checkboxes" }),
  consentDiscretion: z.literal("on", { error: "Please confirm all consent checkboxes" }),
});

export type ContactRequestResult = { error: string } | { success: true };

export async function submitContactRequest(
  creativeId: string,
  userId: string,
  creativeSlug: string,
  _prev: ContactRequestResult | null,
  formData: FormData
): Promise<ContactRequestResult> {
  const parsed = Schema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const d = parsed.data;

  const req = await db.contactRequest.create({
    data: {
      userId,
      creativeId,
      requesterName: d.requesterName,
      requesterEmail: d.requesterEmail,
      company: d.company,
      requesterRole: d.requesterRole,
      portfolioLink: d.portfolioLink,
      experienceLevel: d.experienceLevel,
      requestType: d.requestType,
      requestTypeOther: d.requestType === "Other" ? d.requestTypeOther : undefined,
      message: d.message,
      timeline: d.timeline,
    },
    include: { creative: { select: { firstName: true, lastName: true, email: true } } },
  });

  await sendContactRequestNotification(
    `${req.creative.firstName} ${req.creative.lastName}`,
    d.requesterName,
    d.requestType === "Other" ? `Other — ${d.requestTypeOther}` : d.requestType,
    d.message,
    d.timeline,
    `${process.env.NEXT_PUBLIC_APP_URL}/admin/contact-requests`
  ).catch(console.error);

  return { success: true };
}
