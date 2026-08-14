/**
 * Canonical option lists for the enrollment form.
 *
 * Deliberately a plain module (no "use server"): these are shared by the
 * enrollment form, the enrollment server action, and the directory's search
 * filters, and a "use server" file may only export async functions — exporting
 * an array from one type-checks and builds fine but blows up at runtime in the
 * client bundle (see AGENTS.md gotcha #1).
 *
 * Roles and mediums originate from the PCC enrollment Jotform
 * (jotform.com/form/253118193860054), revised per the client's 7/23 round
 * (category renames/moves) and alphabetized within each category and across
 * category names, per that round's "all option lists must be alphabetical"
 * instruction.
 */

export const ROLE_CATEGORIES: Record<string, string[]> = {
  "Art & Digital Design": ["Animator", "Artist", "Curator", "Graphic Designer", "Illustrator"],
  Camera: [
    "1st Assistant Camera (1st AC/Focus Puller)", "2nd Assistant Camera (2nd AC/Clapper Loader)",
    "Camera Operator", "Digital Imaging Technician (DIT)", "Director of Photography (DP/Cinematographer)",
    "Photographer", "Still Photographer/BTS",
  ],
  "Casting & Talent": [
    "Actor", "Casting Assistant", "Casting Director", "Choreographer", "Comedian",
    "Dancer", "Model", "Talent Agent", "Voice Actor/Voice-Over Artist",
  ],
  Directing: ["1st Assistant Director", "2nd Assistant Director", "Director", "Script Supervisor"],
  "Editing & Post-Production": ["Assistant Editor", "Colorist", "Editor", "Motion Graphics Designer", "Visual Effects (VFX) Artist"],
  Events: ["Event Producer", "Host/MC", "Panel Moderator"],
  "Film Criticism & Festivals": ["Film Critic", "Film Programmer", "Story Analyst/Reader"],
  "Lighting & Grip": ["Best Boy", "Gaffer (Chief Lighting Technician)", "Grip", "Key Grip", "Lighting Technician"],
  "Marketing, Publicity, & Media": [
    "Content Creator/Influencer", "Marketing Manager", "Podcaster",
    "Publicist", "Social Media Manager", "Social Media/Content Editor",
  ],
  Music: ["Composer", "DJ", "Music Producer", "Musician", "Singer", "Songwriter"],
  Producing: [
    "Associate Producer", "Co-Producer", "Creative Producer", "Executive Producer",
    "Line Producer", "Post-Production Supervisor", "Producer", "Production Coordinator",
    "Showrunner", "Unit Production Manager (UPM)",
  ],
  "Production Design": ["Art Director", "Production Designer", "Props Master", "Set Designer", "Storyboard Artist"],
  Sound: ["Boom Operator", "Foley Artist", "Sound Designer", "Sound Editor/Mixer", "Sound Recordist/Production Sound Mixer"],
  Styling: ["Costume Designer", "Fashion Designer", "Hair Stylist", "Key Costumer", "Makeup Artist", "Special Effects Makeup Artist", "Wardrobe Supervisor"],
  Writing: ["Journalist", "Script Consultant", "Screenwriter", "Writer (Narrative Fiction)"],
};

export const ALL_ROLES = Array.from(new Set(Object.values(ROLE_CATEGORIES).flat())).sort();

/**
 * "Fashion" (not "Fashion/Costume") per the 08/08 round, which asked for
 * Fashion, Art and Music to be selectable as mediums in the directory search.
 * Art and Music were already here; the compound Fashion/Costume label was the
 * only reason "Fashion" wasn't. Costume work is still expressible through the
 * Costume Designer / Wardrobe Supervisor roles under Styling.
 */
export const MEDIUMS = [
  "Animation", "Art", "Branded Content", "Ceramics/Pottery", "Choreography/Dance",
  "Documentary", "Fashion", "Feature Film", "Graphic Novel", "Live Performance",
  "Magazine", "Music", "Music Video", "News", "Novel", "Photography", "Sculpture",
  "Short Film", "Social Media Content", "Stand-Up Comedy", "Television", "Theatre", "Vertical Series",
];

export const PROJECT_TYPES = [
  "Animation", "Commercial/Branded", "Documentary", "Editorial/Print",
  "Live Events", "Music Video", "Narrative Fiction", "Short Form Digital",
];

export const LANGUAGES = [
  "Arabic", "Balochi", "English", "French", "Gujarati", "Hindi",
  "Pashto", "Punjabi", "Sindhi", "Spanish", "Urdu",
];

export const HOW_HEARD = [
  "Direct email from Aneesa Talks",
  "Film Festival or Industry Event",
  "Social Media",
  "Word of Mouth/Referral",
  "Other",
];

export const CURRENCIES = ["AUD", "CAD", "EUR", "GBP", "PKR", "USD", "Other"];

export const PRONOUNS = ["He/Him", "He/They", "She/Her", "She/They", "They/Them", "Any"];

export const RATE_STRUCTURES = ["Day rate", "Hourly", "Negotiable", "Project rate", "Weekly rate"];

export const TRAVEL_OPTIONS = [
  "Domestic travel only", "Local only", "Remote work only", "Will travel/open to international work",
];

export const REFERRAL_TRIGGER = "Word of Mouth/Referral";

export const MAX_HEADSHOT_BYTES = 8 * 1024 * 1024;
