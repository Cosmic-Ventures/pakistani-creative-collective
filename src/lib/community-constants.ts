import type { PostCategory, ReactionType } from "@prisma/client";

export const POST_CATEGORY_LABELS: Record<PostCategory, string> = {
  RECENT_WORK: "Recent Work",
  SEEKING_FUNDING: "Seeking Funding",
  SEEKING_COLLABORATORS: "Seeking Collaborators",
  AVAILABLE_FOR_WORK: "Available for Work",
};

export const POST_CATEGORY_DESCRIPTIONS: Record<PostCategory, string> = {
  RECENT_WORK: "Share a completed or released project.",
  SEEKING_FUNDING: "Looking for financial partners or investors for a specific project.",
  SEEKING_COLLABORATORS: "Looking for other creatives to join a project.",
  AVAILABLE_FOR_WORK: "Open to paid opportunities within a specific region and timeframe.",
};

// Categories where region + a deadline are required, and the post auto-expires
// once that deadline passes.
export const CATEGORIES_REQUIRING_DEADLINE: PostCategory[] = ["AVAILABLE_FOR_WORK", "SEEKING_COLLABORATORS"];
export const CATEGORIES_REQUIRING_REGION: PostCategory[] = ["AVAILABLE_FOR_WORK"];

export const REACTION_LABELS: Record<ReactionType, string> = {
  CONGRATULATIONS: "Congratulations",
  INTERESTED: "Interested",
  SUPPORT: "Support",
  SHARING_THIS: "Sharing This",
};

export const REACTION_EMOJI: Record<ReactionType, string> = {
  CONGRATULATIONS: "🎉",
  INTERESTED: "👀",
  SUPPORT: "🤝",
  SHARING_THIS: "🔁",
};

export const POST_BODY_MAX_WORDS = 500;
export const COMMENT_MAX_WORDS = 300;
export const COMMENT_REMOVAL_FLAG_THRESHOLD = 3; // admin discretion, but this is the number we auto-flag at

/**
 * A post's link, reduced to something safe to put in an `href`.
 *
 * Both the member feed and the admin moderation list render this straight into
 * `<a href={post.link}>`, and the post body is member-supplied, so the scheme
 * has to be checked somewhere. It can't be the browser: `createPost` and
 * `editPost` are Server Actions — ordinary POST endpoints — and the composer's
 * `type="url"` only constrains someone using the actual form. `link` was typed
 * `z.string().optional()` with no scheme check at all, which let a
 * `javascript:` or `data:` URL be stored and then rendered as a live link in
 * the admin's own moderation queue.
 *
 * Returns null for anything that isn't http(s), so the link is simply not
 * shown. A schemeless "www.example.com" is treated as https rather than
 * rejected — that's ordinary typing, and the same allowance `ensureScheme`
 * makes for the enrollment form's link fields.
 *
 * Lives here rather than in the action because a "use server" module may only
 * export async functions (AGENTS.md gotcha #1).
 */
export function normalizePostLink(raw: string | null | undefined): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;

  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
  return parsed.toString();
}
