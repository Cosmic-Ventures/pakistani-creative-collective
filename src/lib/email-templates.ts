/**
 * The member-facing email templates, and the little markup language the admin
 * panel edits them in.
 *
 * 09/01 client round: "in a dream world there's a way for me to edit and revise
 * all mass email templates under the admin panel". So every email that goes to
 * an applicant or member is defined here as editable text, stored (once edited)
 * in the EmailTemplate table, and rendered through the same brand chrome as
 * before. The defaults below are the copy that ships; the database only ever
 * holds the client's overrides, so an un-edited template always tracks the code.
 *
 * The operational notifications that go to the PCC's own inbox (new
 * application, new contact request, new community post) are deliberately NOT in
 * here — they're structured summaries for triage, not copy anyone wants to
 * rewrite, and they'd break if their detail rows were edited away.
 *
 * ── The markup ───────────────────────────────────────────────────────────────
 * Blank line = new paragraph. Beyond that there are exactly three special
 * shapes, chosen so a non-technical editor can't produce broken HTML:
 *
 *   [Button label](https://…)   a paragraph that is only this becomes a button
 *   - Label: value              a block of these becomes mint-labelled rows
 *   {{message}}                 a "block" variable alone becomes a quoted panel
 *
 * Everything else is escaped and set as a paragraph, so pasted text can never
 * smuggle markup into an email. `{{variables}}` are substituted after the
 * structure is parsed, which is what keeps a member-supplied name from being
 * read as a button or a link.
 *
 * Imports nothing but the pure builders, so this module can also be bundled for
 * the browser — that's what powers the live preview in the template editor.
 */
import {
  appUrl,
  ctaButton,
  detailRow,
  emailShell,
  escapeHtml,
  paragraph,
  quotedPanel,
  signOff,
} from "./email-render";

export type VariableKind = "text" | "url" | "block";

export type TemplateVariable = {
  name: string;
  /** Shown beside the variable chip in the editor. */
  description: string;
  /** Stand-in used by the editor preview and the email-preview script. */
  sample: string;
  /** "url" is only valid inside a button target; "block" renders as a panel. */
  kind?: VariableKind;
};

export type EmailTemplateDef = {
  key: string;
  name: string;
  /** When this email goes out — the one-liner the admin list shows. */
  description: string;
  subject: string;
  preheader: string;
  body: string;
  variables: TemplateVariable[];
};

/** The editable half of a template: what the database stores. */
export type TemplateContent = {
  subject: string;
  preheader: string;
  body: string;
};

const APP = "{{siteUrl}}";

