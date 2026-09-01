import { describe, it, expect } from "vitest";

import {
  EMAIL_TEMPLATES,
  defaultContent,
  getTemplateDef,
  renderTemplate,
  sampleValues,
  unknownVariables,
} from "@/lib/email-templates";

function render(key: string, values: Record<string, string> = {}) {
  const def = getTemplateDef(key)!;
  return renderTemplate(def, defaultContent(def), { ...sampleValues(def), ...values });
}

describe("email template registry", () => {
  it("every shipped default renders without leaving an unfilled variable", () => {
    for (const def of EMAIL_TEMPLATES) {
      const { subject, html } = renderTemplate(def, defaultContent(def), sampleValues(def));
      expect(subject, def.key).not.toMatch(/\{\{/);
      expect(html, def.key).not.toMatch(/\{\{/);
    }
  });

  it("every shipped default only uses variables it declares", () => {
    for (const def of EMAIL_TEMPLATES) {
      expect(unknownVariables(def, defaultContent(def)), def.key).toEqual([]);
    }
  });

  it("signs off every email, whatever the body says", () => {
    for (const def of EMAIL_TEMPLATES) {
      const { html } = renderTemplate(def, { ...defaultContent(def), body: "Hello." }, sampleValues(def));
      expect(html, def.key).toContain("Aneesa Talks");
    }
  });
});

describe("template markup", () => {
  const def = getTemplateDef("application-approved")!;

  it("turns a [label](url) line into a button", () => {
    const { html } = renderTemplate(
      def,
      { subject: "s", preheader: "p", body: "[View your profile →]({{profileUrl}})" },
      sampleValues(def)
    );
    expect(html).toContain('href="https://pcc.aneesatalks.com/directory/sara-khan"');
    expect(html).toContain("View your profile");
  });

  it("refuses a javascript: button target", () => {
    const { html } = renderTemplate(
      def,
      { subject: "s", preheader: "p", body: "[Click me](javascript:alert%281%29)" },
      sampleValues(def)
    );
    // The label still renders as a button; the target falls back to the site.
    expect(html).not.toContain('href="javascript:');
    expect(html).toContain('href="https://pcc.aneesatalks.com"');
  });

  it("turns '- Label: value' lines into detail rows", () => {
    const contact = getTemplateDef("contact-request-forwarded")!;
    const { html } = renderTemplate(contact, defaultContent(contact), sampleValues(contact));
    expect(html).toContain("Request type");
    expect(html).toContain("Collaboration Opportunity");
  });

  it("renders a block variable as a quoted panel, keeping its line breaks", () => {
    const revision = getTemplateDef("application-revision")!;
    const { html } = renderTemplate(revision, defaultContent(revision), {
      ...sampleValues(revision),
      note: "one\ntwo",
    });
    expect(html).toContain("one<br />two");
  });
});

describe("template escaping", () => {
  const XSS = `<img src=x onerror="alert(1)">`;

  it("escapes values substituted into the body", () => {
    const { html } = render("application-received", { firstName: XSS });
    expect(html).toContain("&lt;img");
    expect(html).not.toContain("<img src=x");
  });

  it("escapes values substituted into the preheader", () => {
    const contact = getTemplateDef("contact-request-forwarded")!;
    const { html } = renderTemplate(contact, defaultContent(contact), {
      ...sampleValues(contact),
      requesterName: XSS,
    });
    expect(html).not.toContain("<img src=x");
  });

  it("does not let a supplied value become markup", () => {
    // A member whose name is literally a button-shaped string must not produce
    // a button — substitution happens after the structure is parsed.
    const { html } = render("application-received", { firstName: "[Click](https://evil.example)" });
    // It reads back as the literal text they were given, never as a link.
    expect(html).not.toContain('href="https://evil.example"');
    expect(html).toContain("[Click](https://evil.example)");
  });

  it("leaves the subject as plain text", () => {
    const { subject } = render("application-received", { firstName: "Sara" });
    expect(subject).toBe("PCC — We received your application");
  });
});

describe("unknownVariables", () => {
  const def = getTemplateDef("application-received")!;

  it("flags a typo'd variable so it can't ship to a member", () => {
    expect(unknownVariables(def, { subject: "Hi {{frstName}}", preheader: "", body: "x" })).toEqual([
      "frstName",
    ]);
  });

  it("accepts the global siteUrl in any template", () => {
    expect(unknownVariables(def, { subject: "s", preheader: "", body: "See {{siteUrl}}" })).toEqual([]);
  });
});
