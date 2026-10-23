/**
 * The admin picks send times in US Eastern (where the client is); servers run in
 * UTC. These two convert between a `datetime-local` string ("2026-10-25T09:00")
 * read as Eastern and the real instant, DST included.
 */
const TZ = "America/New_York";

function offsetMinutes(at: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ, hour12: false, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(at);
  const g = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  const asUtc = Date.UTC(g("year"), g("month") - 1, g("day"), g("hour") % 24, g("minute"), g("second"));
  return Math.round((asUtc - at.getTime()) / 60000);
}

/** "2026-10-25T09:00" (Eastern wall-clock) → the real Date, or null if unparseable. */
export function easternToDate(local: string): Date | null {
  const m = local.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!m) return null;
  const guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  const first = guess - offsetMinutes(new Date(guess)) * 60000;
  const fixed = guess - offsetMinutes(new Date(first)) * 60000;
  return new Date(fixed);
}

/** A Date → "2026-10-25T09:00" in Eastern, for a datetime-local input. */
export function dateToEastern(d: Date): string {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, hour12: false, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  }).formatToParts(d);
  const g = (t: string) => p.find((x) => x.type === t)!.value;
  return `${g("year")}-${g("month")}-${g("day")}T${g("hour") === "24" ? "00" : g("hour")}:${g("minute")}`;
}

export function formatEastern(d: Date): string {
  return d.toLocaleString("en-US", { timeZone: TZ, dateStyle: "medium", timeStyle: "short" }) + " ET";
}
