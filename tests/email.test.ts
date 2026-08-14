import { describe, it, expect } from "vitest";

import {
  emailShell,
  greeting,
  detailRow,
  quotedBlock,
  linkRow,
  paragraph,
} from "@/lib/email";

const XSS = `<img src=x onerror="alert(1)">`;

describe("email builders", () => {
  // Applicant- and member-supplied text (bios, contact-request messages, post
  // titles, names) is interpolated straight into these HTML emails, so the
  // builders that receive it have to escape it themselves — a call site can't
  // be relied on to remember.
  it.each([
    ["greeting", () => greeting(XSS)],
    ["detailRow", () => detailRow("Member", XSS)],
    ["quotedBlock", () => quotedBlock("Bio", XSS)],
  ])("%s escapes user-supplied markup", (_name, build) => {
    const html = build();
    expect(html).toContain("&lt;img");
    // The angle brackets of the payload must never survive intact.
    expect(html).not.toContain("<img");
  });

  it("quotedBlock keeps line breaks as <br />", () => {
    expect(quotedBlock("Bio", "one\ntwo")).toContain("one<br />two");
  });

  it("linkRow can't emit a javascript: href", () => {
    const html = linkRow("Portfolio", "javascript:alert(1)");
    expect(html).not.toContain('href="javascript:');
  });

  it("linkRow leaves an absolute url alone but prefixes a bare domain", () => {
    expect(linkRow("Portfolio", "https://sarakhan.com")).toContain('href="https://sarakhan.com"');
    expect(linkRow("Portfolio", "sarakhan.com")).toContain('href="https://sarakhan.com"');
  });

  // paragraph() intentionally takes composed HTML (it carries entities like
  // &rsquo;), so it must NOT escape — call sites escape before passing.
  it("paragraph passes composed html through untouched", () => {
    expect(paragraph("we&rsquo;re <strong>on</strong>")).toContain("we&rsquo;re <strong>on</strong>");
  });

  it("every email uses the same chrome: white square logo on brand green, black body text", () => {
    const html = emailShell(paragraph("hello"));
    expect(html).toContain("/brand/logo-square-white.png");
    expect(html).toContain("background-color:#294D3D");
    expect(html).toContain("color:#000000");
    // The old text wordmark is gone.
    expect(html).not.toContain("PAKISTANI CREATIVE COLLECTIVE<");
  });
});
