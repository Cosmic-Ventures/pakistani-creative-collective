/**
 * Pre-launch site gate.
 *
 * The client wants only the application live for now — everyone else gets a
 * password prompt — so the whole site sits behind a shared password until
 * launch. Set `SITE_GATE_PASSWORD` to enable it; **removing that environment
 * variable is how the site goes public**, no code change required.
 *
 * Uses Web Crypto rather than node:crypto so it can run in `proxy.ts` on the
 * edge, where Node built-ins aren't available.
 */

export const GATE_COOKIE = "pcc_gate";

/** The gate is only active while a password is configured. */
export function gateEnabled(): boolean {
  return Boolean(process.env.SITE_GATE_PASSWORD);
}

/**
 * The cookie stores an HMAC of the password, never the password itself — a
 * cookie that simply read "unlocked" could be set by hand, and one holding the
 * password would leak it to anything that can read cookies. Rotating
 * SITE_GATE_PASSWORD invalidates every existing cookie for free.
 */
export async function gateToken(): Promise<string> {
  const password = process.env.SITE_GATE_PASSWORD ?? "";
  const secret = process.env.SESSION_SECRET ?? "pcc-gate-dev-secret";
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(`pcc-gate:${password}`));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Constant-time-ish comparison, so the cookie can't be guessed byte by byte. */
export function tokensMatch(a: string | undefined, b: string): boolean {
  if (!a || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Paths a visitor who has entered the password may reach before launch. The
 * application and everything it depends on — signing in to save progress,
 * the policy pages linked in the footer — plus the gate itself.
 */
const PRELAUNCH_ALLOWED = [
  "/gate",
  // The homepage itself (08/24 round: "make the homepage public/live for
  // those who have the password"). Exact-match only — the `${p}/` prefix
  // check below would otherwise match every path on the site.
  "/",
  "/enroll",
  "/join",
  "/auth",
  "/account",
  "/privacy",
  "/terms",
];

/**
 * Tabs that aren't published yet. Blocking these is a pre-launch curtain, not a
 * security control — it keeps applicants who have the shared password from
 * wandering into half-finished pages. Real authorization (admin panel, paid
 * content) is enforced server-side against the database, unchanged.
 */
export function isPrelaunchAllowed(pathname: string): boolean {
  return PRELAUNCH_ALLOWED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
