/**
 * Segment definitions and the recipient shape for the admin Mass Email tool.
 * Plain module (not "use server") — imported by both the client picker
 * component and the server actions, same reasoning as
 * contact-request-constants.ts (AGENTS.md gotcha #1).
 */

export type MassEmailSegment = {
  id: string;
  label: string;
  description: string;
};

export const MASS_EMAIL_SEGMENTS: MassEmailSegment[] = [
  { id: "all-users", label: "All accounts", description: "Every signed-up user, any role." },
  { id: "unpaid-users", label: "Free accounts", description: "Signed up, not currently subscribed." },
  { id: "paid-users", label: "Paid accounts", description: "Active PCC subscribers." },
  { id: "creative-pending", label: "Applications: pending", description: "Applications awaiting a decision." },
  { id: "creative-approved", label: "Applications: approved", description: "Approved creatives — paid or not." },
  { id: "creative-rejected", label: "Applications: not accepted", description: "Applications that weren't approved." },
  { id: "creative-inactive", label: "Applications: inactive", description: "Approved creatives marked inactive." },
  { id: "creative-flagged", label: "Applications: flagged", description: "Creatives flagged for moderation." },
  {
    id: "incomplete-drafts",
    label: "Started, never submitted",
    description: "Signed up and began an application but never finished it.",
  },
];

export const DEFAULT_SEGMENT_ID = MASS_EMAIL_SEGMENTS[0].id;

/** One row in the recipient picker. `id` round-trips through the form as a checkbox value. */
export type MassEmailRecipient = {
  id: string; // "user:<userId>" | "creative:<creativeId>"
  email: string;
  firstName: string;
  name: string;
  detail: string; // role, application status, etc. — shown next to the name
};
