/**
 * Validation for a caller-supplied `next` redirect target.
 *
 * `next` comes off the query string of pages anyone can link to (the gate, the
 * sign-in page), so it is attacker-controlled and must never be able to send
 * somebody to another origin.
 *
 * The obvious check — "starts with `/` but not `//`" — is not enough. Browsers
 * and the URL parser both treat a backslash as a forward slash, so `/\evil.com`
 * passes that check and still resolves to `https://evil.com/`. Verified:
 *
 *   new URL("/\\evil.com", "https://pcc.aneesatalks.com").href
 *   // → "https://evil.com/"
 *
 * This also *preserves the query string*, which the previous hand-rolled checks
 * dropped. That mattered: the gate stored only `pathname`, so a password-reset
 * link (`/auth/reset?token=…`) came back through the gate with no token and the
 * user was told their link had expired.
 *
 * Plain module, not "use server" — it's imported by `proxy.ts` on the edge as
 * well as by Server Actions, and an exported async function in an action file
 * would become a callable endpoint (AGENTS.md gotcha #1).
 */

// Any origin works as a resolution base; it is only used to detect escapes.
const RESOLUTION_BASE = "https://pcc.invalid";

export function safeRedirectPath(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;

  const raw = value.trim();
  if (!raw.startsWith("/")) return fallback;

  // Normalise backslashes before the protocol-relative check, so "/\evil.com"
  // and "/\\evil.com" are rejected alongside "//evil.com".
  if (raw.replace(/\\/g, "/").startsWith("//")) return fallback;

  let resolved: URL;
  try {
    resolved = new URL(raw, RESOLUTION_BASE);
  } catch {
    return fallback;
  }
  // Anything that resolved off-origin is refused outright rather than repaired.
  if (resolved.origin !== RESOLUTION_BASE) return fallback;

  return `${resolved.pathname}${resolved.search}${resolved.hash}`;
}
