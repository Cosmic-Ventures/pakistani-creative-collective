import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-stone-800 mt-auto py-8 px-4">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-stone-500">
        <p>
          © {new Date().getFullYear()} Pakistani Creative Collective · Curated
          by{" "}
          <a
            href="https://aneesatalks.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-stone-400 hover:text-white transition-colors"
          >
            Aneesa Talks
          </a>
        </p>
        <nav className="flex gap-6">
          <Link href="/directory" className="hover:text-stone-300 transition-colors">
            Directory
          </Link>
          <Link href="/join" className="hover:text-stone-300 transition-colors">
            Join
          </Link>
          <Link href="/request" className="hover:text-stone-300 transition-colors">
            Hire Talent
          </Link>
        </nav>
      </div>
    </footer>
  );
}
