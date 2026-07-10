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
