import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-brand-green/15 mt-auto py-8 px-4 print:hidden">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-brand-green/60">
        <p>
          © {new Date().getFullYear()} the Pakistani Creative Collective · Curated
          by{" "}
          <a
            href="https://aneesatalks.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-green hover:text-brand-green/70 transition-colors"
          >
            Aneesa Talks
          </a>
        </p>
        <nav className="flex gap-6">
          <Link href="/directory" className="hover:text-brand-green transition-colors">
            Directory
          </Link>
          <Link href="/join" className="hover:text-brand-green transition-colors">
            Join
          </Link>
          <Link href="/request" className="hover:text-brand-green transition-colors">
            Hire Talent
          </Link>
          <Link href="/privacy" className="hover:text-brand-green transition-colors">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-brand-green transition-colors">
            Terms
          </Link>
        </nav>
      </div>
    </footer>
  );
}
