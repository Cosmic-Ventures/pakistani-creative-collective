/**
 * Shared chrome for the policy pages.
 *
 * NOTE FOR THE TEAM: the text in /privacy and /terms is a reasonable generic
 * starting point written around what this platform actually collects and who
 * processes it — it is not legal advice and has not been reviewed by a lawyer.
 * Have counsel review both before the public launch, particularly the governing
 * law, liability and refund clauses.
 */
import Link from "next/link";

export function LegalPage({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
      <h1 className="font-heading font-bold text-3xl sm:text-4xl text-black mb-3">{title}</h1>
      <p className="text-black/50 text-sm mb-8">Last updated {updated}</p>
      <p className="text-black/70 leading-relaxed mb-10">{intro}</p>
      <div className="space-y-8">{children}</div>
      <p className="text-black/60 text-sm mt-12 pt-8 border-t border-black/10">
        Questions about this page? Email{" "}
        <a href="mailto:pcc@aneesatalks.com" className="text-black underline underline-offset-2 hover:no-underline">
          pcc@aneesatalks.com
        </a>
        . See also our{" "}
        <Link href="/privacy" className="text-black underline underline-offset-2 hover:no-underline">
          Privacy Policy
        </Link>{" "}
        and{" "}
        <Link href="/terms" className="text-black underline underline-offset-2 hover:no-underline">
          Terms of Service
        </Link>
        .
      </p>
    </div>
  );
}

export function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-heading font-bold text-lg text-black mb-3">{heading}</h2>
      <div className="space-y-3 text-black/70 leading-relaxed text-[15px]">{children}</div>
    </section>
  );
}

export function List({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5">
          <span className="text-black/40 shrink-0">—</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
