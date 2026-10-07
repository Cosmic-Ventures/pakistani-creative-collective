// Single source of truth for what free vs. member access includes. Rendered by
// <AccessComparison /> on both the home page and /subscribe so the two can't
// drift apart (client feedback 10/02: "this should match on all tabs").
export const FREE_FEATURES = [
  "Browse every creative: photo, name, role, location, and a short bio",
  "Search and filter by role, medium, and location",
];

export const MEMBER_FEATURES = [
  "Full creative profiles: work samples, education, languages, and availability",
  "All social and portfolio links",
  "Rate range, where the creative chooses to share it",
  "Advanced search and filters: experience level, availability, language, and project type",
  "Contact requests, routed through Aneesa Talks",
  "The private Community Dashboard: member updates, job postings, and more",
];
