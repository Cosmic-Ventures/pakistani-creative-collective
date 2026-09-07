import { describe, it, expect } from "vitest";
import { safeRedirectPath } from "@/lib/safe-redirect";

describe("safeRedirectPath", () => {
  it("keeps an ordinary same-origin path", () => {
    expect(safeRedirectPath("/directory", "/fallback")).toBe("/directory");
  });

  // The reset-link bug: the gate stored only the pathname, so the token was
  // gone by the time the user came back and they were told the link expired.
  it("preserves the query string", () => {
    expect(safeRedirectPath("/auth/reset?token=abc123", "/fallback")).toBe("/auth/reset?token=abc123");
    expect(safeRedirectPath("/auth/signin?reset=1&next=%2Faccount", "/fallback")).toBe(
      "/auth/signin?reset=1&next=%2Faccount"
    );
  });

  it("preserves a hash", () => {
    expect(safeRedirectPath("/privacy#cookies", "/fallback")).toBe("/privacy#cookies");
  });

  it("refuses an absolute off-site URL", () => {
    expect(safeRedirectPath("https://evil.example/x", "/fallback")).toBe("/fallback");
    expect(safeRedirectPath("http://evil.example", "/fallback")).toBe("/fallback");
  });

  it("refuses a protocol-relative URL", () => {
    expect(safeRedirectPath("//evil.example", "/fallback")).toBe("/fallback");
  });

  // "/\evil.com" passes a naive `startsWith("/") && !startsWith("//")` check,
  // but browsers and the URL parser read the backslash as a slash, so it
  // resolves to https://evil.com/ — an open redirect.
  it("refuses a backslash-smuggled off-site URL", () => {
    expect(safeRedirectPath("/\\evil.example", "/fallback")).toBe("/fallback");
    expect(safeRedirectPath("/\\\\evil.example", "/fallback")).toBe("/fallback");
    expect(safeRedirectPath("\\\\evil.example", "/fallback")).toBe("/fallback");
  });

  it("refuses a scheme-bearing or relative value", () => {
    expect(safeRedirectPath("javascript:alert(1)", "/fallback")).toBe("/fallback");
    expect(safeRedirectPath("directory", "/fallback")).toBe("/fallback");
    expect(safeRedirectPath("", "/fallback")).toBe("/fallback");
  });

  it("refuses non-string input", () => {
    expect(safeRedirectPath(null, "/fallback")).toBe("/fallback");
    expect(safeRedirectPath(undefined, "/fallback")).toBe("/fallback");
    expect(safeRedirectPath(42, "/fallback")).toBe("/fallback");
  });

  it("does not let a traversal escape the origin", () => {
    // Resolves within the origin; the point is it never becomes another host.
    expect(safeRedirectPath("/../../etc/passwd", "/fallback").startsWith("/")).toBe(true);
  });
});
