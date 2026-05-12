import { google } from "googleapis";

export type Member = {
  id: string;
  slug: string;
  firstName: string;
  lastName: string;
  name: string;
  pronouns: string;
  profession: string;
  mediaType: string;
  location: string;
  imdb: string;
  instagram: string;
  linkedin: string;
  notes: string;
};

const SPREADSHEET_ID = "1Q41ip2n-nkoiDFKlApiZhgFLD-cFxRHlTCN7Z_t2lIY";
const RANGE = "Sheet1!A2:L";

function toSlug(firstName: string, lastName: string, index: number): string {
  const base = `${firstName}-${lastName}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return base || `member-${index}`;
}

function rowToMember(row: string[], index: number): Member {
  const [
    firstName = "",
    lastName = "",
    pronouns = "",
    profession = "",
    mediaType = "",
    location = "",
    imdb = "",
    instagram = "",
    linkedin = "",
    ,
    ,
    notes = "",
  ] = row;

  return {
    id: String(index),
    slug: toSlug(firstName, lastName, index),
    firstName,
    lastName,
    name: `${firstName} ${lastName}`.trim(),
    pronouns,
    profession,
    mediaType,
    location,
    imdb,
    instagram,
    linkedin,
    notes,
  };
}

async function getSheets() {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });
    return google.sheets({ version: "v4", auth });
  }

  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Set GOOGLE_SHEETS_API_KEY or GOOGLE_SERVICE_ACCOUNT_JSON in .env.local"
    );
  }
  return google.sheets({ version: "v4", auth: apiKey });
}

export async function getMembers(): Promise<Member[]> {
  let sheets;
  try {
    sheets = await getSheets();
  } catch {
    console.warn("[PCC] Google Sheets credentials not configured — returning empty member list.");
    return [];
  }

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: RANGE,
  });

  const rows = response.data.values ?? [];
  return rows
    .filter((row) => row[0] || row[1])
    .map((row, i) => rowToMember(row as string[], i));
}

export async function getMemberBySlug(slug: string): Promise<Member | null> {
  const members = await getMembers();
  return members.find((m) => m.slug === slug) ?? null;
}
