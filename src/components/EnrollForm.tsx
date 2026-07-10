"use client";

import { useActionState, useState } from "react";
import { enrollAction, type EnrollResult } from "@/lib/enroll-action";
import { EXPERIENCE_LEVELS } from "@/lib/experience-levels";

// Categories and roles copied verbatim from the PCC enrollment Jotform
// (jotform.com/form/253118193860054) per client request — this list is the
// source of truth, not an approximation.
const ROLE_CATEGORIES: Record<string, string[]> = {
  Directing: ["1st Assistant Director", "2nd Assistant Director", "Director", "Script Supervisor"],
  Writing: ["Journalist", "Script Consultant", "Screenwriter", "Story Analyst/Reader", "Writer (Narrative Fiction)"],
  Producing: [
    "Associate Producer", "Co-Producer", "Creative Producer", "Executive Producer", "Showrunner",
    "Line Producer", "Post-Production Supervisor", "Producer", "Production Coordinator", "Unit Production Manager (UPM)",
  ],
  Camera: [
    "1st Assistant Camera (1st AC/Focus Puller)", "2nd Assistant Camera (2nd AC/Clapper Loader)",
    "Camera Operator", "Digital Imaging Technician (DIT)", "Director of Photography (DP/Cinematographer)",
    "Photographer", "Still Photographer/BTS",
  ],
  "Lighting & Grip": ["Best Boy", "Gaffer (Chief Lighting Technician)", "Grip", "Key Grip", "Lighting Technician"],
  Sound: ["Boom Operator", "Foley Artist", "Sound Designer", "Sound Editor/Mixer", "Sound Recordist/Production Sound Mixer"],
  "Editing & Post-Production": ["Assistant Editor", "Colorist", "Editor", "Visual Effects (VFX) Artist"],
  Music: ["Composer", "DJ", "Music Producer", "Singer", "Songwriter"],
  "Production Design/Art": ["Art Director", "Production Designer", "Props Master", "Set Designer", "Storyboard Artist"],
  Styling: ["Costume Designer", "Hair Stylist", "Key Costumer", "Makeup Artist", "Special Effects Makeup Artist", "Wardrobe Supervisor"],
  "Casting & Talent": [
    "Actor", "Casting Assistant", "Casting Director", "Choreographer", "Comedian",
    "Dancer", "Model", "Talent Agent", "Voice Actor/Voice-Over Artist",
  ],
  "Creative & Design": ["Animator", "Artist", "Curator", "Graphic Designer", "Illustrator", "Motion Graphics Designer"],
  "Marketing, Publicity, & Media": [
    "Content Creator/Influencer", "Marketing Manager", "Publicist",
    "Social Media Manager", "Social Media/Content Editor", "Podcaster",
  ],
  "Film Criticism & Festivals": ["Film Critic", "Film Programmer"],
  Events: ["Event Producer", "Host/MC", "Panel Moderator"],
};

// Mediums copied verbatim from the same Jotform.
const MEDIUMS = [
  "Animation", "Art Installation", "Branded Content", "Ceramics/Pottery", "Choreography/Dance",
  "Comic", "Documentary", "Drawing/Illustration", "Fashion/Costume", "Feature Film",
  "Graphic Design", "Graphic Novel", "Live Performance", "Music", "Music Video", "Novel",
  "Painting", "Photography", "Sculpture", "Short Film", "Social Media Content", "Theater",
];

const PROJECT_TYPES = [
  "Narrative Fiction", "Documentary", "Commercial/Branded", "Music Video",
  "Short Form Digital", "Live Events", "Editorial/Print", "Animation",
];

const LANGUAGES = [
  "English", "Urdu", "Punjabi", "Sindhi", "Pashto", "Balochi",
  "Hindi", "Arabic", "Gujarati", "French", "Spanish",
];

const AVAILABILITY = [
  "Available now", "Available in 1–3 months", "Selectively available", "Not currently available",
];

const HOW_HEARD = [
  "Direct email from Aneesa Talks",
  "Social Media",
  "Word of Mouth/Referral",
  "Film Festival or Industry Event",
  "Other",
];

const CURRENCIES = ["USD", "PKR", "GBP", "EUR", "CAD", "AUD", "Other"];

const REFERRAL_TRIGGER = "Word of Mouth/Referral";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h2 className="font-heading font-bold text-lg text-brand-green border-b border-brand-green/15 pb-3 mb-5">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, required, children, hint }: { label: string; required?: boolean; children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-5">
      <label className="block text-sm text-brand-brown/70 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-brand-brown/40 mt-1">{hint}</p>}
    </div>
  );
}

