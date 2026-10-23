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
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <Link href="/about" className="hover:text-brand-green transition-colors">
            About
          </Link>
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
          <a
            href="https://www.instagram.com/pakistanicreativecollective"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="hover:text-brand-green transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
            </svg>
          </a>
        </nav>
      </div>
    </footer>
  );
}
