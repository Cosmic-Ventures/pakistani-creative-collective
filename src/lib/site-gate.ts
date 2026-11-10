/**
 * Pre-launch curtain.
 *
 * There is no password any more (11/09 round): the home page and the
 * application are public. Every other tab stays hidden from the public until
 * launch — set `PUBLIC_LAUNCH=true` to open the whole site, no code change.
 */

/** True until the site fully launches. */
export function gateEnabled(): boolean {
  return process.env.PUBLIC_LAUNCH !== "true";
}

/** Open to anyone: the home page, the application, and what it depends on. */
const PUBLIC_PATHS = ["/", "/enroll", "/join", "/auth", "/account", "/privacy", "/terms"];

/**
 * Founding members get temporary premium access to test these before launch
 * (10/22 round), so signed-in users may reach them. Paid/linked-profile rules
 * are still enforced by the pages themselves.
 */
const MEMBER_PATHS = ["/about", "/directory", "/community"];

function matches(list: string[], pathname: string): boolean {
  return list.some((p) => pathname === p || (p !== "/" && pathname.startsWith(`${p}/`)));
}

/**
 * A curtain over unfinished tabs, not a security control — real authorization
 * (admin panel, paid content) is enforced server-side against the database.
 */
export function isPrelaunchAllowed(pathname: string, signedIn: boolean): boolean {
  return matches(PUBLIC_PATHS, pathname) || (signedIn && matches(MEMBER_PATHS, pathname));
}
