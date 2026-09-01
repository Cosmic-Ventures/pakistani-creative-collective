/**
 * The pure HTML builders every PCC email is assembled from.
 *
 * Split out of `email.ts` deliberately: this module imports nothing but itself,
 * so it can run in the browser as well as on the server. That's what lets the
 * admin email-template editor render a live preview of what an email will look
 * like — `email.ts` pulls in Resend and Stripe and can never be bundled for the
 * client.
 *
 * Inline styles throughout, because most mail clients (Gmail included) strip
 * <style> blocks, and table-based layout because that's still the only thing
 * that renders consistently across them.
 */

const BRAND_GREEN = "#294D3D";
const BRAND_CREAM = "#FFFCF9";
const BRAND_MINT = "#C1F8D3";
// Emails are dark-green-on-white throughout, per the client: the card, not just
// the header band, sits on brand green with white copy.
const BODY_TEXT = BRAND_CREAM;
// Slightly deeper than the card so the card still reads as a card.
const PAGE_BG = "#1E3A2E";
const PANEL_BG = "rgba(255,255,255,0.08)";
const BODY_FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const HEADING_FONT = "Georgia, 'Times New Roman', serif";

export function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://pcc.aneesatalks.com";
}

// Every email is sent through this — inline styles throughout because most
// mail clients (Gmail included) strip <style> blocks, and table-based layout
// because that's still the only thing that renders consistently across them.
// Exported so the chrome (header/footer) can be rendered for design review
// without sending mail; see scripts/email-preview.ts.
export function emailShell(bodyHtml: string, preheader = ""): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Pakistani Creative Collective</title>
<!--
  Without a declared colour scheme, mail clients in dark mode apply their own
  inversion: our dark green card came out pale sage with dark text in the
  client's inbox, the exact opposite of what's authored here. Declaring both
  schemes tells the client we've handled dark mode ourselves and to leave the
  palette alone (respected by Apple Mail and Outlook; Gmail honours it in part).
-->
<meta name="color-scheme" content="light dark" />
<meta name="supported-color-schemes" content="light dark" />
<style>
  :root { color-scheme: light dark; supported-color-schemes: light dark; }
  /* Re-assert the palette for clients that do run their own dark-mode pass,
     rather than letting them guess. [data-ogsc]/[data-ogsb] are the attributes
     Outlook.com injects when it rewrites colours. */
  @media (prefers-color-scheme: dark) {
    .pcc-page { background-color: ${PAGE_BG} !important; }
    .pcc-card { background-color: ${BRAND_GREEN} !important; }
    .pcc-body, .pcc-body p, .pcc-body div, .pcc-body span, .pcc-body td { color: ${BRAND_CREAM} !important; }
    .pcc-accent { color: ${BRAND_MINT} !important; }
    .pcc-muted, .pcc-muted a { color: rgba(255,252,249,0.6) !important; }
    .pcc-btn { background-color: ${BRAND_CREAM} !important; }
    .pcc-btn a { color: ${BRAND_GREEN} !important; }
    .pcc-panel { background-color: ${PANEL_BG} !important; }
  }
  [data-ogsc] .pcc-page { background-color: ${PAGE_BG} !important; }
  [data-ogsc] .pcc-card { background-color: ${BRAND_GREEN} !important; }
  [data-ogsc] .pcc-body, [data-ogsc] .pcc-body p, [data-ogsc] .pcc-body span { color: ${BRAND_CREAM} !important; }
  [data-ogsc] .pcc-accent { color: ${BRAND_MINT} !important; }
  [data-ogsc] .pcc-btn { background-color: ${BRAND_CREAM} !important; }
  [data-ogsc] .pcc-btn a { color: ${BRAND_GREEN} !important; }
