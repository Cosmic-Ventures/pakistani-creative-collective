import Link from "next/link";

export default function Nav() {
  return (
    <header className="border-b border-stone-800 bg-stone-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-emerald-400 font-bold text-lg tracking-tight group-hover:text-emerald-300 transition-colors">
            PCC
          </span>
          <span className="text-stone-400 text-sm hidden sm:inline">
            Pakistani Creative Collective
          </span>
        </Link>

        <nav className="flex items-center gap-6 text-sm">
          <Link
            href="/directory"
            className="text-stone-300 hover:text-white transition-colors"
          >
            Directory
          </Link>
          <Link
            href="/request"
            className="text-stone-300 hover:text-white transition-colors"
          >
            Hire Talent
          </Link>
          <Link
            href="/join"
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-full transition-colors font-medium"
          >
            Join
          </Link>
        </nav>
      </div>
    </header>
  );
}
