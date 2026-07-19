/**
 * Capture laptop-width screenshots of key pages for the handoff doc.
 * Requires the target (dev server or deployed site) to have seeded demo data.
 * Run: npx tsx scripts/screenshots.ts
 * Run against production: SCREENSHOT_BASE=https://pakistani-creative-collective.vercel.app npx tsx scripts/screenshots.ts
 */
import puppeteer, { type Page } from "puppeteer-core";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = process.env.SCREENSHOT_BASE ?? "http://localhost:3000";
const OUT = "docs/screenshots";
const WIDTH = 1440;
const HEIGHT = 900;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function login(page: Page, email: string) {
  await page.goto(`${BASE}/auth/signin`, { waitUntil: "networkidle2" });
  await page.type('input[name="email"]', email);
  await page.type('input[name="password"]', "password123");
  await Promise.all([
    page.evaluate(() => {
      const f = [...document.querySelectorAll("form")].find(
        (x) => x.querySelector('[name="email"]') && x.querySelector('[name="password"]')
      ) as HTMLFormElement;
      f.requestSubmit();
    }),
    page.waitForNavigation({ waitUntil: "networkidle2" }).catch(() => {}),
  ]);
  await sleep(1500);
}

async function shoot(page: Page, name: string, path: string, opts: { fullPage?: boolean; wait?: number } = {}) {
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle2" });
  await sleep(opts.wait ?? 1200);
  // Strip the Next.js dev-tools indicator when shooting against `next dev`
  await page.evaluate(() => document.querySelector("nextjs-portal")?.remove());
  const file = `${OUT}/${name}.png`;
  await page.screenshot({ path: file as `${string}.png`, fullPage: opts.fullPage ?? false });
  console.log(`✓ ${name} → ${file}`);
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--no-sandbox", "--hide-scrollbars", "--force-device-scale-factor=2"],
    defaultViewport: { width: WIDTH, height: HEIGHT, deviceScaleFactor: 2 },
  });
  const page = await browser.newPage();

  // ── Unauthenticated / free views ─────────────────────────────────
  await shoot(page, "home", "/", { fullPage: true });
  await shoot(page, "directory-free", "/directory");
  await shoot(page, "profile-free", "/directory/aneesa-khan", { fullPage: true, wait: 2000 });
  await shoot(page, "enroll-form", "/enroll", { fullPage: true });
  await shoot(page, "hire-talent", "/request");

  // ── Free (signed-in) views ────────────────────────────────────────
  const client = await page.createCDPSession();
  await login(page, "free@demo.test");
  await shoot(page, "subscribe", "/subscribe", { fullPage: true });

  // ── Paid member views ─────────────────────────────────────────────
  await client.send("Network.clearBrowserCookies");
  await login(page, "paid@demo.test");
  await shoot(page, "directory-paid", "/directory");
  await shoot(page, "profile-paid", "/directory/aneesa-khan", { fullPage: true, wait: 2000 });
  await shoot(page, "contact-form", "/directory/aneesa-khan/request");
  await shoot(page, "community-dashboard", "/community", { fullPage: true, wait: 1800 });
  await shoot(page, "account", "/account");

  // ── Admin views ────────────────────────────────────────────────────
  await client.send("Network.clearBrowserCookies");
  await login(page, "admin@demo.test");
  await shoot(page, "admin-overview", "/admin");
  await shoot(page, "admin-applications", "/admin/applications", { fullPage: true });
  await shoot(page, "admin-contact-requests", "/admin/contact-requests", { fullPage: true });
  await shoot(page, "admin-community", "/admin/community", { fullPage: true });
  await shoot(page, "admin-analytics", "/admin/analytics", { fullPage: true, wait: 1800 });

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
