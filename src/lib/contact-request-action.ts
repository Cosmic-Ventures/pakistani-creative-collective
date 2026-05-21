"use server";

import { z } from "zod";
import { db } from "./db";
import { sendContactRequestNotification } from "./email";

const Schema = z.object({
  organization: z.string().min(1, "Organization is required"),
  projectDesc: z.string().min(20, "Please describe the project in more detail"),
  lookingFor: z.string().min(10, "Please describe what you're looking for"),
});

export type ContactRequestResult = { error: string } | { success: true };

export async function submitContactRequest(
  creativeId: string,
  userId: string,
  creativeSlug: string,
  _prev: ContactRequestResult | null,
  formData: FormData
): Promise<ContactRequestResult> {
  const parsed = Schema.safeParse({
    organization: formData.get("organization"),
    projectDesc: formData.get("projectDesc"),
    lookingFor: formData.get("lookingFor"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { organization, projectDesc, lookingFor } = parsed.data;

  const req = await db.contactRequest.create({
    data: { userId, creativeId, organization, projectDesc, lookingFor },
    include: { creative: { select: { firstName: true, lastName: true, email: true } } },
  });

  await sendContactRequestNotification(
    `${req.creative.firstName} ${req.creative.lastName}`,
    req.creative.email,
    organization,
    projectDesc,
    lookingFor,
    `${process.env.NEXT_PUBLIC_APP_URL}/admin/contact-requests`
  ).catch(console.error);

  return { success: true };
}
