/**
 * Pre-launch curtain.
 *
 * There is no password any more (11/09 round): the home page and the
 * application are public. 11/12: the founding-member bypass that let any
 * signed-in user reach /about, /directory and /community (10/22 round) is
 * gone — no non-admin, signed in or not, should see anything but the home
 * page and the application flow until launch. Set `PUBLIC_LAUNCH=true` to
 * open the whole site, no code change.
 */

/** True until the site fully launches. */
export function gateEnabled(): boolean {
  return process.env.PUBLIC_LAUNCH !== "true";
}

/**
 * Open to anyone, admin or not: the home page and the application flow.
 * `/auth` and `/join` are here because /enroll requires a signed-in session
 * (it redirects to /auth/signin itself) — without them nobody could ever
 * reach the form. `/account` is deliberately NOT here: it's the full member
 * dashboard (subscribe, bookmarks, profile, support), not "the application."
 */
const PUBLIC_PATHS = ["/", "/enroll", "/join", "/auth", "/privacy", "/terms"];

function matches(list: string[], pathname: string): boolean {
  return list.some((p) => pathname === p || (p !== "/" && pathname.startsWith(`${p}/`)));
}

/**
 * A curtain over unfinished tabs, not a security control — real authorization
 * (admin panel, paid content) is enforced server-side against the database.
 */
export function isPrelaunchAllowed(pathname: string): boolean {
  return matches(PUBLIC_PATHS, pathname);
}
