/**
 * Render docs/HANDOFF.md to docs/PCC-Handoff-Final.pdf.
 * Markdown → styled HTML (marked) → PDF via headless Chrome (puppeteer-core),
 * with the screenshot images embedded at print resolution.
 * Run: npx tsx scripts/handoff-pdf.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { marked } from "marked";
import puppeteer from "puppeteer-core";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const MD = resolve("docs/HANDOFF.md");
const HTML_OUT = resolve("docs/HANDOFF.html");
const PDF_OUT = resolve("docs/PCC-Handoff-Final.pdf");

const md = readFileSync(MD, "utf8");
const body = marked.parse(md, { async: false }) as string;

// Brand-adjacent print styling: green headings, readable serif-free body,
// each page-tour screenshot kept with its heading where possible.
const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>PCC — Final Build Handoff</title>
<style>
  :root {
    --green: #294D3D;
    --brown: #2A1511;
  }
  * { box-sizing: border-box; }
  body {
    font-family: "DM Sans", -apple-system, "Segoe UI", Helvetica, Arial, sans-serif;
    color: var(--brown);
    font-size: 11.5px;
    line-height: 1.55;
    margin: 0;
  }
  h1, h2, h3 {
    color: var(--green);
    font-weight: 800;
    line-height: 1.25;
    page-break-after: avoid;
  }
  h1 { font-size: 24px; margin: 0 0 12px; }
  h2 { font-size: 17px; margin: 26px 0 8px; border-bottom: 2px solid var(--green); padding-bottom: 4px; }
  h3 { font-size: 13.5px; margin: 18px 0 6px; }
  p { margin: 6px 0; }
  ul, ol { margin: 6px 0; padding-left: 22px; }
  li { margin: 3px 0; }
  hr { border: none; border-top: 1px solid #d8d2cb; margin: 20px 0; }
  code { background: #f2efe9; padding: 1px 4px; border-radius: 3px; font-size: 10.5px; }
  table { border-collapse: collapse; width: 100%; margin: 8px 0; }
  th, td { border: 1px solid #d8d2cb; padding: 5px 8px; text-align: left; vertical-align: top; }
  th { background: #eef3ef; color: var(--green); }
  img {
    display: block;
    width: 100%;
    height: 480px;
    object-fit: cover;
    object-position: top center;
    border: 1px solid #d8d2cb;
    border-radius: 6px;
    margin: 8px 0 4px;
    page-break-inside: avoid;
  }
  a { color: var(--green); }
</style>
</head>
<body>${body}</body>
</html>`;

writeFileSync(HTML_OUT, html);

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  await page.goto(pathToFileURL(HTML_OUT).href, { waitUntil: "networkidle0" });
  await page.pdf({
    path: PDF_OUT,
    format: "letter",
    printBackground: true,
    margin: { top: "0.6in", bottom: "0.6in", left: "0.65in", right: "0.65in" },
  });
  await browser.close();
  console.log(`✓ ${PDF_OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
