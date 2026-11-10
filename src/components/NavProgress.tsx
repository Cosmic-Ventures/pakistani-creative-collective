"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type Phase = "idle" | "loading" | "done";

// Thin bar across the top that starts when an internal link is clicked and
// completes once the new route has rendered, so a slow page never looks like a
// dead click.
export default function NavProgress() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("idle");
  const lastPath = useRef(pathname);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      clearTimers();
      setPhase("loading");
      // Safety net: never leave the bar hanging if navigation is cancelled.
      timers.current.push(window.setTimeout(() => setPhase("idle"), 15000));
    };
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      clearTimers();
    };
  }, []);

  useEffect(() => {
    if (pathname === lastPath.current) return;
    lastPath.current = pathname;
    clearTimers();
    // Deferred so it isn't a synchronous setState in the effect body.
    timers.current.push(window.setTimeout(() => setPhase("done"), 0));
    timers.current.push(window.setTimeout(() => setPhase("idle"), 400));
  }, [pathname]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-1"
      style={{ opacity: phase === "idle" ? 0 : 1, transition: "opacity 300ms ease 100ms" }}
    >
      <div
        className="h-full bg-brand-mint shadow-[0_0_8px_var(--color-brand-mint)]"
        style={{
          width: phase === "loading" ? "85%" : phase === "done" ? "100%" : "0%",
          transition:
            phase === "loading" ? "width 10s cubic-bezier(0.1, 0.8, 0.2, 1)" : phase === "done" ? "width 200ms ease-out" : "none",
        }}
      />
    </div>
  );
}
