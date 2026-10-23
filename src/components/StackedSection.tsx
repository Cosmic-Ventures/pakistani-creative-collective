"use client";

import { useEffect, useRef } from "react";

/**
 * One layer of the home page's stacked scroll: the section pins while it is still
 * on screen, and the next section slides up over it.
 *
 * Pinning a section whose top sticks at 0 would hide the bottom of any section
 * taller than the window, so each one measures itself and sticks at
 * `min(0, windowHeight - sectionHeight)`: short sections pin at the top, tall ones
 * scroll fully into view first and pin once their bottom edge reaches the bottom
 * of the screen. Later sections get a higher z-index so they always cover earlier
 * ones, and every layer has an opaque background so nothing shows through.
 */
export default function StackedSection({
  children,
  layer,
  className = "",
}: {
  children: React.ReactNode;
  layer: number;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const place = () => {
      el.style.top = `${Math.min(0, window.innerHeight - el.offsetHeight)}px`;
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(el);
    window.addEventListener("resize", place);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", place);
    };
  }, []);

  return (
    <section ref={ref} style={{ zIndex: layer }} className={`sticky top-0 bg-brand-green ${className}`}>
      {children}
    </section>
  );
}
