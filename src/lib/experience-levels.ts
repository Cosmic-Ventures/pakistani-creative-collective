/**
 * Canonical experience-tier definitions. Source of truth: the client's
 * "Identify your Level" reference (aneesatalks.com/pakistani-creative-collective),
 * cross-checked against the PCC enrollment Jotform's Experience Level field —
 * both agree on these five tiers, years, and project counts.
 *
 * Used by: the enrollment form's experience-level select, the contact request
 * form's experience-level radio group (re-exported from contact-request-constants),
 * and the home page's "Five Experience Tiers" breakdown section.
 */

export const EXPERIENCE_LEVELS = [
  "Emerging Creative (0-2 years / 1-3 projects)",
  "Developing Professional (2-4 years / 4-8 projects)",
  "Established Creative (4-7 years / 10+ projects)",
  "Accomplished Professional (7-12 years / 15+ projects)",
  "Veteran Creative (12+ years / 20+ projects)",
] as const;

/**
 * Canonical stored form of an experience level: the tier name without the
 * years/projects parenthetical (e.g. "Developing Professional"). Forms show
 * the full EXPERIENCE_LEVELS labels for context, but everything persisted to
 * Creative rows must go through this so directory filters and analytics
 * aggregate on one value per tier.
 */
export function shortExperienceLevel(label: string): string {
  return label.replace(/\s*\([^)]*\)\s*$/, "").trim();
}

export type ExperienceTier = {
  name: string;
  years: string;
  projects: string;
  criteriaNote?: string;
  criteria: string[];
};

export const EXPERIENCE_TIERS: ExperienceTier[] = [
  {
    name: "Emerging Creative",
    years: "0–2 years",
    projects: "1–3 projects",
    criteria: [
      "Student work, thesis projects, or early creative experiments",
      "Passion projects and initial collaborations",
      "Community-based projects",
      "Building a foundational portfolio",
    ],
  },
  {
    name: "Developing Professional",
    years: "2–4 years",
    projects: "4–8 projects",
    criteriaNote: "Meet 3 of 4 criteria:",
    criteria: [
      "Has completed paid creative projects",
      "Has participated in recognized showcases, exhibitions, publications, or industry events",
      "Can provide 2+ professional references",
      "Works independently with minimal supervision",
    ],
  },
  {
    name: "Established Creative",
    years: "4–7 years",
    projects: "10+ projects",
    criteriaNote: "Meet 3 of 4 criteria:",
    criteria: [
      "A significant portion of income comes from creative work",
      "Has recognized credits, features, exhibitions, publications, or awards",
      "Has developed a consistent professional portfolio",
      "Has repeat clients, collaborators, or industry relationships",
    ],
  },
  {
    name: "Accomplished Professional",
    years: "7–12 years",
    projects: "15+ projects",
    criteriaNote: "Meet 2 of 3 criteria:",
    criteria: [
      "Has received major recognition, awards, or industry acknowledgements",
      "Has led large-scale projects or worked with established organizations/brands",
      "Has a strong professional reputation within their field",
    ],
  },
  {
    name: "Veteran / Master Creative",
    years: "12+ years",
    projects: "20+ projects",
    criteriaNote: "Meet 3 of 4 criteria:",
    criteria: [
      "Recognized nationally or internationally within their field",
      "Has received significant awards, honors, or career recognition",
      "Has built an extensive body of influential work",
      "Actively mentors, leads, or contributes to the creative community",
    ],
  },
];