const inputCls = "w-full bg-white border border-brand-green/20 rounded-lg px-4 py-2.5 text-brand-brown placeholder-brand-brown/40 focus:outline-none focus:border-brand-green text-sm";
const textareaCls = `${inputCls} resize-none`;

type Values = Record<string, string>;

function TextField({
  name, label, required, hint, type = "text", placeholder, values, update,
}: {
  name: string; label: string; required?: boolean; hint?: string; type?: string; placeholder?: string;
  values: Values; update: (name: string, value: string) => void;
}) {
  return (
    <Field label={label} required={required} hint={hint}>
      <input
        name={name}
        type={type}
        required={required}
        value={values[name] ?? ""}
        onChange={(e) => update(name, e.target.value)}
        className={inputCls}
        placeholder={placeholder}
      />
    </Field>
  );
}

function TextAreaField({
  name, label, required, hint, rows = 3, placeholder, values, update,
}: {
  name: string; label: string; required?: boolean; hint?: string; rows?: number; placeholder?: string;
  values: Values; update: (name: string, value: string) => void;
}) {
  return (
    <Field label={label} required={required} hint={hint}>
      <textarea
        name={name}
        required={required}
        rows={rows}
        value={values[name] ?? ""}
        onChange={(e) => update(name, e.target.value)}
        className={textareaCls}
        placeholder={placeholder}
      />
    </Field>
  );
}

function SelectField({
  name, label, required, hint, options, values, update, placeholder = "Select…",
}: {
  name: string; label: string; required?: boolean; hint?: string; options: readonly string[];
  values: Values; update: (name: string, value: string) => void; placeholder?: string;
}) {
  return (
    <Field label={label} required={required} hint={hint}>
      <select
        name={name}
        required={required}
        value={values[name] ?? ""}
        onChange={(e) => update(name, e.target.value)}
        className={inputCls}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </Field>
  );
}

function CheckboxGrid({
  name, options, selected, onToggle, columns = "sm:grid-cols-3",
}: {
  name: string; options: readonly string[]; selected: string[]; onToggle: (value: string) => void; columns?: string;
}) {
  return (
    <div className={`grid grid-cols-2 ${columns} gap-2`}>
      {options.map((opt) => (
        <label key={opt} className="flex items-center gap-2 text-sm text-brand-brown/80 cursor-pointer">
          <input
            type="checkbox"
            name={name}
            value={opt}
            checked={selected.includes(opt)}
            onChange={() => onToggle(opt)}
            className="accent-brand-green"
          />
          {opt}
        </label>
      ))}
    </div>
  );
}

