import { describe, it, expect } from "vitest";
import { normalizePostLink } from "@/lib/community-constants";

// `link` reaches the database through two Server Actions (createPost, editPost),
// which are ordinary POST endpoints — the composer's `type="url"` constrains
// only somebody using the actual form. Both the member feed and the admin
// moderation list render the stored value straight into an `href`, so the
// scheme has to be settled here.
describe("normalizePostLink", () => {
  it("keeps an ordinary https URL", () => {
    expect(normalizePostLink("https://example.com/reel")).toBe("https://example.com/reel");
  });

  it("keeps plain http", () => {
    expect(normalizePostLink("http://example.com/")).toBe("http://example.com/");
  });

  it("adds a scheme to a schemeless host", () => {
    expect(normalizePostLink("www.example.com/reel")).toBe("https://www.example.com/reel");
  });

  it("treats blank and missing values as no link", () => {
    expect(normalizePostLink("   ")).toBeNull();
    expect(normalizePostLink(null)).toBeNull();
    expect(normalizePostLink(undefined)).toBeNull();
  });

  it("rejects a javascript: URL rather than storing it for an href", () => {
    expect(normalizePostLink("javascript:alert(document.cookie)")).toBeNull();
    expect(normalizePostLink("  JavaScript:alert(1)  ")).toBeNull();
  });

  it("rejects data: and file: URLs", () => {
    expect(normalizePostLink("data:text/html,<script>alert(1)</script>")).toBeNull();
    expect(normalizePostLink("file:///etc/passwd")).toBeNull();
  });

  it("trims surrounding whitespace", () => {
    expect(normalizePostLink("  https://example.com/a  ")).toBe("https://example.com/a");
  });
});
