import { EXPERIENCE_LEVELS } from "./experience-levels";

/**
 * "Open to working with" (Creative.collaborationPreferences) is a comma-joined
 * list of tier names, or "Any level", saved by the enrollment form — but an admin
 * can also type it free-hand, so matching is by each tier's first word
 * ("Emerging", "Developing", …) instead of an exact string.
 */
const tierKey = (label: string) => label.trim().split(/\s+/)[0].toLowerCase();

const TIER_KEYS = EXPERIENCE_LEVELS.map(tierKey);

/** The tier keys a creative has said they'll work with; null means "no restriction". */
export function acceptedTiers(openTo: string | null | undefined): string[] | null {
  const text = (openTo ?? "").toLowerCase();
  if (!text.trim() || text.includes("any level")) return null;
  const found = TIER_KEYS.filter((k) => text.includes(k));
  // Text we can't read as tiers must not silently block every request.
  return found.length ? found : null;
}

/** True when the creative hasn't filled in "Open to working with" at all. */
export function hasNoPreference(openTo: string | null | undefined): boolean {
  return !(openTo ?? "").trim();
}

/** Whether a requester at `requesterLevel` meets the creative's stated preference. */
export function requesterMeetsPreference(
  openTo: string | null | undefined,
  requesterLevel: string
): boolean {
  const accepted = acceptedTiers(openTo);
  return !accepted || accepted.includes(tierKey(requesterLevel));
}

export function preferenceMessage(firstName: string, openTo: string | null | undefined): string {
  return (
    `${firstName} has asked to hear only from creatives at these levels: ${openTo}. ` +
    "Your selected experience level isn't one of them, so this request can't be sent."
  );
}
