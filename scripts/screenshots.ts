/**
 * Capture laptop-width screenshots of key pages for the handoff PDF.
 * Requires the target (dev server or deployed site) to have seeded demo data.
 * Run: npx tsx scripts/screenshots.ts
 * Run against production: SCREENSHOT_BASE=https://pakistani-creative-collective.vercel.app npx tsx scripts/screenshots.ts
 */
import puppeteer from "puppeteer-core";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = process.env.SCREENSHOT_BASE ?? "http://localhost:3000";
const OUT = "docs/screenshots";
const WIDTH = 1440;
const HEIGHT = 900;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--no-sandbox", "--hide-scrollbars", "--force-device-scale-factor=2"],
    defaultViewport: { width: WIDTH, height: HEIGHT, deviceScaleFactor: 2 },
  });
  const page = await browser.newPage();

  // ── Log in as the paid demo account ──────────────────────────────
  await page.goto(`${BASE}/auth/signin`, { waitUntil: "networkidle2" });
  await page.type('input[name="email"]', "paid@demo.test");
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

  const shots: { name: string; path: string; fullPage?: boolean; wait?: number }[] = [
    { name: "Home", path: "/" },
    { name: "Directory", path: "/directory" },
    { name: "Paid profile", path: "/directory/aneesa-khan", wait: 2500 },
    { name: "Contact form", path: "/directory/aneesa-khan/request" },
  ];

  for (const s of shots) {
    await page.goto(`${BASE}${s.path}`, { waitUntil: "networkidle2" });
    await sleep(s.wait ?? 1200);
    const file = `${OUT}/${s.path === "/" ? "home" : s.path.split("/").filter(Boolean).join("-")}.png`;
    await page.screenshot({ path: file as `${string}.png` });
    console.log(`✓ ${s.name} → ${file}`);
  }

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
