"use client";

import { useState } from "react";
import { MAX_HEADSHOT_BYTES } from "@/lib/enroll-constants";
import { HeadshotCropper } from "@/components/HeadshotCropper";

/**
 * Downscales and re-encodes the chosen image before it ever leaves the browser.
 * The client asked for uploads up to 8MB, but the picture travels inline as a
 * base64 data URL, which inflates it by ~4/3 — so an 8MB original became a
 * ~10.7MB request body and a ~10.7MB row in the database. Compressing here keeps
 * the accepted-input limit at the 8MB the client specified while what's actually
 * transmitted and stored stays in the low hundreds of KB.
 */
async function compressImage(file: File, maxDim = 1200, quality = 0.85): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", quality);
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Controlled headshot picker. Renders the file input, a live preview, and a
 * hidden field carrying the resulting data URL so it submits with the
 * surrounding form.
 */
export function HeadshotUpload({
  name,
  value,
  onChange,
  dark,
}: {
  name: string;
  value: string;
  onChange: (dataUrl: string) => void;
  dark?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_HEADSHOT_BYTES) {
      setError("File is too large — please choose an image under 8MB.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    setError(null);
    setWorking(true);
    try {
      let dataUrl: string;
      try {
        dataUrl = await compressImage(file);
      } catch {
        // Browsers without createImageBitmap: fall back to the raw file. That
        // skips compression, so the base64 payload can exceed the 4.5MB body
        // limit Vercel enforces on serverless requests — say so plainly rather
        // than letting the submit fail later with an opaque error, which is the
        // exact failure this whole upload path exists to prevent.
        dataUrl = await readAsDataUrl(file);
        if (dataUrl.length > 3_000_000) {
          setError("This image is too large for your browser to resize — please choose one under 2MB.");
          return;
        }
      }
      setFileName(file.name);
      // Cropping happens before the image is ever accepted as the value, so a
      // fresh upload always goes through the same crop step as a re-crop of an
      // existing photo — one code path, not two.
      setCropSrc(dataUrl);
    } catch {
      setError("That image couldn't be read — please try a different file.");
    } finally {
      setWorking(false);
    }
  }

  const muted = dark ? "text-brand-cream/60" : "text-black/50";

  return (
    <>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => handleFile(e.target.files?.[0])}
        className={`w-full text-sm ${dark ? "text-brand-cream/70" : "text-black/70"} file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-brand-green file:text-brand-cream file:text-sm file:font-semibold file:cursor-pointer cursor-pointer`}
      />
      <input type="hidden" name={name} value={value} />
      {working && <p className={`text-xs ${muted} mt-1.5`}>Processing image…</p>}
      {fileName && !error && !working && <p className={`text-xs ${muted} mt-1.5`}>Selected: {fileName}</p>}
      {value && (
        <div className="flex items-center gap-3 mt-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Headshot preview" className="w-16 h-16 rounded-xl object-cover" />
          <button
            type="button"
            onClick={() => setCropSrc(value)}
            className={`text-xs font-semibold underline underline-offset-2 ${dark ? "text-brand-mint hover:text-brand-mint/80" : "text-brand-green hover:text-brand-green/70"}`}
          >
            Adjust crop
          </button>
        </div>
      )}
      {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}

      {cropSrc && (
        <HeadshotCropper
          src={cropSrc}
          onCancel={() => setCropSrc(null)}
          onCropped={(cropped) => {
            onChange(cropped);
            setCropSrc(null);
          }}
        />
      )}
    </>
  );
}

/**
 * Same picker for plain (non-React-state-managed) forms — holds the current
 * value itself, seeded from whatever is already stored. Used by the account
 * page's profile editor, where the rest of the form is uncontrolled.
 */
export function SelfManagedHeadshotUpload({
  name,
  initialValue = "",
}: {
  name: string;
  initialValue?: string;
}) {
  const [value, setValue] = useState(initialValue);
  return <HeadshotUpload name={name} value={value} onChange={setValue} />;
}
