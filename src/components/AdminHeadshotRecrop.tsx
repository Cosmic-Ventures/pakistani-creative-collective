"use client";

import { useState, useTransition } from "react";
import { HeadshotCropper } from "@/components/HeadshotCropper";
import { updateCreativeHeadshot } from "@/lib/admin-actions";

export function AdminHeadshotRecrop({
  creativeId,
  headshot,
}: {
  creativeId: string;
  headshot: string | null;
}) {
  const [cropping, setCropping] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!headshot) {
    return <p className="text-xs text-stone-600">No photo on file to re-crop.</p>;
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setCropping(true)}
        disabled={pending}
        className="text-xs bg-stone-800 hover:bg-stone-700 text-stone-300 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
      >
        {pending ? "Saving…" : "Re-crop photo"}
      </button>
      {message && <p className="text-xs text-emerald-500 mt-1.5">{message}</p>}

      {cropping && (
        <HeadshotCropper
          src={headshot}
          onCancel={() => setCropping(false)}
          onCropped={(dataUrl) => {
            setCropping(false);
            setMessage(null);
            startTransition(async () => {
              await updateCreativeHeadshot(creativeId, dataUrl);
              setMessage("Photo updated.");
            });
          }}
        />
      )}
    </div>
  );
}
