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

  it("every email uses the same chrome: white square logo, brand green card, white body text", () => {
    const html = emailShell(paragraph("hello"));
    expect(html).toContain("/brand/logo-square-white.png");
    expect(html).toContain("background-color:#294D3D");
    expect(html).toContain("color:#FFFCF9");
    // The old text wordmark is gone.
    expect(html).not.toContain("PAKISTANI CREATIVE COLLECTIVE<");
    // No black body text left over from the light-card design.
    expect(html).not.toContain("color:#000000");
  });

  // Most mail clients block remote images by default, so the logo often won't
  // load. Its alt text has to be styled to stay legible against the green card
  // rather than falling back to unreadable default black.
  it("styles the logo's alt text for when images are blocked", () => {
    const html = emailShell(paragraph("hello"));
    const img = html.match(/<img[^>]+>/)![0];
    expect(img).toContain('alt="Pakistani Creative Collective"');
    expect(img).toContain("color:#FFFCF9");
  });

  // Without a declared colour scheme, clients in dark mode invert the palette —
  // the dark green card arrived as pale sage with dark text in the client's
  // inbox. These declarations are what stop that, so they must not be dropped.
  it("declares a colour scheme so dark-mode clients don't invert the palette", () => {
    const html = emailShell(paragraph("hello"));
    expect(html).toContain('name="color-scheme" content="light dark"');
    expect(html).toContain('name="supported-color-schemes" content="light dark"');
    expect(html).toContain("@media (prefers-color-scheme: dark)");
    // Outlook.com rewrites colours behind this attribute rather than the media query.
    expect(html).toContain("[data-ogsc]");
  });

  it("re-asserts the card and body colours in the dark-mode block", () => {
    const html = emailShell(paragraph("hello"));
    const dark = html.slice(html.indexOf("@media (prefers-color-scheme: dark)"));
    expect(dark).toContain("background-color: #294D3D !important");
    expect(dark).toContain("color: #FFFCF9 !important");
    expect(dark).toContain("background-color: #91D2A6 !important");
  });
});
