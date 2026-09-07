"use server";

import { z } from "zod";
import { db } from "./db";
import { getSession } from "./session";
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
  _prev: ContactRequestResult | null,
  formData: FormData
): Promise<ContactRequestResult> {
  // The request page already redirects anonymous and unpaid visitors, but a
  // Server Action is an ordinary POST endpoint reachable on its own — being
  // rendered on a gated page is not by itself protection (see the note on
  // `requireAdmin` in session.ts). This is the check that actually holds.
  //
  // `userId` used to be a bound argument passed down from the page. Bound
  // arguments travel to the browser and come back with the request, so that
  // made the requester's identity attacker-controlled: anyone could file a
  // contact request attributed to any account. It comes from the session now
  // and is never accepted from the caller.
  const session = await getSession();
  if (!session) {
    return { error: "Your sign-in has expired — sign in again and resubmit." };
  }
  if (session.role !== "PAID" && session.role !== "ADMIN") {
    return { error: "Contact requests are available with a paid membership." };
  }

  // Only listed, approved creatives are contactable. Without this the id — also
  // a bound argument — could name a pending or rejected applicant who was never
  // published.
  const target = await db.creative.findFirst({
    where: { id: creativeId, status: "APPROVED" },
    select: { id: true },
  });
  if (!target) {
    return { error: "That creative isn't available for contact requests." };
  }

  const parsed = Schema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const d = parsed.data;

  const req = await db.contactRequest.create({
    data: {
      userId: session.userId,
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
