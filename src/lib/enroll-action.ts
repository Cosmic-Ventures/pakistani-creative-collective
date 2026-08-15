"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "./db";
import { sendEnrollmentNotification } from "./email";
import { shortExperienceLevel } from "./experience-levels";
import { discardEnrollmentDraft } from "./enroll-draft-actions";
import { getSession } from "./session";

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

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Server-side mirror of the form's own required-field rules. Only essentials are
 * enforced (08/08 client round): portfolio URL, availability, references and all
 * three work samples are optional, so an emerging creative with none of them can
 * still apply. Messages are explicit rather than Zod's default "Invalid input" —
 * this text is what the applicant sees if anything slips past the client check.
 */
const EnrollSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  pronouns: z.string().optional(),
  email: z.email("A valid email address is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
  location: z.string().optional(),
  howHeard: z.string().optional(),
  headshotLink: z.string().min(1, "A professional headshot is required"),
  bio: z
    .string()
    .min(100, "Bio must be at least 100 characters")
    .refine((b) => wordCount(b) <= 200, "Bio must be 200 words or fewer"),
  previousCollaborators: z.string().optional(),
  unionMemberships: z.string().optional(),
  education: z.string().optional(),
  pccGoals: z.string().optional(),
  additionalNotes: z.string().optional(),
  rolesOther: z.string().optional(),
  mediumsOther: z.string().optional(),
  experienceLevel: z.string().min(1, "Select your experience level"),
  yearsExperience: z.string().optional(),
  completedProjects: z.string().optional(),
  notableAchievements: z.string().optional(),
  website: z.string().optional(),
  imdb: z.string().optional(),
  instagram: z.string().optional(),
  linkedin: z.string().optional(),
  vimeo: z.string().optional(),
  rateStructure: z.string().optional(),
  rateCurrency: z.string().optional(),
  rateRangeAmount: z.string().optional(),
  ratePublic: z.string().optional(),
  availability: z.string().optional(),
  travel: z.string().optional(),
  languages: z.string().optional(),
  specialSkills: z.string().optional(),
  equipment: z.string().optional(),
  collaborationPreferences: z.string().optional(),
  references: z.string().optional(),
  referralName: z.string().optional(),
  consentPromo: z.string().optional(),
});

export type EnrollResult = { error: string } | { success: true };

export async function enrollAction(
  _prev: EnrollResult | null,
  formData: FormData
): Promise<EnrollResult> {
  // The page itself already redirects anonymous visitors to sign in
  // (app/enroll/page.tsx, backed by proxy.ts at the edge), but this action is
  // a POST endpoint reachable on its own — this is the check that actually
  // holds.
  const session = await getSession();
  if (!session) return { error: "Sign in to submit your application." };

  // Multi-value fields
  const roles = formData.getAll("roles") as string[];
  const mediums = formData.getAll("mediums") as string[];
  const preferredProjectTypes = formData.getAll("preferredProjectTypes") as string[];
  const languagesCheck = formData.getAll("languagesCheck") as string[];
  const collaborationPreferences = (formData.getAll("collaborationPreferences") as string[])
    .map(shortExperienceLevel)
    .join(", ");
  formData.set("collaborationPreferences", collaborationPreferences);

  const rolesOtherRaw = (formData.get("rolesOther") as string) ?? "";
  const mediumsOtherRaw = (formData.get("mediumsOther") as string) ?? "";
  const allRoles = [...roles, ...rolesOtherRaw.split(",").map((r) => r.trim()).filter(Boolean)];
  const allMediums = [...mediums, ...mediumsOtherRaw.split(",").map((m) => m.trim()).filter(Boolean)];

  // Work samples
  const workSamples = [1, 2, 3]
    .map((n) => {
      const roleSelect = formData.getAll(`ws${n}RoleSelect`) as string[];
      const roleOther = (formData.get(`ws${n}RoleOther`) as string) ?? "";
      return {
        title: formData.get(`ws${n}Title`) as string,
        medium: formData.get(`ws${n}Medium`) as string,
        year: formData.get(`ws${n}Year`) as string,
        role: [...roleSelect, roleOther.trim()].filter(Boolean).join(", "),
        link: formData.get(`ws${n}Link`) as string,
      };
    })
    .filter((ws) => ws.title);

  const parsed = EnrollSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const d = parsed.data;

  const slug = await uniqueSlug(d.firstName, d.lastName);

  const rateRange = [d.rateCurrency, d.rateRangeAmount].filter(Boolean).join(" ") || undefined;

  // A skipped optional field arrives as "" from the form. Store it as absent
  // rather than an empty string, so nullish-coalescing fallbacks downstream
  // still fire — e.g. the profile page's `website ?? publicLink`, which an
  // empty-string website would shadow. Matters more now that most fields are
  // optional and applicants are expected to leave some blank.
  const opt = (v?: string) => {
    const trimmed = v?.trim();
    return trimmed ? trimmed : undefined;
  };

  await db.creative.create({
    data: {
      slug,
      firstName: d.firstName,
      lastName: d.lastName,
      pronouns: opt(d.pronouns),
      email: d.email,
      phone: opt(d.phone),
      address: opt(d.address),
      location: opt(d.location),
      bio: d.bio,
      headshot: d.headshotLink,
      previousCollaborators: opt(d.previousCollaborators),
      unionMemberships: opt(d.unionMemberships),
      education: opt(d.education),
      pccGoals: opt(d.pccGoals),
      experienceLevel: shortExperienceLevel(d.experienceLevel),
      notableAchievements: opt(d.notableAchievements),
      website: opt(d.website),
      imdb: opt(d.imdb),
      instagram: opt(d.instagram),
      linkedin: opt(d.linkedin),
      vimeo: opt(d.vimeo),
      rateStructure: opt(d.rateStructure),
      rateRange,
      ratePublic: d.ratePublic === "yes",
      availability: opt(d.availability),
      travel: opt(d.travel),
      languages: [
        ...languagesCheck,
        ...(d.languages ? d.languages.split(",").map((l) => l.trim()).filter(Boolean) : []),
      ],
      equipment: opt(d.equipment),
      collaborationPreferences: opt(d.collaborationPreferences),
      references: opt(d.references),
      referralName: opt(d.referralName),
      promoConsent: d.consentPromo === "on",
      roles: allRoles,
      mediums: allMediums,
      preferredProjectTypes,
      workSamples: workSamples.length > 0 ? workSamples : undefined,
    },
  });

  await sendEnrollmentNotification({
    firstName: d.firstName,
    lastName: d.lastName,
    email: d.email,
    bio: d.bio,
    // Whichever link the applicant gave — the portfolio URL is optional now, so
    // fall back to the other profile links before showing nothing.
    portfolioLink: opt(d.website) ?? opt(d.instagram) ?? opt(d.imdb) ?? opt(d.vimeo) ?? opt(d.linkedin),
    location: opt(d.location),
    roles: allRoles,
    experienceLevel: shortExperienceLevel(d.experienceLevel),
  }).catch(console.error);

  // The application is filed, so any saved draft is spent. Must happen before
  // redirect(), which throws to unwind the action.
  await discardEnrollmentDraft().catch(console.error);

  redirect("/enroll/success");
}
