"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

const VIEWPORT = 280;

type Offset = { x: number; y: number };

/**
 * Drag-to-pan, slider-to-zoom square cropper — the same interaction pattern as
 * a Twitter/GitHub avatar upload. Renders the source image inside a fixed
 * square window; "Use this crop" bakes the currently-visible region into a
 * square JPEG at `outputSize`.
 *
 * Works on any image source (a freshly-picked file's data URL, or an
 * already-stored headshot) — that's what lets the same component serve both
 * "crop before first upload" and "re-crop what's already on file".
 */
export function HeadshotCropper({
  src,
  onCancel,
  onCropped,
  outputSize = 640,
}: {
  src: string;
  onCancel: () => void;
  onCropped: (dataUrl: string) => void;
  outputSize?: number;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  const baseScale = imgSize ? Math.max(VIEWPORT / imgSize.w, VIEWPORT / imgSize.h) : 1;
  const scale = baseScale * zoom;
  const dispW = imgSize ? imgSize.w * scale : 0;
  const dispH = imgSize ? imgSize.h * scale : 0;

  function clamp(o: Offset, w: number, h: number): Offset {
    const maxX = Math.max(0, (w - VIEWPORT) / 2);
    const maxY = Math.max(0, (h - VIEWPORT) / 2);
    return { x: Math.min(maxX, Math.max(-maxX, o.x)), y: Math.min(maxY, Math.max(-maxY, o.y)) };
  }

  function handleImgLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: offset.x, origY: offset.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setOffset(clamp({ x: dragRef.current.origX + dx, y: dragRef.current.origY + dy }, dispW, dispH));
  }
  function handlePointerUp() {
    dragRef.current = null;
  }

  function handleZoom(next: number) {
    setZoom(next);
    if (imgSize) {
      const nextScale = baseScale * next;
      setOffset((o) => clamp(o, imgSize.w * nextScale, imgSize.h * nextScale));
    }
  }

  function applyCrop() {
    const img = imgRef.current;
    if (!img || !imgSize) return;

    const cropSize = VIEWPORT / scale;
    let cropX = (dispW / 2 - VIEWPORT / 2 - offset.x) / scale;
    let cropY = (dispH / 2 - VIEWPORT / 2 - offset.y) / scale;
    cropX = Math.min(Math.max(cropX, 0), Math.max(0, imgSize.w - cropSize));
    cropY = Math.min(Math.max(cropY, 0), Math.max(0, imgSize.h - cropSize));

    const canvas = document.createElement("canvas");
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, cropX, cropY, cropSize, cropSize, 0, 0, outputSize, outputSize);
    onCropped(canvas.toDataURL("image/jpeg", 0.88));
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl p-5 max-w-sm w-full">
        <p className="text-sm font-semibold text-black mb-3">Adjust your photo</p>
        <div
          className="relative mx-auto rounded-xl overflow-hidden bg-black/5 cursor-grab active:cursor-grabbing touch-none select-none"
          style={{ width: VIEWPORT, height: VIEWPORT }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={src}
            alt=""
            onLoad={handleImgLoad}
            draggable={false}
            className="absolute top-1/2 left-1/2 max-w-none pointer-events-none"
            style={{
              width: dispW || undefined,
              height: dispH || undefined,
              transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px)`,
            }}
          />
          {/* Circular guide so it's obvious this becomes an avatar-style crop,
              even though the stored file is a plain square. */}
          <div className="absolute inset-0 pointer-events-none rounded-full ring-[100px] ring-black/40" />
        </div>

        <div className="flex items-center gap-2 mt-4">
          <span className="text-xs text-black/50">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => handleZoom(Number(e.target.value))}
            className="flex-1 accent-brand-green"
          />
        </div>

        <div className="flex items-center justify-end gap-3 mt-5">
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-black/60 hover:text-black px-4 py-2"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={applyCrop}
            className="bg-brand-green hover:bg-brand-green/90 text-brand-cream font-semibold text-sm px-5 py-2 rounded-full transition-colors"
          >
            Use this crop
          </button>
        </div>
      </div>
    </div>
  );
}
