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
 * Website and work-sample link fields are plain text now, not `type="url"`
 * (see EnrollForm.tsx for why), so a bare "www.site.com" with no scheme is
 * expected and common. Every place that renders these as an `<a href>` (the
 * admin applications list, the public profile page) treats the stored string
 * as an absolute URL, so a schemeless value would silently render as a
 * broken relative link — add the scheme once, here, rather than at every
 * render site.
 */
function ensureScheme(value: string): string {
  return value && !/^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? `https://${value}` : value;
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

const ENROLLMENT_BLOCKER_FIELDS = new Set([
  "firstName",
  "lastName",
  "email",
  "headshotLink",
  "bio",
  "roles",
  "mediums",
  "experienceLevel",
  "consents",
]);

/**
 * Records the reason a click was stopped in the browser before the real form
 * action could run. Field names are allow-listed and contain no applicant data.
 * This closes the diagnostic blind spot behind every report that the submit
 * button "did nothing": Vercel can now distinguish a validation blocker from a
 * request that reached the database.
 */
export async function reportEnrollmentBlockers(fields: string[]): Promise<void> {
  const session = await getSession();
  const safeFields = Array.isArray(fields)
    ? [...new Set(fields.filter((field) => ENROLLMENT_BLOCKER_FIELDS.has(field)))].slice(0, 10)
    : [];

  console.warn(
    `[enroll] client blocked before submit: ${safeFields.length ? safeFields.join(", ") : "unknown"}${
      session ? "" : " (session expired)"
    }`
  );
}

export async function enrollAction(
  _prev: EnrollResult | null,
  formData: FormData
): Promise<EnrollResult> {
  // The page itself already redirects anonymous visitors to sign in
  // (app/enroll/page.tsx, backed by proxy.ts at the edge), but this action is
  // a POST endpoint reachable on its own — this is the check that actually
  // holds.
  const session = await getSession();
  if (!session) {
    // 09/01: an applicant hit a submit that "did nothing". The POST reached us
    // and returned an error result, but nothing was written anywhere, so there
    // was no way to tell which of these early returns fired. Every one of them
    // logs now — these lines are what make the next report diagnosable from the
    // Vercel logs alone, instead of by inference from an empty database.
    console.error("[enroll] rejected: no session on submit");
    return {
      error:
        "Your sign-in seems to have expired. Open this page in a new tab, sign in again, and your saved progress will be waiting.",
    };
  }

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
        link: ensureScheme(((formData.get(`ws${n}Link`) as string) ?? "").trim()),
      };
    })
    .filter((ws) => ws.title);

  const parsed = EnrollSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    // Field names only — never the values, which are the applicant's personal
    // details and have no business in a log.
    console.error(
      "[enroll] rejected: validation failed on",
      parsed.error.issues.map((i) => i.path.join(".") || "(root)").join(", ")
    );
    // Every problem, not just the first: fixing one and being told about the
    // next is what makes a form feel broken.
    const problems = [...new Set(parsed.error.issues.map((i) => i.message))];
    return { error: problems.join(" ") };
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
  const optUrl = (v?: string) => {
    const trimmed = opt(v);
    return trimmed ? ensureScheme(trimmed) : undefined;
  };

  try {
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
        website: optUrl(d.website),
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
        specialSkills: opt(d.specialSkills),
        yearsExperience: opt(d.yearsExperience),
        completedProjects: opt(d.completedProjects),
        equipment: opt(d.equipment),
        collaborationPreferences: opt(d.collaborationPreferences),
        references: opt(d.references),
        additionalNotes: opt(d.additionalNotes),
        howHeard: opt(d.howHeard),
        referralName: opt(d.referralName),
        promoConsent: d.consentPromo === "on",
        roles: allRoles,
        mediums: allMediums,
          preferredProjectTypes,
        workSamples: workSamples.length > 0 ? workSamples : undefined,
      },
    });
  } catch (error) {
    // Previously this threw straight through, which surfaces to the applicant
    // as a submit that does nothing at all. Tell them plainly, and leave the
    // draft intact so nothing they typed is lost.
    console.error("[enroll] rejected: database write failed", error);
    return {
      error:
        "Something went wrong saving your application on our side — nothing you typed has been lost. Please try again in a moment, and email pcc@aneesatalks.com if it keeps happening.",
    };
  }

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
