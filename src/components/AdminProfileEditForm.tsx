"use client";

import { useState } from "react";
import { updateCreativeProfile } from "@/lib/admin-actions";

type WorkSample = { title?: string; medium?: string; year?: string; role?: string; link?: string };

type CreativeForForm = {
  id: string;
  firstName: string;
  lastName: string;
  pronouns: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  location: string | null;
  howHeard: string | null;
  referralName: string | null;
  bio: string;
  pccGoals: string | null;
  previousCollaborators: string | null;
  unionMemberships: string | null;
  education: string | null;
  additionalNotes: string | null;
  roles: string[];
  mediums: string[];
  languages: string[];
  specialSkills: string | null;
  equipment: string | null;
  experienceLevel: string | null;
  yearsExperience: string | null;
  completedProjects: string | null;
  notableAchievements: string | null;
  references: string | null;
  website: string | null;
  publicLink: string | null;
  imdb: string | null;
  instagram: string | null;
  linkedin: string | null;
  vimeo: string | null;
  rateStructure: string | null;
  rateRange: string | null;
  ratePublic: boolean;
  availability: string | null;
  travel: string | null;
  preferredProjectTypes: string[];
  collaborationPreferences: string | null;
  promoConsent: boolean;
  featured: boolean;
  featuredUntil: Date | null;
  commentSuspended: boolean;
  commentFlagged: boolean;
};

const fieldClass =
  "w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-1.5 text-sm text-stone-200 focus:outline-none focus:border-stone-600";

function Field({
  label,
  name,
  defaultValue,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs text-stone-500 block mb-1">{label}</span>
      <input name={name} type={type} defaultValue={defaultValue ?? ""} className={fieldClass} />
    </label>
  );
}

function AreaField({
  label,
  name,
  defaultValue,
  rows = 3,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="text-xs text-stone-500 block mb-1">{label}</span>
      <textarea name={name} defaultValue={defaultValue ?? ""} rows={rows} className={fieldClass} />
    </label>
  );
}

function ListField({ label, name, defaultValue }: { label: string; name: string; defaultValue: string[] }) {
  return (
    <label className="block">
      <span className="text-xs text-stone-500 block mb-1">
        {label} <span className="text-stone-600">(comma-separated)</span>
      </span>
      <input name={name} defaultValue={defaultValue.join(", ")} className={fieldClass} />
    </label>
  );
}