</style>
</head>
<body class="pcc-page" style="margin:0; padding:0; background-color:${PAGE_BG};">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="pcc-page" style="background-color:${PAGE_BG};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="pcc-card" style="max-width:560px; background-color:${BRAND_GREEN}; border-radius:16px; overflow:hidden; border:1px solid rgba(255,252,249,0.14);">
          <tr>
            <td align="center" class="pcc-card" style="background-color:${BRAND_GREEN}; padding:32px 32px 12px;">
              <a href="${appUrl()}" style="text-decoration:none;">
                <img src="${appUrl()}/brand/logo-square-white.png"
                     width="132" height="132" alt="Pakistani Creative Collective"
                     style="display:block; width:132px; height:132px; border:0; outline:none; text-decoration:none; font-family:${HEADING_FONT}; font-size:16px; font-weight:700; color:${BRAND_CREAM};" />
              </a>
            </td>
          </tr>
          <tr>
            <td class="pcc-card pcc-body" style="background-color:${BRAND_GREEN}; padding:8px 32px 32px; font-family:${BODY_FONT}; font-size:15px; line-height:1.65; color:${BODY_TEXT};">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td class="pcc-card" style="background-color:${BRAND_GREEN}; padding:20px 32px; border-top:1px solid rgba(255,252,249,0.15);">
              <p class="pcc-muted" style="margin:0; font-family:${BODY_FONT}; font-size:12px; color:rgba(255,252,249,0.6);">
                Pakistani Creative Collective &middot; Curated by
                <a href="https://aneesatalks.com" style="color:rgba(255,252,249,0.6);">Aneesa Talks</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function greeting(firstName: string): string {
  return `<p style="margin:0 0 16px;">Hi ${escapeHtml(firstName)},</p>`;
}

export function paragraph(html: string): string {
  return `<p style="margin:0 0 16px;">${html}</p>`;
}

export function signOff(): string {
  return `<p style="margin:24px 0 0; color:rgba(255,252,249,0.75);">&mdash; Aneesa Talks</p>`;
}

// Cream fill / green text. Mint was too close in value to the green card behind
// it and the button faded into the background; white reads as a button at a
// glance. Labels and accents stay mint — they're text, not targets.
export function ctaButton(href: string, label: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;">
      <tr>
        <td class="pcc-btn" style="background-color:${BRAND_CREAM}; border-radius:999px;">
          <a href="${href}" style="display:inline-block; padding:12px 24px; font-family:${BODY_FONT}; font-size:14px; font-weight:700; color:${BRAND_GREEN}; text-decoration:none;">${label}</a>
        </td>
      </tr>
    </table>`;
}

// Escapes its own value, so call sites can pass member-supplied text directly
// and can't forget. `paragraph()` deliberately does NOT escape — it takes
// composed HTML — so anything user-supplied going in there must be escaped first.
export function detailRow(label: string, value: string): string {
  return `<p style="margin:0 0 8px;"><strong class="pcc-accent" style="color:${BRAND_MINT};">${label}:</strong> ${escapeHtml(value)}</p>`;
}

// Applicant-supplied text goes into these emails, so it has to be escaped
// before interpolation — an unescaped bio or message could otherwise break the
// layout or smuggle markup into the admin's inbox.
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function escapeMultiline(value: string): string {
  return escapeHtml(value).replace(/\r?\n/g, "<br />");
}

// Long-form applicant text (a bio) set apart from the one-line detail rows.
export function quotedBlock(label: string, value: string): string {
  return `
    <p style="margin:16px 0 6px;"><strong class="pcc-accent" style="color:${BRAND_MINT};">${label}:</strong></p>
    ${quotedPanel(value)}`;
}

/** The panel on its own, for templates that introduce it in their own prose. */
export function quotedPanel(value: string): string {
  return `
    <div class="pcc-panel" style="background-color:${PANEL_BG}; border-radius:12px; padding:14px 18px; margin:0 0 16px; color:${BRAND_CREAM};">
      ${escapeMultiline(value)}
    </div>`;
}

export function linkRow(label: string, href: string): string {
  const safe = escapeHtml(href);
  const url = /^https?:\/\//i.test(href) ? safe : `https://${safe}`;
  return `<p style="margin:0 0 8px;"><strong class="pcc-accent" style="color:${BRAND_MINT};">${label}:</strong> <a href="${url}" style="color:${BRAND_CREAM};">${safe}</a></p>`;
}

// Compact shell for internal admin notifications — same brand chrome, but the
// body skips the greeting/sign-off framing since these are operational, not
// member-facing.
export function adminEmailShell(title: string, bodyHtml: string): string {
  return emailShell(`
    <p style="margin:0 0 16px; font-family:${HEADING_FONT}; font-size:18px; font-weight:700; color:${BRAND_CREAM};">${title}</p>
    ${bodyHtml}
  `);
}
