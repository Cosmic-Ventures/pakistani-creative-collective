"use client";

import { useActionState, useState } from "react";
import { createPost, type PostResult } from "@/lib/community-actions";
import {
  POST_CATEGORY_LABELS,
  POST_CATEGORY_DESCRIPTIONS,
  CATEGORIES_REQUIRING_REGION,
  CATEGORIES_REQUIRING_DEADLINE,
  POST_BODY_MAX_WORDS,
} from "@/lib/community-constants";
import type { PostCategory } from "@prisma/client";
import { withSubmitFallback } from "@/lib/submit-fallback";

const CATEGORIES = Object.keys(POST_CATEGORY_LABELS) as PostCategory[];
const inputCls = "w-full bg-white border border-brand-green/20 rounded-lg px-4 py-2.5 text-brand-brown text-sm focus:outline-none focus:border-brand-green";

export default function NewPostForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<PostResult | null, FormData>(
    withSubmitFallback<PostResult | null>(
      createPost,
      { error: "We couldn't reach the server to post this — check your connection and try again." },
      "community-post"
    ),
    null
  );
  const [category, setCategory] = useState<PostCategory | "">("");
  const [body, setBody] = useState("");

  // Reset the composer when a submission succeeds. Adjusted during render
  // (React's documented pattern for "reset state when a value changes")
  // rather than in a useEffect, which would cause an extra cascading render.
  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state && "success" in state) {
      setOpen(false);
      setCategory("");
      setBody("");
    }
  }

  const words = body.trim().split(/\s+/).filter(Boolean).length;
  const regionRequired = category !== "" && CATEGORIES_REQUIRING_REGION.includes(category);
  const deadlineRequired = category !== "" && CATEGORIES_REQUIRING_DEADLINE.includes(category);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full mb-8 bg-white border border-brand-green/15 rounded-xl px-5 py-4 text-left text-brand-brown/50 hover:border-brand-green/40 transition-colors text-sm"
      >
        Share recent work, a funding need, a collaboration opportunity, or your availability…
      </button>
    );
  }

  return (
    <form action={formAction} className="bg-white border border-brand-green/15 rounded-xl p-5 sm:p-6 mb-8 space-y-4">
      {state && "error" in state && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{state.error}</p>
      )}
      <p className="text-xs text-brand-brown/50">
        Posts are reviewed by Aneesa Talks before they go live.
      </p>

      <div>
        <label className="block text-sm text-brand-brown/70 mb-1.5">Category *</label>
        <select
          name="category"
          required
          value={category}
          onChange={(e) => setCategory(e.target.value as PostCategory)}
          className={inputCls}
        >
          <option value="">Select…</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{POST_CATEGORY_LABELS[c]}</option>
          ))}
        </select>
        {category && <p className="text-xs text-brand-brown/40 mt-1">{POST_CATEGORY_DESCRIPTIONS[category]}</p>}
      </div>

      <div>
        <label className="block text-sm text-brand-brown/70 mb-1.5">Title *</label>
        <input name="title" required maxLength={200} className={inputCls} />
      </div>

      <div>
        <label className="block text-sm text-brand-brown/70 mb-1.5">
          Details * <span className="text-brand-brown/40 font-normal">({words} / {POST_BODY_MAX_WORDS} words)</span>
        </label>
        <textarea
          name="body"
          required
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className={`${inputCls} resize-none`}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-brand-brown/70 mb-1.5">
            Region{regionRequired && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          <input name="region" required={regionRequired} placeholder="e.g. Remote, Lahore, NYC" className={inputCls} />
        </div>
        <div>
          <label className="block text-sm text-brand-brown/70 mb-1.5">
            Duration / Deadline{deadlineRequired && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          <input name="expiresAt" type="date" required={deadlineRequired} className={inputCls} />
        </div>
      </div>

      <div>
        <label className="block text-sm text-brand-brown/70 mb-1.5">Attachment or project link</label>
        <input name="link" type="url" placeholder="https://…" className={inputCls} />
      </div>

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={pending}
          className="bg-brand-green hover:bg-brand-green/90 disabled:opacity-50 text-brand-cream font-semibold px-5 py-2.5 rounded-full transition-colors text-sm"
        >
          {pending ? "Submitting…" : "Submit for review"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-brand-brown/60 hover:text-brand-brown text-sm px-3"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