function CheckboxField({
  label,
  name,
  checked,
  onChange,
}: {
  label: string;
  name: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-stone-300 py-1">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-emerald-600"
      />
      {label}
    </label>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-stone-900 border border-stone-800 rounded-xl p-5">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-3">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

const onOff = (v: boolean) => (v ? "On" : "Off");

export function AdminProfileEditForm({ creative: c, workSamples }: { creative: CreativeForForm; workSamples: WorkSample[] }) {
  // Only the flags that bypass a dedicated review flow (feature requests,
  // community moderation) get controlled state — everything else stays
  // uncontrolled/defaultValue. This lets the confirm step call out exactly
  // what's changing, so a stray click here doesn't silently override those
  // flows — client feedback (08/28 round): "make sure the confirmation is
  // optimized for UI/UX, for no accidental changes."
  const [featured, setFeatured] = useState(c.featured);
  const [commentSuspended, setCommentSuspended] = useState(c.commentSuspended);
  const [commentFlagged, setCommentFlagged] = useState(c.commentFlagged);

  const flagChanges = [
    c.featured !== featured && `Featured: ${onOff(c.featured)} → ${onOff(featured)}`,
    c.commentSuspended !== commentSuspended && `Comment suspended: ${onOff(c.commentSuspended)} → ${onOff(commentSuspended)}`,
    c.commentFlagged !== commentFlagged && `Comment flagged: ${onOff(c.commentFlagged)} → ${onOff(commentFlagged)}`,
  ].filter((x): x is string => Boolean(x));

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    let message = `Save changes to ${c.firstName} ${c.lastName}'s profile? This updates the live profile immediately.`;
    if (flagChanges.length > 0) {
      message += `\n\nThis also bypasses the normal review flow for:\n- ${flagChanges.join("\n- ")}`;
    }
    if (!window.confirm(message)) {
      e.preventDefault();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
    // A stray Enter in any of the many single-line text inputs would otherwise
    // submit the whole form immediately, with no chance to review — textareas
    // are unaffected since Enter there just adds a newline.
    if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") {
      e.preventDefault();
    }
  }

  return (
    <form
      action={updateCreativeProfile.bind(null, c.id)}
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
    >
      <div className="flex justify-end mb-4">
        <button className="text-sm bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-1.5 rounded-lg transition-colors">
          Save Profile
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Group title="Identity & Contact">
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name" name="firstName" defaultValue={c.firstName} />
            <Field label="Last name" name="lastName" defaultValue={c.lastName} />
          </div>
          <Field label="Pronouns" name="pronouns" defaultValue={c.pronouns} />
          <Field label="Email" name="email" defaultValue={c.email} />
          <Field label="Phone" name="phone" defaultValue={c.phone} />
          <Field label="Address (private)" name="address" defaultValue={c.address} />
          <Field label="Public location" name="location" defaultValue={c.location} />
          <Field label="How they heard about PCC" name="howHeard" defaultValue={c.howHeard} />
          <Field label="Referred by" name="referralName" defaultValue={c.referralName} />
        </Group>

        <Group title="Bio & Background">
          <AreaField label="Bio" name="bio" defaultValue={c.bio} rows={4} />
          <AreaField label="What they want from PCC" name="pccGoals" defaultValue={c.pccGoals} />
          <AreaField label="Previous collaborators" name="previousCollaborators" defaultValue={c.previousCollaborators} />
          <Field label="Union / guild memberships" name="unionMemberships" defaultValue={c.unionMemberships} />
          <AreaField label="Education / training" name="education" defaultValue={c.education} />
          <AreaField label="Additional notes" name="additionalNotes" defaultValue={c.additionalNotes} />
        </Group>

        <Group title="Roles, Mediums & Skills">
          <ListField label="Roles" name="roles" defaultValue={c.roles} />
          <ListField label="Mediums" name="mediums" defaultValue={c.mediums} />
          <ListField label="Languages" name="languages" defaultValue={c.languages} />
          <AreaField label="Special skills / certifications" name="specialSkills" defaultValue={c.specialSkills} rows={2} />
          <AreaField label="Equipment" name="equipment" defaultValue={c.equipment} rows={2} />
        </Group>

        <Group title="Experience & Portfolio Links">
          <Field label="Experience level" name="experienceLevel" defaultValue={c.experienceLevel} />
          <Field label="Years of experience" name="yearsExperience" defaultValue={c.yearsExperience} />
          <Field label="Completed projects" name="completedProjects" defaultValue={c.completedProjects} />
          <AreaField label="Notable achievements" name="notableAchievements" defaultValue={c.notableAchievements} rows={2} />
          <AreaField label="References" name="references" defaultValue={c.references} rows={2} />
          <Field label="Website / portfolio" name="website" defaultValue={c.website} />
          <Field label="Public link (shown if no website)" name="publicLink" defaultValue={c.publicLink} />
          <Field label="IMDb" name="imdb" defaultValue={c.imdb} />
          <Field label="Instagram" name="instagram" defaultValue={c.instagram} />
          <Field label="LinkedIn" name="linkedin" defaultValue={c.linkedin} />
          <Field label="Vimeo / YouTube" name="vimeo" defaultValue={c.vimeo} />
        </Group>

        <Group title="Work for Hire">
          <Field label="Rate structure" name="rateStructure" defaultValue={c.rateStructure} />
          <Field label="Rate range" name="rateRange" defaultValue={c.rateRange} />
          <label className="flex items-center gap-2 text-sm text-stone-300 py-1">
            <input type="checkbox" name="ratePublic" defaultChecked={c.ratePublic} className="accent-emerald-600" />
            Rate visible to paid members
          </label>
          <Field label="Availability" name="availability" defaultValue={c.availability} />
          <Field label="Travel" name="travel" defaultValue={c.travel} />
          <ListField label="Preferred project types" name="preferredProjectTypes" defaultValue={c.preferredProjectTypes} />
          <Field label="Collaboration preferences" name="collaborationPreferences" defaultValue={c.collaborationPreferences} />
        </Group>

        <div className="lg:col-span-2">
          <Group title="Work Samples (up to 3)">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[0, 1, 2].map((i) => {
                const ws = workSamples[i] ?? {};
                const n = i + 1;
                return (
                  <div key={n} className="bg-stone-950 border border-stone-800 rounded-lg p-3 space-y-2">
                    <Field label="Title" name={`ws${n}Title`} defaultValue={ws.title} />
                    <Field label="Medium" name={`ws${n}Medium`} defaultValue={ws.medium} />
                    <Field label="Year" name={`ws${n}Year`} defaultValue={ws.year} />
                    <Field label="Role(s)" name={`ws${n}Role`} defaultValue={ws.role} />
                    <Field label="Link" name={`ws${n}Link`} defaultValue={ws.link} />
                  </div>
                );
              })}
            </div>
          </Group>
        </div>

        <div className="lg:col-span-2">
          <Group title="Consents">
            <label className="flex items-center gap-2 text-sm text-stone-300 py-1">
              <input type="checkbox" name="promoConsent" defaultChecked={c.promoConsent} className="accent-emerald-600" />
              Promotional use consent (opted in to public-launch social promo)
            </label>
          </Group>

          {/* Visually separated and amber-flagged: these three bypass their own
              dedicated review flows (feature requests, community moderation)
              rather than just editing plain profile data, so they're worth a
              second look before hitting Save. */}
          <div className="bg-amber-950/20 border border-amber-800/40 rounded-xl p-5 mt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-500/80 mb-1">
              Moderation &amp; Feature Overrides
            </h3>
            <p className="text-xs text-amber-200/50 mb-3">
              These normally go through Feature Requests or Community moderation — changing them here skips that review.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <CheckboxField label="Featured" name="featured" checked={featured} onChange={setFeatured} />
              <Field
                label="Featured until"
                name="featuredUntil"
                type="date"
                defaultValue={c.featuredUntil ? new Date(c.featuredUntil).toISOString().slice(0, 10) : null}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <CheckboxField
                label="Comment suspended"
                name="commentSuspended"
                checked={commentSuspended}
                onChange={setCommentSuspended}
              />
              <CheckboxField label="Comment flagged" name="commentFlagged" checked={commentFlagged} onChange={setCommentFlagged} />
            </div>
            {flagChanges.length > 0 && (
              <p className="text-xs text-amber-400 mt-3">
                Pending: {flagChanges.join(" · ")}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-4">
        <button className="text-sm bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-1.5 rounded-lg transition-colors">
          Save Profile
        </button>
      </div>
    </form>
  );
}
