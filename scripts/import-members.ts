/**
 * Imports Aneesa's member spreadsheet into the Creative table.
 *
 * Reads either a local CSV export or a Google Sheet, maps columns by *header
 * name* rather than position (the sheet's column order has changed between
 * versions, and a positional mapping silently writes surnames into bios), and
 * reports exactly what it would do before touching anything.
 *
 * Dry run by default — it will not write to the database unless you pass
 * --apply. Re-running is safe: rows are matched on email and updated in place.
 *
 *   # See what would happen (no writes):
 *   npx tsx scripts/import-members.ts --csv ~/Downloads/members.csv
 *
 *   # From the Google Sheet (needs GOOGLE_SHEETS_API_KEY or
 *   # GOOGLE_SERVICE_ACCOUNT_JSON in .env):
 *   npx tsx scripts/import-members.ts --sheet <spreadsheetId> --range 'Sheet1!A:Z'
 *
 *   # Actually write, and publish the rows immediately rather than queueing
 *   # them for review:
 *   npx tsx scripts/import-members.ts --csv members.csv --apply --status APPROVED
 *
 * Dev-only: excluded from the app build via tsconfig.build.json.
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { PrismaClient, type CreativeStatus } from "@prisma/client";

const db = new PrismaClient();

// ─── Column mapping ───────────────────────────────────────────────────────────
// Header text is normalised (lowercased, non-alphanumerics stripped) before
// lookup, so "First Name", "first_name" and "FIRSTNAME" all match. Add aliases
// here rather than renaming columns in the client's sheet.
const HEADER_ALIASES: Record<string, string[]> = {
  firstName: ["firstname", "first", "givenname"],
  lastName: ["lastname", "last", "surname", "familyname"],
  email: ["email", "emailaddress", "e-mail"],
  bio: ["bio", "professionalbio", "biography", "about"],
  pronouns: ["pronouns"],
  location: ["location", "publiclocation", "citystate", "city"],
  phone: ["phone", "phonenumber", "mobile"],
  address: ["address", "fulladdress", "mailingaddress"],
  roles: ["roles", "role", "profession", "professions", "professionalroles"],
  mediums: ["mediums", "medium", "mediatype", "mediatypes"],
  experienceLevel: ["experiencelevel", "level", "tier"],
  languages: ["languages", "languagesspoken"],
  website: ["website", "portfolio", "websiteportfolio", "portfoliourl"],
  imdb: ["imdb", "imdblink"],
  instagram: ["instagram", "ig", "instagramhandle"],
  linkedin: ["linkedin"],
  vimeo: ["vimeo", "youtube", "vimeoyoutube"],
  notableAchievements: ["notableachievements", "achievements", "credits"],
  education: ["education", "training", "educationtraining"],
  availability: ["availability", "currentavailability"],
  travel: ["travel", "willingnesstotravel"],
  unionMemberships: ["unionmemberships", "union", "guild", "unionguild"],
  previousCollaborators: ["previouscollaborators", "collaborators"],
  rateStructure: ["ratestructure"],
  rateRange: ["raterange", "standardraterange", "rate"],
  pccGoals: ["pccgoals", "lookingfor", "whatareyoulookingfor"],
  referralName: ["referralname", "referredby", "referral"],
  adminNotes: ["notes", "adminnotes", "internalnotes"],
};

const MULTI_VALUE = new Set(["roles", "mediums", "languages"]);
const REQUIRED = ["firstName", "lastName", "email", "bio"] as const;

function normaliseHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** header index → Creative field name */
function buildColumnMap(headers: string[]): Map<number, string> {
  const lookup = new Map<string, string>();
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    for (const a of aliases) lookup.set(a, field);
  }
  const map = new Map<number, string>();
  headers.forEach((h, i) => {
    const field = lookup.get(normaliseHeader(h));
    if (field && ![...map.values()].includes(field)) map.set(i, field);
  });
  return map;
}

// ─── CSV parsing ──────────────────────────────────────────────────────────────
// Hand-rolled rather than a dependency: sheet exports are well-formed CSV, but
// bios routinely contain commas, quotes and newlines, so quoted fields and
// escaped quotes have to be handled properly.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
      continue;
    }
    if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim()));
}

async function readSheet(spreadsheetId: string, range: string): Promise<string[][]> {
  const { google } = await import("googleapis");
  let auth;
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });
  } else if (process.env.GOOGLE_SHEETS_API_KEY) {
    auth = process.env.GOOGLE_SHEETS_API_KEY;
  } else {
    throw new Error(
      "Set GOOGLE_SHEETS_API_KEY or GOOGLE_SERVICE_ACCOUNT_JSON, or export the sheet and use --csv."
    );
  }
  const sheets = google.sheets({ version: "v4", auth: auth as never });
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  return (res.data.values ?? []) as string[][];
}

