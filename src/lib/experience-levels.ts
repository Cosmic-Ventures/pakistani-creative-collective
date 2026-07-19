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
      "Student films or thesis projects",
      "Passion projects and early collaborations",
      "Local community projects",
      "Building a foundational portfolio",
    ],
  },
  {
    name: "Developing Professional",
    years: "2–4 years",
    projects: "4–8 projects",
    criteriaNote: "Meet 3 of 4:",
    criteria: [
      "At least 25% of projects are paid",
      "1–2 festival selections (any tier)",
      "Can provide 2+ professional references",
      "Works independently with minimal supervision",
    ],
  },
  {
    name: "Established Creative",
    years: "4–7 years",
    projects: "10+ projects",
    criteriaNote: "Meet 3 of 4:",
    criteria: [
      "30–40%+ income from creative work",
      "3+ selections at Tier 2–3 festivals",
      "Won 2+ juried awards",
      "Has repeat clients/collaborators who seek them out",
    ],
  },
  {
    name: "Accomplished Professional",
    years: "7–12 years",
    projects: "15+ projects",
    criteriaNote: "Meet 2 of 3:",
    criteria: [
      "2+ Tier 1 festival selections OR 5+ Tier 2 selections",
      "Work has achieved distribution/streaming release",
      "Regularly works on budgets $100K+",
    ],
  },
  {
    name: "Veteran / Master Creative",
    years: "12+ years",
    projects: "20+ projects",
    criteriaNote: "Meet 3 of 4:",
    criteria: [
      "Nationally/internationally recognized name",
      "3+ Tier 1 festival selections OR major career award",
      "Multiple distributed features or equivalent body of work",
      "Active mentor/industry leader",
    ],
  },
];
