/**
 * Renders the transactional email templates to a single HTML page so their
 * design can be reviewed (and shown to the client) without sending real mail.
 *
 * Dev-only: excluded from the app build via tsconfig.build.json.
 *
 *   npx tsx scripts/email-preview.ts && open docs/email-preview.html
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { samples } from "./email-samples";

const page = `<!doctype html>
<meta charset="utf-8" />
<title>PCC email templates</title>
<style>
  body { margin:0; background:#e9e6e0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif; }
  .wrap { max-width: 700px; margin: 0 auto; padding: 32px 16px 64px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .note { color:#555; font-size:13px; margin:0 0 32px; }
  .card { margin: 0 0 40px; }
  .label { font-size: 13px; font-weight: 600; margin: 0 0 2px; }
  .subject { font-size: 12px; color:#555; margin: 0 0 8px; }
  iframe { width:100%; height:640px; border:1px solid rgba(0,0,0,.15); border-radius:8px; background:#fff; }
</style>
<div class="wrap">
  <h1>PCC transactional emails</h1>
  <p class="note">Every email shares one shell: white square logo, brand-green card, white body text, mint labels and buttons.</p>
  ${samples
    .map(
      (s) => `<div class="card">
    <p class="label">${s.name}</p>
    <p class="subject">Subject: ${s.subject}</p>
    <iframe srcdoc="${s.html.replace(/"/g, "&quot;")}"></iframe>
  </div>`
    )
    .join("\n")}
</div>`;

mkdirSync("docs", { recursive: true });
writeFileSync("docs/email-preview.html", page);
console.log(`Wrote docs/email-preview.html (${samples.length} templates)`);