export const EMAIL_TEMPLATES: EmailTemplateDef[] = [
  {
    key: "application-received",
    name: "Application received",
    description: "Sent to an applicant the moment they submit the application form.",
    subject: "PCC — We received your application",
    preheader: "We've received your application and will be in touch soon.",
    body: `Hi {{firstName}},

Thank you for applying to the Pakistani Creative Collective. We've received your application and will review it shortly. You'll hear from us via email once a decision has been made.`,
    variables: [
      { name: "firstName", description: "Applicant's first name", sample: "Sara" },
    ],
  },
  {
    key: "application-approved",
    name: "Application approved",
    description: "Sent when you approve an application from the Applications tab.",
    subject: "You've been approved for the Pakistani Creative Collective!",
    preheader: "You're in — we'll be in touch the moment the directory goes live.",
    // 09/01 round: the directory and subscriptions aren't public yet, so this
    // email no longer sends anyone to a page they can't reach ("it's still
    // private so I don't have anywhere to direct them to rn"). The profile and
    // subscribe buttons are one line away in the editor when that changes.
    body: `Hi {{firstName}},

Great news — your application to the Pakistani Creative Collective has been approved. You're officially part of the collective.

The directory and subscriptions aren't open to the public just yet. We're putting the finishing touches on everything, and you'll be the first to know the moment it goes live — keep an eye on your inbox.

Thank you for being part of this from the beginning.`,
    variables: [
      { name: "firstName", description: "Creative's first name", sample: "Sara" },
      { name: "profileUrl", description: "Link to their public profile", sample: "https://pcc.aneesatalks.com/directory/sara-khan", kind: "url" },
      { name: "subscribeUrl", description: "Link to the subscribe page", sample: "https://pcc.aneesatalks.com/subscribe", kind: "url" },
      { name: "monthlyPrice", description: "Current monthly price, read from Stripe", sample: "$7.99" },
    ],
  },
  {
    key: "application-revision",
    name: "Application needs revisions",
    description: "Sent when you flag an application for changes, with your note.",
    subject: "PCC — Your application needs a few changes",
    preheader: "Your application needs a few changes before it can be approved.",
    body: `Hi {{firstName}},

Thanks for applying to the Pakistani Creative Collective. Your application needs a few changes before we can approve it:

{{note}}

You're welcome to reapply with the revisions above using the same application link.

[Reapply to the PCC →](${APP}/enroll)`,
    variables: [
      { name: "firstName", description: "Applicant's first name", sample: "Sara" },
      { name: "note", description: "What you asked them to revise", sample: "Please add at least one work sample and expand your bio to 100 characters.", kind: "block" },
    ],
  },
  {
    key: "application-rejected",
    name: "Application not accepted",
    description: "Sent when you reject an application.",
    subject: "PCC — Application Update",
    preheader: "An update on your PCC application.",
    body: `Hi {{firstName}},

Thank you for your interest in the Pakistani Creative Collective. After reviewing your application, we're not able to add you to the database at this time. This may change in the future.`,
    variables: [
      { name: "firstName", description: "Applicant's first name", sample: "Sara" },
    ],
  },
  {
    key: "contact-request-forwarded",
    name: "Contact request forwarded",
    description: "Sent to a creative when you forward a contact request to them.",
    subject: "You have a new contact request on the PCC",
    preheader: "{{requesterName}} would like to connect with you through the PCC.",
    body: `Hi {{firstName}},

Someone is interested in working with you through the Pakistani Creative Collective. This request has been reviewed by Aneesa Talks and forwarded to you — you're not obligated to respond.

- From: {{requesterName}}
- Request type: {{requestType}}
- Timeline: {{timeline}}

Here's what they said:

{{message}}

Reply to Aneesa Talks directly to let us know if you'd like to connect, and we'll help facilitate the introduction.`,
    variables: [
      { name: "firstName", description: "Creative's first name", sample: "Sara" },
      { name: "requesterName", description: "Who is trying to reach them", sample: "Imran Malik" },
      { name: "requestType", description: "Kind of request", sample: "Collaboration Opportunity" },
      { name: "timeline", description: "When they need someone", sample: "Within next 3 months" },
      { name: "message", description: "The requester's message", sample: "I'm producing a short film in Karachi this spring and would love to talk about you shooting it.", kind: "block" },
    ],
  },
  {
    key: "featured-creative",
    name: "Selected as featured creative",
    description: "Sent when you approve a feature request or feature a creative.",
    subject: "You've been selected as a PCC Featured Creative!",
    preheader: "Your profile has been selected as this month's featured creative.",
    body: `Hi {{firstName}},

We're excited to let you know that your profile has been selected as a featured creative for this month on the Pakistani Creative Collective. Your full profile will be publicly visible to all visitors for the duration of the featured period.

[View your profile →]({{profileUrl}})`,
    variables: [
      { name: "firstName", description: "Creative's first name", sample: "Sara" },
      { name: "profileUrl", description: "Link to their public profile", sample: "https://pcc.aneesatalks.com/directory/sara-khan", kind: "url" },
    ],
  },
  {
    key: "community-post-approved",
    name: "Community post approved",
    description: "Sent to a member when you approve their Community Dashboard post.",
    subject: "Your Community post is live",
    preheader: "Your post is now live on the Community Dashboard.",
    body: `Hi {{firstName}},

Your post "{{postTitle}}" has been approved and is now live on the Community Dashboard.

[View the dashboard →](${APP}/community)`,
    variables: [
      { name: "firstName", description: "Member's first name", sample: "Sara" },
      { name: "postTitle", description: "Title of their post", sample: "Seeking a gaffer for a Karachi shoot" },
    ],
  },
  {
    key: "community-post-rejected",
    name: "Community post not approved",
    description: "Sent to a member when you reject their Community Dashboard post.",
    subject: "Update on your Community post",
    preheader: "An update on your Community post.",
    body: `Hi {{firstName}},

Your post "{{postTitle}}" wasn't approved for the Community Dashboard at this time.`,
    variables: [
      { name: "firstName", description: "Member's first name", sample: "Sara" },
      { name: "postTitle", description: "Title of their post", sample: "Seeking a gaffer for a Karachi shoot" },
    ],
  },
  {
    key: "comment-removed",
    name: "Comment removed",
    description: "Sent to a member when you remove one of their comments.",
    subject: "A comment of yours was removed",
    preheader: "A comment you posted was removed.",
    body: `Hi {{firstName}},

A comment you posted on the Community Dashboard was removed by Aneesa Talks.`,
    variables: [
      { name: "firstName", description: "Member's first name", sample: "Sara" },
    ],
  },
  {
    key: "password-reset",
    name: "Password reset",
    description: "Sent when someone asks to reset their password from the sign-in page.",
    subject: "PCC — Reset your password",
    preheader: "A link to set a new password for your PCC account.",
    body: `Hi {{firstName}},

We received a request to reset the password on your Pakistani Creative Collective account. Click the button below to choose a new one — the link expires in {{expiryHours}} hour(s).

[Set a new password →]({{resetUrl}})

If you didn't ask for this, you can safely ignore this email; your password stays as it is.`,
    variables: [
      { name: "firstName", description: "The member's first name", sample: "Sara" },
      { name: "resetUrl", description: "One-time reset link", sample: "https://pcc.aneesatalks.com/auth/reset?token=example", kind: "url" },
      { name: "expiryHours", description: "How long the link stays valid", sample: "1" },
    ],
  },
];

