"use client";

import { useRef } from "react";

export type WorkSample = {
  title: string;
  role?: string;
  medium?: string;
  year?: string;
  link?: string;
  thumbnail?: string;
};

/** One compact resume-style card per work sample; swipe (or use the arrows) when there are several. */
export default function WorkSamplesCarousel({ samples }: { samples: WorkSample[] }) {
  const track = useRef<HTMLDivElement>(null);
  const scrollBy = (dir: 1 | -1) => {
    const el = track.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };
  const multiple = samples.length > 1;

  return (
    <div className="relative">
      <div
        ref={track}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {samples.map((ws, i) => {
          const meta = [ws.role, ws.medium, ws.year].filter(Boolean).join(" · ");
          return (
            <div
              key={i}
              className={`snap-start last:snap-end shrink-0 bg-brand-green border border-brand-cream/10 rounded-3xl overflow-hidden flex flex-col ${
                multiple ? "w-[85%] sm:w-[70%]" : "w-full"
              }`}
            >
              {ws.thumbnail && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ws.thumbnail} alt="" className="w-full aspect-video object-cover" />
              )}
              <div className="p-5 flex flex-col gap-1 text-brand-cream">
                <p className="font-bold leading-snug">{ws.title}</p>
                {meta && <p className="text-sm text-brand-cream/70">{meta}</p>}
                {ws.link && (
                  <a
                    href={ws.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm underline decoration-brand-cream/40 underline-offset-2 hover:decoration-brand-cream break-all mt-1"
                  >
                    {ws.link.replace(/^https?:\/\/(www\.)?/, "").replace(/\?.*$/, "")} ↗
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {multiple && (
        <div className="flex justify-end gap-2 mt-1 print:hidden">
          {([-1, 1] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => scrollBy(d)}
              aria-label={d === 1 ? "Next work sample" : "Previous work sample"}
              className="w-8 h-8 rounded-full bg-brand-cream/15 text-brand-cream hover:bg-brand-cream/30 transition-colors"
            >
              {d === 1 ? "→" : "←"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
