"use client";

import { useActionState, useState } from "react";
import { updateOwnProfile, type UpdateProfileResult } from "@/lib/profile-actions";
import { SelfManagedHeadshotUpload } from "@/components/HeadshotUpload";
import type { Creative } from "@prisma/client";

const inputCls = "w-full bg-white border border-brand-green/20 rounded-lg px-4 py-2.5 text-brand-brown focus:outline-none focus:border-brand-green text-sm";
const textareaCls = `${inputCls} resize-none`;

type Values = Record<string, string>;

// Every field is controlled by local state, not `defaultValue` — useActionState
// resets *uncontrolled* fields after any action run, success or error, which
// would otherwise wipe the form on every save (AGENTS.md gotcha #6).
export function ProfileEditForm({ creative }: { creative: Creative }) {
  const [state, formAction, pending] = useActionState<UpdateProfileResult | null, FormData>(
    updateOwnProfile,
    null
  );

  const [values, setValues] = useState<Values>({
    pronouns: creative.pronouns ?? "",
    location: creative.location ?? "",
    bio: creative.bio,
    notableAchievements: creative.notableAchievements ?? "",
    previousCollaborators: creative.previousCollaborators ?? "",
    availability: creative.availability ?? "",
    website: creative.website ?? "",
    imdb: creative.imdb ?? "",
    instagram: creative.instagram ?? "",
    linkedin: creative.linkedin ?? "",
    vimeo: creative.vimeo ?? "",
  });
  const update = (name: string, value: string) => setValues((v) => ({ ...v, [name]: value }));

  return (
    <form action={formAction} className="bg-white rounded-2xl p-6 space-y-4">
      {state && "error" in state && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {state.error}
        </p>
      )}
      {state && "success" in state && (
        <p className="text-sm text-brand-green bg-brand-mint/20 border border-brand-mint rounded-lg px-4 py-2">
          Profile updated — your changes are live.
        </p>
      )}

      {/* Approved members can swap or re-crop their photo at any time (08/08
          round) — previously the headshot was fixed at application time. */}
      <div>
        <label className="block text-sm text-brand-brown/70 mb-1.5">Profile Headshot</label>
        <SelfManagedHeadshotUpload name="headshot" initialValue={creative.headshot ?? ""} />
        <p className="text-xs text-brand-brown/40 mt-1">
          Image file, up to 8MB. Use &ldquo;Adjust crop&rdquo; to re-frame your current photo without
          re-uploading. Leave as-is to keep your current photo.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Pronouns" name="pronouns" values={values} update={update} />
        <Field label="Public Location" name="location" values={values} update={update} />
      </div>
      <TextArea label="Bio" name="bio" required rows={6} values={values} update={update} />
      <TextArea label="Notable Achievements" name="notableAchievements" rows={2} values={values} update={update} />
      <TextArea label="Previous Collaborators" name="previousCollaborators" rows={2} values={values} update={update} />
      <Field label="Current Availability" name="availability" hint="e.g. a date range, or 'Available now'" values={values} update={update} />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Website / Portfolio" name="website" values={values} update={update} />
        <Field label="IMDb" name="imdb" values={values} update={update} />
        <Field label="Instagram" name="instagram" values={values} update={update} />
        <Field label="LinkedIn" name="linkedin" values={values} update={update} />
      </div>
      <Field label="Vimeo / YouTube" name="vimeo" values={values} update={update} />
      <button
        disabled={pending}
        className="bg-brand-green hover:bg-brand-green/90 disabled:opacity-50 text-brand-cream font-semibold px-6 py-3 rounded-full transition-colors text-sm"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}

function Field({
  label, name, hint, required, values, update,
}: { label: string; name: string; hint?: string; required?: boolean; values: Values; update: (name: string, value: string) => void }) {
  return (
    <div>
      <label className="block text-sm text-brand-brown/70 mb-1.5">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
      <input
        name={name}
        required={required}
        value={values[name] ?? ""}
        onChange={(e) => update(name, e.target.value)}
        className={inputCls}
      />
      {hint && <p className="text-xs text-brand-brown/40 mt-1">{hint}</p>}
    </div>
  );
}

function TextArea({
  label, name, rows = 3, required, values, update,
}: { label: string; name: string; rows?: number; required?: boolean; values: Values; update: (name: string, value: string) => void }) {
  return (
    <div>
      <label className="block text-sm text-brand-brown/70 mb-1.5">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
      <textarea
        name={name}
        required={required}
        rows={rows}
        value={values[name] ?? ""}
        onChange={(e) => update(name, e.target.value)}
        className={textareaCls}
      />
    </div>
  );
}