/**
 * Available to every template without being declared, because every template
 * may want to link back to the site. Filled in from NEXT_PUBLIC_APP_URL, so the
 * copy never hard-codes a domain that changes between environments.
 */
export const GLOBAL_VARIABLES: TemplateVariable[] = [
  { name: "siteUrl", description: "The PCC website address", sample: "https://pcc.aneesatalks.com", kind: "url" },
];

export const TEMPLATE_BY_KEY: Record<string, EmailTemplateDef> = Object.fromEntries(
  EMAIL_TEMPLATES.map((t) => [t.key, t])
);

export type TemplateKey = string;

export function getTemplateDef(key: string): EmailTemplateDef | undefined {
  return TEMPLATE_BY_KEY[key];
}

/** The shipped copy, used whenever the database holds no override. */
export function defaultContent(def: EmailTemplateDef): TemplateContent {
  return { subject: def.subject, preheader: def.preheader, body: def.body };
}

export function sampleValues(def: EmailTemplateDef): Record<string, string> {
  return Object.fromEntries([...GLOBAL_VARIABLES, ...def.variables].map((v) => [v.name, v.sample]));
}

/** Everything the editor offers as a chip, and everything `save` will accept. */
export function allVariables(def: EmailTemplateDef): TemplateVariable[] {
  return [...def.variables, ...GLOBAL_VARIABLES];
}

const VARIABLE_RE = /\{\{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\}\}/g;

/**
 * Any `{{name}}` in the edited text that this template doesn't actually supply.
 * Saving is refused when this is non-empty: a typo'd variable would otherwise
 * reach a real member's inbox as literal `{{frstName}}`, and nobody would know
 * until they replied to say so.
 */
export function unknownVariables(def: EmailTemplateDef, content: TemplateContent): string[] {
  const known = new Set(allVariables(def).map((v) => v.name));
  const found = new Set<string>();
  for (const text of [content.subject, content.preheader, content.body]) {
    for (const m of text.matchAll(VARIABLE_RE)) {
      if (!known.has(m[1])) found.add(m[1]);
    }
  }
  return [...found];
}

/** Plain-text substitution, for the subject line. */
function substitutePlain(text: string, vars: Record<string, string>): string {
  return text.replace(VARIABLE_RE, (_m, name: string) => vars[name] ?? "");
}

/** Substitution into HTML body text — every value is escaped as it goes in. */
function substituteEscaped(text: string, vars: Record<string, string>): string {
  return escapeHtml(text).replace(VARIABLE_RE, (_m, name: string) => escapeHtml(vars[name] ?? ""));
}

/**
 * Only ever called on a button target. Templates link to the PCC's own pages, so
 * anything that isn't an http(s) URL is a mistake (or a `javascript:` payload
 * pasted in) and falls back to the site root rather than shipping as-is.
 */
function safeUrl(raw: string, vars: Record<string, string>): string {
  const url = substitutePlain(raw, vars).trim();
  return /^https?:\/\//i.test(url) ? url : appUrl();
}

const BUTTON_RE = /^\[([^\]]+)\]\(([^)]+)\)$/;

function renderBlock(def: EmailTemplateDef, block: string, vars: Record<string, string>): string {
  const button = block.match(BUTTON_RE);
  if (button) {
    return ctaButton(safeUrl(button[2], vars), substituteEscaped(button[1], vars));
  }

  const lines = block.split("\n").map((l) => l.trim());
  if (lines.every((l) => l.startsWith("- "))) {
    return lines
      .map((l) => {
        const rest = l.slice(2);
        const colon = rest.indexOf(":");
        // A dash line without a label is still a row, just an unlabelled one.
        if (colon === -1) return paragraph(substituteEscaped(rest, vars));
        return detailRow(
          substituteEscaped(rest.slice(0, colon), vars),
          substitutePlain(rest.slice(colon + 1).trim(), vars)
        );
      })
      .join("\n");
  }

  const soleVariable = block.match(/^\{\{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\}\}$/);
  if (soleVariable) {
    const variable = def.variables.find((v) => v.name === soleVariable[1]);
    if (variable?.kind === "block") return quotedPanel(vars[variable.name] ?? "");
  }

  return paragraph(substituteEscaped(block, vars).replace(/\n/g, "<br />"));
}

/**
 * Turn an edited template plus its values into a ready-to-send email.
 *
 * The sign-off is appended rather than left in the editable body: it's the one
 * piece of the email that should look the same in every message, and an editor
 * who deletes it by accident shouldn't be able to ship an unsigned email.
 */
export function renderTemplate(
  def: EmailTemplateDef,
  content: TemplateContent,
  values: Record<string, string>
): { subject: string; html: string } {
  // `siteUrl` is available to every template without each one declaring it.
  const vars = { siteUrl: appUrl(), ...values };

  const blocks = content.body
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((b) => renderBlock(def, b, vars));

  return {
    subject: substitutePlain(content.subject, vars),
    html: emailShell(`${blocks.join("\n")}\n${signOff()}`, substituteEscaped(content.preheader, vars)),
  };
}