// ─── Row → Creative ───────────────────────────────────────────────────────────
function toSlug(first: string, last: string): string {
  return `${first}-${last}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "creative";
}

type Parsed = { data: Record<string, unknown>; email: string; problems: string[] };

function rowToCreative(row: string[], columns: Map<number, string>): Parsed {
  const values: Record<string, string> = {};
  columns.forEach((field, i) => {
    const v = (row[i] ?? "").trim();
    if (v) values[field] = v;
  });

  const problems: string[] = [];
  for (const field of REQUIRED) {
    if (!values[field]) problems.push(`missing ${field}`);
  }
  if (values.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.email)) {
    problems.push(`invalid email "${values.email}"`);
  }

  const data: Record<string, unknown> = {};
  for (const [field, v] of Object.entries(values)) {
    data[field] = MULTI_VALUE.has(field)
      ? v.split(/[,;|]/).map((s) => s.trim()).filter(Boolean)
      : v;
  }
  // Array columns are non-nullable in the schema, so absent ones need an empty
  // array rather than undefined.
  for (const f of MULTI_VALUE) if (!data[f]) data[f] = [];

  return { data, email: (values.email ?? "").toLowerCase(), problems };
}

async function uniqueSlug(base: string, takenInThisRun: Set<string>): Promise<string> {
  let candidate = base;
  let n = 2;
  while (takenInThisRun.has(candidate) || (await db.creative.findUnique({ where: { slug: candidate } }))) {
    candidate = `${base}-${n++}`;
  }
  takenInThisRun.add(candidate);
  return candidate;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const argv = process.argv.slice(2);
  const arg = (name: string) => {
    const i = argv.indexOf(name);
    return i === -1 ? undefined : argv[i + 1];
  };
  const apply = argv.includes("--apply");
  const csvPath = arg("--csv");
  const sheetId = arg("--sheet");
  const range = arg("--range") ?? "Sheet1!A:Z";
  const status = (arg("--status") ?? "PENDING").toUpperCase() as CreativeStatus;

  if (!csvPath && !sheetId) {
    console.error("Provide --csv <path> or --sheet <spreadsheetId>. See the header of this file.");
    process.exitCode = 1;
    return;
  }
  if (!["PENDING", "APPROVED"].includes(status)) {
    console.error(`--status must be PENDING or APPROVED (got ${status}).`);
    process.exitCode = 1;
    return;
  }

  const rows = csvPath
    ? parseCsv(readFileSync(csvPath, "utf8"))
    : await readSheet(sheetId!, range);

  if (rows.length < 2) {
    console.error("Sheet has no data rows (expected a header row plus at least one member).");
    process.exitCode = 1;
    return;
  }

  const [headers, ...dataRows] = rows;
  const columns = buildColumnMap(headers);

  const mapped = [...columns.entries()].map(([i, f]) => `${headers[i]} → ${f}`);
  const ignored = headers.filter((_, i) => !columns.has(i)).filter(Boolean);
  const missingRequired = REQUIRED.filter((f) => ![...columns.values()].includes(f));

  console.log(`Source: ${csvPath ?? `sheet ${sheetId} (${range})`}`);
  console.log(`Rows: ${dataRows.length}\n`);
  console.log("Column mapping:");
  mapped.forEach((m) => console.log(`  ${m}`));
  if (ignored.length) console.log(`\nIgnored columns: ${ignored.join(", ")}`);
  if (missingRequired.length) {
    console.log(
      `\n⚠  No column maps to: ${missingRequired.join(", ")}. Every row will be skipped.\n` +
        `   Add the column to the sheet, or add an alias to HEADER_ALIASES in this script.`
    );
  }

  const taken = new Set<string>();
  const toCreate: { slug: string; email: string; name: string }[] = [];
  const toUpdate: { slug: string; email: string; name: string }[] = [];
  const skipped: { row: number; why: string }[] = [];

  for (const [i, row] of dataRows.entries()) {
    const { data, email, problems } = rowToCreative(row, columns);
    if (problems.length) {
      skipped.push({ row: i + 2, why: problems.join(", ") });
      continue;
    }

    const existing = await db.creative.findFirst({ where: { email } });
    const name = `${data.firstName} ${data.lastName}`;

    if (existing) {
      toUpdate.push({ slug: existing.slug, email, name });
      if (apply) {
        await db.creative.update({ where: { id: existing.id }, data });
      }
    } else {
      const slug = await uniqueSlug(toSlug(String(data.firstName), String(data.lastName)), taken);
      toCreate.push({ slug, email, name });
      if (apply) {
        await db.creative.create({ data: { ...data, slug, email, status } as never });
      }
    }
  }

  console.log(`\n${apply ? "Applied" : "Dry run — nothing written"}:`);
  console.log(`  create ${toCreate.length}  ·  update ${toUpdate.length}  ·  skip ${skipped.length}`);
  if (toCreate.length) {
    console.log(`\n  New (status ${status}):`);
    toCreate.forEach((c) => console.log(`    + ${c.name} <${c.email}> → /directory/${c.slug}`));
  }
  if (toUpdate.length) {
    console.log("\n  Existing, matched on email:");
    toUpdate.forEach((c) => console.log(`    ~ ${c.name} <${c.email}> → /directory/${c.slug}`));
  }
  if (skipped.length) {
    console.log("\n  Skipped:");
    skipped.forEach((s) => console.log(`    - row ${s.row}: ${s.why}`));
  }
  if (!apply) console.log("\nRe-run with --apply to write these changes.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
