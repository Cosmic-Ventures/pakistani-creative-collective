"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "./db";
import { sendEnrollmentNotification } from "./email";

function toSlug(first: string, last: string): string {
  const base = `${first}-${last}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return base || "creative";
}

async function uniqueSlug(first: string, last: string): Promise<string> {
  const base = toSlug(first, last);
  const exists = await db.creative.findMany({
    where: { slug: { startsWith: base } },
    select: { slug: true },
  });
  if (!exists.length) return base;
  const suffixes = exists.map((e) => {
    const m = e.slug.match(/-(\d+)$/);
    return m ? parseInt(m[1]) : 0;
  });
  return `${base}-${Math.max(...suffixes) + 1}`;
}

const EnrollSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  pronouns: z.string().optional(),
  email: z.email(),
  phone: z.string().optional(),
  address: z.string().optional(),
  howHeard: z.string().optional(),
  headshotLink: z.string().optional(),
  bio: z.string().min(100, "Bio must be at least 100 characters"),
  publicLink: z.string().optional(),
  previousCollaborators: z.string().optional(),
  unionMemberships: z.string().optional(),
  education: z.string().optional(),
  pccGoals: z.string().optional(),
  additionalNotes: z.string().optional(),
  experienceLevel: z.string().min(1, "Select an experience level"),
  yearsExperience: z.string().optional(),
  completedProjects: z.string().optional(),
  notableAchievements: z.string().optional(),
  website: z.string().optional(),
  imdb: z.string().optional(),
  instagram: z.string().optional(),
  linkedin: z.string().optional(),
  vimeo: z.string().optional(),
  rateStructure: z.string().optional(),
  rateRange: z.string().optional(),
  ratePublic: z.string().optional(),
  availability: z.string().min(1, "Select your availability"),
  languages: z.string().optional(),
  specialSkills: z.string().optional(),
  equipment: z.string().optional(),
  collaborationPreferences: z.string().optional(),
  references: z.string().optional(),
  referralName: z.string().optional(),
});

export type EnrollResult = { error: string } | { success: true };

export async function enrollAction(
  _prev: EnrollResult | null,
  formData: FormData
): Promise<EnrollResult> {
  // Multi-value fields
  const roles = formData.getAll("roles") as string[];
  const mediums = formData.getAll("mediums") as string[];
  const preferredProjectTypes = formData.getAll("preferredProjectTypes") as string[];

  // Work samples
  const workSamples = [1, 2, 3]
    .map((n) => ({
      title: formData.get(`ws${n}Title`) as string,
      medium: formData.get(`ws${n}Medium`) as string,
      year: formData.get(`ws${n}Year`) as string,
      role: formData.get(`ws${n}Role`) as string,
      link: formData.get(`ws${n}Link`) as string,
    }))
    .filter((ws) => ws.title);

  const parsed = EnrollSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const d = parsed.data;

  const slug = await uniqueSlug(d.firstName, d.lastName);

  await db.creative.create({
    data: {
      slug,
      firstName: d.firstName,
      lastName: d.lastName,
      pronouns: d.pronouns,
      email: d.email,
      phone: d.phone,
      address: d.address,
      bio: d.bio,
      publicLink: d.publicLink,
      headshot: d.headshotLink,
      previousCollaborators: d.previousCollaborators,
      unionMemberships: d.unionMemberships,
      education: d.education,
      pccGoals: d.pccGoals,
      experienceLevel: d.experienceLevel,
      notableAchievements: d.notableAchievements,
      website: d.website,
      imdb: d.imdb,
      instagram: d.instagram,
      linkedin: d.linkedin,
      vimeo: d.vimeo,
      rateStructure: d.rateStructure,
      rateRange: d.rateRange,
      ratePublic: d.ratePublic === "yes",
      availability: d.availability,
      languages: d.languages ? d.languages.split(",").map((l) => l.trim()).filter(Boolean) : [],
      equipment: d.equipment,
      collaborationPreferences: d.collaborationPreferences,
      references: d.references,
      referralName: d.referralName,
      roles,
      mediums,
      preferredProjectTypes,
      workSamples: workSamples.length > 0 ? workSamples : undefined,
    },
  });

  await sendEnrollmentNotification(d.firstName, d.lastName, d.email).catch(console.error);

  redirect("/enroll/success");
}