function toggleValue(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

export default function EnrollForm() {
  const [state, formAction, pending] = useActionState<EnrollResult | null, FormData>(enrollAction, null);

  // Every field is controlled by local state (not derived from `state`), so
  // values survive a failed submission — useActionState resets *uncontrolled*
  // fields after any action runs, which was the cause of the client-reported
  // "submitting clears the whole form" bug.
  const [values, setValues] = useState<Values>({ rateCurrency: "USD", ratePublic: "no" });
  const update = (name: string, value: string) => setValues((v) => ({ ...v, [name]: value }));

  const [roles, setRoles] = useState<string[]>([]);
  const [mediums, setMediums] = useState<string[]>([]);
  const [preferredProjectTypes, setPreferredProjectTypes] = useState<string[]>([]);
  const [languagesCheck, setLanguagesCheck] = useState<string[]>([]);
  const [collaborationPreferences, setCollaborationPreferences] = useState<string[]>([]);
  const [consents, setConsents] = useState<boolean[]>(Array(6).fill(false));

  const bioWords = (values.bio ?? "").trim().split(/\s+/).filter(Boolean).length;

  return (
    <form action={formAction} className="space-y-0">
      {state && "error" in state && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2 mb-6">
          {state.error}
        </p>
      )}

      <Section title="Basic Information">
        <div className="grid grid-cols-2 gap-4">
          <TextField name="firstName" label="First Name" required values={values} update={update} />
          <TextField name="lastName" label="Last Name" required values={values} update={update} />
        </div>
        <SelectField
          name="pronouns"
          label="Pronouns"
          options={["She/Her", "He/Him", "They/Them", "She/They", "He/They", "Any"]}
          values={values}
          update={update}
        />
        <TextField name="email" label="Email Address" type="email" required values={values} update={update} />
        <TextField name="phone" label="Phone Number" type="tel" values={values} update={update} />
        <TextField
          name="address"
          label="Address"
          hint="City and country is fine; full address is optional. Kept private — never shown publicly."
          placeholder="e.g. Los Angeles, CA, USA"
          values={values}
          update={update}
        />
        <TextField
          name="location"
          label="Public Location"
          hint="Shown on your public profile, e.g. city/state only"
          placeholder="e.g. NJ/NYC"
          values={values}
          update={update}
        />
        <SelectField
          name="howHeard"
          label="How did you hear about PCC?"
          options={HOW_HEARD}
          values={values}
          update={update}
        />
        {values.howHeard === REFERRAL_TRIGGER && (
          <TextField
            name="referralName"
            label="Who referred you?"
            hint="Name of the member who invited you"
            values={values}
            update={update}
          />
        )}
        <TextField
          name="headshotLink"
          label="Professional Headshot Link"
          required
          hint="Google Drive, Dropbox, or direct image URL"
          placeholder="https://…"
          values={values}
          update={update}
        />
      </Section>

      <Section title="Bio & Background">
        <Field label="Professional Bio" required hint={`${bioWords} / 200 words max`}>
          <textarea
            name="bio"
            required
            rows={8}
            value={values.bio ?? ""}
            onChange={(e) => update("bio", e.target.value)}
            className={textareaCls}
            placeholder="Write your professional bio in third person…"
          />
        </Field>
        <TextAreaField name="pccGoals" label="What are you looking for from PCC?" rows={3} values={values} update={update} />
        <TextField name="previousCollaborators" label="Previous Collaborators" placeholder="Names of collaborators you've worked with" values={values} update={update} />
        <TextField name="unionMemberships" label="Union / Guild Memberships" placeholder="e.g. SAG-AFTRA, WGA, IATSE…" values={values} update={update} />
        <TextAreaField name="education" label="Education / Training" rows={2} values={values} update={update} />
        <TextAreaField name="additionalNotes" label="Additional Notes" rows={2} values={values} update={update} />
      </Section>

      <Section title="Professional Roles">
        <p className="text-xs text-brand-brown/50 mb-4">Select all that apply.</p>
        <div className="space-y-5">
          {Object.entries(ROLE_CATEGORIES).map(([category, opts]) => (
            <div key={category}>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-green/70 mb-2">{category}</p>
              <CheckboxGrid name="roles" options={opts} selected={roles} onToggle={(v) => setRoles((r) => toggleValue(r, v))} />
            </div>
          ))}
        </div>
        <TextField
          name="rolesOther"
          label="Other role(s) not listed"
          hint="Optional"
          values={values}
          update={update}
        />
      </Section>

      <Section title="Mediums">
        <CheckboxGrid name="mediums" options={MEDIUMS} selected={mediums} onToggle={(v) => setMediums((m) => toggleValue(m, v))} />
        <TextField
          name="mediumsOther"
          label="Other medium(s) not listed"
          hint="Optional"
          values={values}
          update={update}
        />
      </Section>

      <Section title="Experience & Portfolio">
        <SelectField name="experienceLevel" label="Experience Level" required options={EXPERIENCE_LEVELS} values={values} update={update} />
        <div className="grid grid-cols-2 gap-4">
          <TextField name="yearsExperience" label="Years of Professional Experience" type="number" values={values} update={update} />
          <TextField name="completedProjects" label="Completed Projects" type="number" values={values} update={update} />
        </div>
        <TextAreaField name="notableAchievements" label="Notable Achievements" rows={3} placeholder="Festival selections, awards, publications…" values={values} update={update} />
        <TextAreaField name="references" label="Professional References (3 preferred)" rows={3} placeholder="Name, relationship, contact info" values={values} update={update} />
        <TextField name="website" label="Website / Portfolio URL" type="url" required placeholder="https://…" values={values} update={update} />
        <div className="grid grid-cols-2 gap-4">
          <TextField name="imdb" label="IMDb" placeholder="IMDb URL or nm…" values={values} update={update} />
          <TextField name="instagram" label="Instagram" placeholder="@handle or URL" values={values} update={update} />
          <TextField name="linkedin" label="LinkedIn" placeholder="linkedin.com/in/…" values={values} update={update} />
          <TextField name="vimeo" label="Vimeo / YouTube" placeholder="vimeo.com/…" values={values} update={update} />
        </div>

        {[1, 2, 3].map((n) => (
          <div key={n} className="bg-brand-green/5 border border-brand-green/10 rounded-xl p-4 mb-3">
            <p className="text-xs text-brand-brown/50 uppercase tracking-wide mb-3">Work Sample {n}</p>
            <div className="grid grid-cols-2 gap-3">
              <TextField name={`ws${n}Title`} label="Title" values={values} update={update} />
              <TextField name={`ws${n}Medium`} label="Medium" placeholder="Short Film, Music Video…" values={values} update={update} />
              <TextField name={`ws${n}Year`} label="Year" placeholder="2024" values={values} update={update} />
              <TextField name={`ws${n}Role`} label="Your Role" values={values} update={update} />
            </div>
            <TextField name={`ws${n}Link`} label="Link" type="url" placeholder="https://…" values={values} update={update} />
          </div>
        ))}
      </Section>

      <Section title="Work for Hire">
        <SelectField
          name="rateStructure"
          label="Rate Structure"
          options={["Day rate", "Weekly rate", "Project rate", "Hourly", "Negotiable"]}
          values={values}
          update={update}
        />
        <Field label="Standard Rate Range" hint="e.g. 500–800/day or 5,000/project">
          <div className="grid grid-cols-[auto_1fr] gap-2">
            <select
              name="rateCurrency"
              value={values.rateCurrency ?? "USD"}
              onChange={(e) => update("rateCurrency", e.target.value)}
              className={`${inputCls} w-auto`}
            >
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input
              name="rateRangeAmount"
              value={values.rateRangeAmount ?? ""}
              onChange={(e) => update("rateRangeAmount", e.target.value)}
              className={inputCls}
            />
          </div>
        </Field>
        <Field label="Make rate visible to paid subscribers?">
          <select
            value={values.ratePublic === "yes" ? "Yes — show to paid subscribers" : "No — keep private"}
            onChange={(e) => update("ratePublic", e.target.value.startsWith("Yes") ? "yes" : "no")}
            className={inputCls}
          >
            <option>No — keep private</option>
            <option>Yes — show to paid subscribers</option>
          </select>
          <input type="hidden" name="ratePublic" value={values.ratePublic ?? "no"} />
        </Field>
        <SelectField name="availability" label="Current Availability" required options={AVAILABILITY} values={values} update={update} />
        <SelectField
          name="travel"
          label="Travel"
          options={[
            "Will travel/open to international work",
            "Domestic travel only",
            "Local only",
            "Remote work only",
          ]}
          values={values}
          update={update}
        />
        <Field label="Preferred Project Types">
          <CheckboxGrid
            name="preferredProjectTypes"
            options={PROJECT_TYPES}
            selected={preferredProjectTypes}
            onToggle={(v) => setPreferredProjectTypes((p) => toggleValue(p, v))}
            columns="sm:grid-cols-2"
          />
        </Field>
      </Section>

      <Section title="Skills & Languages">
        <Field label="Languages Spoken" hint="Select all that apply, or add others below">
          <CheckboxGrid
            name="languagesCheck"
            options={LANGUAGES}
            selected={languagesCheck}
            onToggle={(v) => setLanguagesCheck((l) => toggleValue(l, v))}
          />
          <input
            name="languages"
            value={values.languages ?? ""}
            onChange={(e) => update("languages", e.target.value)}
            className={`${inputCls} mt-3`}
            placeholder="Other languages (comma-separated)"
          />
        </Field>
        <TextAreaField name="specialSkills" label="Special Skills / Certifications" rows={2} values={values} update={update} />
        <TextAreaField name="equipment" label="Professional Equipment" rows={2} placeholder="List any owned professional equipment" values={values} update={update} />
      </Section>

      <Section title="Collaboration Preferences">
        <Field label="Preferred collaborator experience level(s)">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[...EXPERIENCE_LEVELS, "Any level"].map((l) => (
              <label key={l} className="flex items-center gap-2 text-sm text-brand-brown/80 cursor-pointer">
                <input
                  type="checkbox"
                  name="collaborationPreferences"
                  value={l}
                  checked={collaborationPreferences.includes(l)}
                  onChange={() => setCollaborationPreferences((c) => toggleValue(c, l))}
                  className="accent-brand-green"
                />
                {l}
              </label>
            ))}
          </div>
        </Field>
      </Section>

      <Section title="Consent & Verification">
        <div className="space-y-3">
          {[
            "I consent to my information being added to the PCC database.",
            "I understand that my contact information is kept private and routed through Aneesa Talks.",
            "The information I have provided is accurate to the best of my knowledge.",
            "I consent to Aneesa Talks verifying my credentials.",
            "I agree to notify PCC if my information changes significantly.",
            "I understand that PCC reserves the right to reject any application at their discretion.",
          ].map((text, i) => (
            <label key={i} className="flex items-start gap-3 text-sm text-brand-brown/80 cursor-pointer">
              <input
                type="checkbox"
                required
                name={`consent${i}`}
                checked={consents[i]}
                onChange={() => setConsents((c) => c.map((v, idx) => (idx === i ? !v : v)))}
                className="accent-brand-green mt-0.5 shrink-0"
              />
              <span>{text}</span>
            </label>
          ))}
        </div>
      </Section>

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-brand-green hover:bg-brand-green/90 disabled:opacity-50 text-brand-cream font-semibold py-4 rounded-full transition-colors text-base"
      >
        {pending ? "Submitting application…" : "Submit Application"}
      </button>
    </form>
  );
}
