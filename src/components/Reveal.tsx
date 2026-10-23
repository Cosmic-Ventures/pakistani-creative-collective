"use client";

import { useEffect, useRef } from "react";

/**
 * Fades and lifts its content in as it scrolls into view (home page, 10/22 round).
 *
 * Done with classList on the element rather than React state: it renders fully
 * visible on the server (so nothing is hidden without JavaScript), and only on the
 * client does it hide what is still below the fold and reveal it on arrival.
 * Skipped entirely for visitors who ask for reduced motion.
 */
export default function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return;
    el.classList.add("reveal-hidden");
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.remove("reveal-hidden");
          io.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  );
}
