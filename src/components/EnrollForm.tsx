"use client";

import { useState } from "react";
import Image from "next/image";
import { useActionState } from "react";
import { enrollAction, type EnrollResult } from "@/lib/enroll-action";
import { EXPERIENCE_LEVELS, EXPERIENCE_TIERS } from "@/lib/experience-levels";

// Categories and roles copied verbatim from the PCC enrollment Jotform
// (jotform.com/form/253118193860054), then reorganized per the client's
// 7/23 revision round (category renames/moves) and alphabetized within
// each category and across category names, per that same round's
// "all option lists must be alphabetical" instruction.
const ROLE_CATEGORIES: Record<string, string[]> = {
  "Art & Digital Design": ["Animator", "Artist", "Curator", "Graphic Designer", "Illustrator"],
  Camera: [
    "1st Assistant Camera (1st AC/Focus Puller)", "2nd Assistant Camera (2nd AC/Clapper Loader)",
    "Camera Operator", "Digital Imaging Technician (DIT)", "Director of Photography (DP/Cinematographer)",
    "Photographer", "Still Photographer/BTS",
  ],
  "Casting & Talent": [
    "Actor", "Casting Assistant", "Casting Director", "Choreographer", "Comedian",
    "Dancer", "Model", "Talent Agent", "Voice Actor/Voice-Over Artist",
  ],
  Directing: ["1st Assistant Director", "2nd Assistant Director", "Director", "Script Supervisor"],
  "Editing & Post-Production": ["Assistant Editor", "Colorist", "Editor", "Motion Graphics Designer", "Visual Effects (VFX) Artist"],
  Events: ["Event Producer", "Host/MC", "Panel Moderator"],
  "Film Criticism & Festivals": ["Film Critic", "Film Programmer", "Story Analyst/Reader"],
  "Lighting & Grip": ["Best Boy", "Gaffer (Chief Lighting Technician)", "Grip", "Key Grip", "Lighting Technician"],
  "Marketing, Publicity, & Media": [
    "Content Creator/Influencer", "Marketing Manager", "Podcaster",
    "Publicist", "Social Media Manager", "Social Media/Content Editor",
  ],
  Music: ["Composer", "DJ", "Music Producer", "Musician", "Singer", "Songwriter"],
  Producing: [
    "Associate Producer", "Co-Producer", "Creative Producer", "Executive Producer",
    "Line Producer", "Post-Production Supervisor", "Producer", "Production Coordinator",
    "Showrunner", "Unit Production Manager (UPM)",
  ],
  "Production Design": ["Art Director", "Production Designer", "Props Master", "Set Designer", "Storyboard Artist"],
  Sound: ["Boom Operator", "Foley Artist", "Sound Designer", "Sound Editor/Mixer", "Sound Recordist/Production Sound Mixer"],
  Styling: ["Costume Designer", "Fashion Designer", "Hair Stylist", "Key Costumer", "Makeup Artist", "Special Effects Makeup Artist", "Wardrobe Supervisor"],
  Writing: ["Journalist", "Script Consultant", "Screenwriter", "Writer (Narrative Fiction)"],
};

const ALL_ROLES = Array.from(new Set(Object.values(ROLE_CATEGORIES).flat())).sort();

// Mediums copied from the same Jotform, revised + alphabetized per the 7/23 round.
const MEDIUMS = [
  "Animation", "Art", "Branded Content", "Ceramics/Pottery", "Choreography/Dance",
  "Documentary", "Fashion/Costume", "Feature Film", "Graphic Novel", "Live Performance",
  "Magazine", "Music", "Music Video", "News", "Novel", "Photography", "Sculpture",
  "Short Film", "Social Media Content", "Stand-Up Comedy", "Television", "Theatre", "Vertical Series",
];

const PROJECT_TYPES = [
  "Animation", "Commercial/Branded", "Documentary", "Editorial/Print",
  "Live Events", "Music Video", "Narrative Fiction", "Short Form Digital",
];

const LANGUAGES = [
  "Arabic", "Balochi", "English", "French", "Gujarati", "Hindi",
  "Pashto", "Punjabi", "Sindhi", "Spanish", "Urdu",
];

const HOW_HEARD = [
  "Direct email from Aneesa Talks",
  "Film Festival or Industry Event",
  "Social Media",
  "Word of Mouth/Referral",
  "Other",
];

const CURRENCIES = ["AUD", "CAD", "EUR", "GBP", "PKR", "USD", "Other"];

const PRONOUNS = ["He/Him", "He/They", "She/Her", "She/They", "They/Them", "Any"];

const RATE_STRUCTURES = ["Day rate", "Hourly", "Negotiable", "Project rate", "Weekly rate"];

const TRAVEL_OPTIONS = [
  "Domestic travel only", "Local only", "Remote work only", "Will travel/open to international work",
];

const REFERRAL_TRIGGER = "Word of Mouth/Referral";

const MAX_HEADSHOT_BYTES = 8 * 1024 * 1024;

const STEPS = [
  "Personal / Basic Info",
  "Skills & Experience",
  "Work Samples / Portfolio",
  "Additional Questions",
  "Review & Submit",
];

function Section({ title, children, dark }: { title: string; children: React.ReactNode; dark?: boolean }) {
  return (
    <div className="mb-10 last:mb-0">
      <h2
        className={`font-heading font-bold text-lg border-b pb-3 mb-5 ${
          dark ? "text-brand-cream border-brand-cream/20" : "text-black border-black/10"
        }`}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({
  label, required, children, hint, dark,
}: { label: string; required?: boolean; children: React.ReactNode; hint?: string; dark?: boolean }) {
  return (
    <div className="mb-5">
      <label className={`block text-sm mb-1.5 ${dark ? "text-brand-cream/80" : "text-black/70"}`}>
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className={`text-xs mt-1 ${dark ? "text-brand-cream/50" : "text-black/40"}`}>{hint}</p>}
    </div>
  );
}

const inputCls = "w-full bg-white border border-brand-green/20 rounded-lg px-4 py-2.5 text-black placeholder-black/40 focus:outline-none focus:border-brand-green text-sm";
const textareaCls = `${inputCls} resize-none`;

type Values = Record<string, string>;

function TextField({
  name, label, required, hint, type = "text", placeholder, values, update, dark,
}: {
  name: string; label: string; required?: boolean; hint?: string; type?: string; placeholder?: string;
  values: Values; update: (name: string, value: string) => void; dark?: boolean;
}) {
  return (
    <Field label={label} required={required} hint={hint} dark={dark}>
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
  name, label, required, hint, rows = 3, placeholder, values, update, dark,
}: {
  name: string; label: string; required?: boolean; hint?: string; rows?: number; placeholder?: string;
  values: Values; update: (name: string, value: string) => void; dark?: boolean;
}) {
  return (
    <Field label={label} required={required} hint={hint} dark={dark}>
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
  name, label, required, hint, options, values, update, placeholder = "Select…", dark,
}: {
  name: string; label: string; required?: boolean; hint?: string; options: readonly string[];
  values: Values; update: (name: string, value: string) => void; placeholder?: string; dark?: boolean;
}) {
  return (
    <Field label={label} required={required} hint={hint} dark={dark}>
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
  name, options, selected, onToggle, columns = "sm:grid-cols-3", dark,
}: {
  name: string; options: readonly string[]; selected: string[]; onToggle: (value: string) => void; columns?: string; dark?: boolean;
}) {
  return (
    <div className={`grid grid-cols-2 ${columns} gap-2`}>
      {options.map((opt) => (
        <label key={opt} className={`flex items-center gap-2 text-sm cursor-pointer ${dark ? "text-brand-cream/90" : "text-black/80"}`}>
          <input
            type="checkbox"
            name={name}
            value={opt}
            checked={selected.includes(opt)}
            onChange={() => onToggle(opt)}
            className="accent-brand-mint"
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

function TierReference() {
  return (
    <div className="mb-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      {EXPERIENCE_TIERS.map(({ name, years, projects }) => (
        <div key={name} className="bg-brand-green/5 border border-brand-green/10 rounded-lg p-3">
          <p className="font-semibold text-xs text-black">{name}</p>
          <p className="text-black/60 text-[11px] mt-0.5">{years} · {projects}</p>
        </div>
      ))}
    </div>
  );
}

function HeadshotUploadField({ values, update }: { values: Values; update: (name: string, value: string) => void }) {
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  function handleFile(file: File | undefined) {
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
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => update("headshotLink", reader.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <Field label="Professional Headshot" required hint="Image file, up to 8MB">
      <input
        type="file"
        accept="image/*"
        required={!values.headshotLink}
        onChange={(e) => handleFile(e.target.files?.[0])}
        className="w-full text-sm text-black/70 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-brand-green file:text-brand-cream file:text-sm file:font-semibold file:cursor-pointer cursor-pointer"
      />
      <input type="hidden" name="headshotLink" value={values.headshotLink ?? ""} />
      {fileName && !error && (
        <p className="text-xs text-black/50 mt-1.5">Selected: {fileName}</p>
      )}
      {values.headshotLink && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={values.headshotLink} alt="Headshot preview" className="w-16 h-16 rounded-xl object-cover mt-2" />
      )}
      {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
    </Field>
  );
}

type DateRange = { start: string; end: string };

function AvailabilityRanges({
  ranges, setRanges,
}: { ranges: DateRange[]; setRanges: (r: DateRange[]) => void }) {
  const today = new Date().toISOString().slice(0, 10);

  function formatDate(iso: string): string {
    if (!iso) return "";
    return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  const summary = ranges
    .filter((r) => r.start && r.end)
    .map((r) => `${formatDate(r.start)} – ${formatDate(r.end)}`)
    .join("; ");

  return (
    <Field label="Current Availability" required hint="Add one or more date ranges when you're available for work, starting any time from today onward">
      <div className="space-y-2">
        {ranges.map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="date"
              min={today}
              value={r.start}
              onChange={(e) => {
                const next = [...ranges];
                next[i] = { ...next[i], start: e.target.value };
                setRanges(next);
              }}
              className={`${inputCls} w-auto`}
            />
            <span className="text-black/40 text-sm">to</span>
            <input
              type="date"
              min={r.start || today}
              value={r.end}
              onChange={(e) => {
                const next = [...ranges];
                next[i] = { ...next[i], end: e.target.value };
                setRanges(next);
              }}
              className={`${inputCls} w-auto`}
            />
            {ranges.length > 1 && (
              <button
                type="button"
                onClick={() => setRanges(ranges.filter((_, idx) => idx !== i))}
                className="text-black/40 hover:text-red-500 text-sm px-2"
                aria-label="Remove date range"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setRanges([...ranges, { start: "", end: "" }])}
        className="mt-2 text-sm text-brand-green font-semibold hover:text-brand-green/70"
      >
        + Add another range
      </button>
      <input type="hidden" name="availability" value={summary} required />
    </Field>
  );
}

function WorkSampleRoleField({
  n, selected, onToggle, other, setOther,
}: { n: number; selected: string[]; onToggle: (v: string) => void; other: string; setOther: (v: string) => void }) {
  return (
    <Field label="Your Role(s)" hint="Hold Cmd/Ctrl to select multiple">
      <select
        multiple
        size={4}
        name={`ws${n}RoleSelect`}
        value={selected}
        onChange={(e) => {
          const opts = Array.from(e.target.selectedOptions).map((o) => o.value);
          onToggle(opts.join(" "));
        }}
        className={inputCls}
      >
        {ALL_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
      </select>
      <input
        value={other}
        onChange={(e) => setOther(e.target.value)}
        name={`ws${n}RoleOther`}
        className={`${inputCls} mt-2`}
        placeholder="Other role not listed (optional)"
      />
    </Field>
  );
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
  const [promoConsent, setPromoConsent] = useState(false);
  const [availabilityRanges, setAvailabilityRanges] = useState<DateRange[]>([{ start: "", end: "" }]);
  const [wsRoles, setWsRoles] = useState<Record<number, string[]>>({ 1: [], 2: [], 3: [] });
  const [wsRoleOther, setWsRoleOther] = useState<Record<number, string>>({ 1: "", 2: "", 3: "" });

  const [step, setStep] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);

  // Sanctioned "derive during render" pattern (AGENTS.md gotcha #6) rather than
  // a useEffect: jump back to the first step so the error is visible in context.
  if (state && "error" in state && state.error !== lastError) {
    setLastError(state.error);
    setStep(0);
  }

  const bioWords = (values.bio ?? "").trim().split(/\s+/).filter(Boolean).length;

  function stepIsValid(i: number): boolean {
    if (i === 0) {
      return Boolean(values.firstName && values.lastName && values.email && values.headshotLink && values.bio);
    }
    if (i === 1) {
      return roles.length > 0 && mediums.length > 0;
    }
    if (i === 2) {
      return Boolean(values.experienceLevel && values.website && availabilityRanges.some((r) => r.start && r.end));
    }
    return true;
  }

  const canAdvance = stepIsValid(step);

  return (
    <form action={formAction} className="bg-white rounded-3xl p-6 sm:p-10">
      {lastError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2 mb-6">
          {lastError}
        </p>
      )}

      <ol className="flex flex-wrap gap-2 mb-8 text-xs font-semibold">
        {STEPS.map((label, i) => (
          <li key={label}>
            <button
              type="button"
              onClick={() => setStep(i)}
              disabled={i > step && !stepIsValid(step)}
              className={`px-3 py-1.5 rounded-full transition-colors ${
                i === step
                  ? "bg-brand-green text-brand-cream"
                  : i < step
                  ? "bg-brand-mint/30 text-brand-green"
                  : "bg-black/5 text-black/40"
              }`}
            >
              {i + 1}. {label}
            </button>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <>
          <Section title="Personal / Basic Info">
            <div className="grid grid-cols-2 gap-4">
              <TextField name="firstName" label="First Name" required values={values} update={update} />
              <TextField name="lastName" label="Last Name" required values={values} update={update} />
            </div>
            <SelectField name="pronouns" label="Pronouns" options={PRONOUNS} values={values} update={update} />
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
            <SelectField name="howHeard" label="How did you hear about the PCC?" options={HOW_HEARD} values={values} update={update} />
            {values.howHeard === REFERRAL_TRIGGER && (
              <TextField
                name="referralName"
                label="Who referred you?"
                hint="Name of the member who invited you"
                values={values}
                update={update}
              />
            )}
            <HeadshotUploadField values={values} update={update} />
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
            <TextAreaField name="pccGoals" label="What are you looking for from the PCC?" rows={3} values={values} update={update} />
            <TextField name="previousCollaborators" label="Previous Collaborators" placeholder="Names of collaborators you've worked with" values={values} update={update} />
            <TextField name="unionMemberships" label="Union / Guild Memberships" placeholder="e.g. SAG-AFTRA, WGA, IATSE…" values={values} update={update} />
            <TextAreaField name="education" label="Education / Training" rows={2} values={values} update={update} />
            <TextAreaField name="additionalNotes" label="Additional Notes" rows={2} values={values} update={update} />
          </Section>
        </>
      )}

      {step === 1 && (
        <>
          <Section title="Professional Roles">
            <p className="text-xs text-black/50 mb-4">Select all that apply.</p>
            <div className="space-y-5">
              {Object.entries(ROLE_CATEGORIES).map(([category, opts]) => (
                <div key={category}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-green/80 mb-2">{category}</p>
                  <CheckboxGrid name="roles" options={opts} selected={roles} onToggle={(v) => setRoles((r) => toggleValue(r, v))} />
                </div>
              ))}
            </div>
            <div className="mt-4">
              <TextField name="rolesOther" label="Other role(s) not listed" hint="Optional" values={values} update={update} />
            </div>
          </Section>

          <Section title="Mediums">
            <CheckboxGrid name="mediums" options={MEDIUMS} selected={mediums} onToggle={(v) => setMediums((m) => toggleValue(m, v))} />
            <TextField name="mediumsOther" label="Other medium(s) not listed" hint="Optional" values={values} update={update} />
          </Section>
        </>
      )}

      {step === 2 && (
        <>
          <Section title="Experience & Portfolio">
            <p className="text-xs text-black/50 mb-3">Not sure which tier fits? Here's how the five levels break down:</p>
            <TierReference />
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
                <p className="text-xs text-black/50 uppercase tracking-wide mb-3">Work Sample {n}</p>
                <div className="grid grid-cols-2 gap-3">
                  <TextField name={`ws${n}Title`} label="Title" values={values} update={update} />
                  <SelectField name={`ws${n}Medium`} label="Medium" options={MEDIUMS} values={values} update={update} />
                  <TextField name={`ws${n}Year`} label="Year" placeholder="2024" values={values} update={update} />
                </div>
                <WorkSampleRoleField
                  n={n}
                  selected={wsRoles[n]}
                  onToggle={(joined) => setWsRoles((r) => ({ ...r, [n]: joined ? joined.split(" ") : [] }))}
                  other={wsRoleOther[n]}
                  setOther={(v) => setWsRoleOther((r) => ({ ...r, [n]: v }))}
                />
                <TextField name={`ws${n}Link`} label="Link" type="url" placeholder="https://…" values={values} update={update} />
              </div>
            ))}
          </Section>

          <Section title="Work" dark>
            <div className="bg-brand-green text-brand-cream rounded-2xl p-5 sm:p-6 -mx-1">
              <p className="text-sm text-brand-cream/80 mb-5 leading-relaxed">
                This section is optional and only applies if you&apos;re open to paid freelance or
                work-for-hire opportunities. Sharing your rate range and availability helps paid
                members find and reach out to the right collaborators — you choose whether this
                information is visible to them.
              </p>
              <SelectField name="rateStructure" label="Rate Structure" options={RATE_STRUCTURES} values={values} update={update} dark />
              <Field label="Standard Rate Range" hint="e.g. 500–800/day or 5,000/project" dark>
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
              <Field label="Make rate visible to paid subscribers?" dark>
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
              <AvailabilityRanges ranges={availabilityRanges} setRanges={setAvailabilityRanges} />
              <SelectField name="travel" label="Travel" options={TRAVEL_OPTIONS} values={values} update={update} dark />
              <Field label="Preferred Project Types" dark>
                <CheckboxGrid
                  name="preferredProjectTypes"
                  options={PROJECT_TYPES}
                  selected={preferredProjectTypes}
                  onToggle={(v) => setPreferredProjectTypes((p) => toggleValue(p, v))}
                  columns="sm:grid-cols-2"
                  dark
                />
              </Field>
            </div>
          </Section>
        </>
      )}

      {step === 3 && (
        <>
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
                  <label key={l} className="flex items-center gap-2 text-sm text-black/80 cursor-pointer">
                    <input
                      type="checkbox"
                      name="collaborationPreferences"
                      value={l}
                      checked={collaborationPreferences.includes(l)}
                      onChange={() => setCollaborationPreferences((c) => toggleValue(c, l))}
                      className="accent-brand-mint"
                    />
                    {l}
                  </label>
                ))}
              </div>
            </Field>
          </Section>
        </>
      )}

      {step === 4 && (
        <Section title="Review & Submit">
          <p className="text-sm text-black/60 mb-5">
            Please confirm the following before submitting your application.
          </p>
          <div className="space-y-3">
            {[
              "I consent to my information being added to the PCC database.",
              "I understand that my contact information is kept private and routed through Aneesa Talks.",
              "The information I have provided is accurate to the best of my knowledge.",
              "I consent to Aneesa Talks verifying my credentials.",
              "I agree to notify the PCC if my information changes significantly.",
              "I understand that the PCC reserves the right to reject any application at their discretion.",
            ].map((text, i) => (
              <label key={i} className="flex items-start gap-3 text-sm text-black/80 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  name={`consent${i}`}
                  checked={consents[i]}
                  onChange={() => setConsents((c) => c.map((v, idx) => (idx === i ? !v : v)))}
                  className="accent-brand-green mt-0.5 shrink-0"
                />
                <span>
                  {text}
                  <span className="text-red-400 ml-0.5">*</span>
                </span>
              </label>
            ))}
            <label className="flex items-start gap-3 text-sm text-black/80 cursor-pointer pt-2 border-t border-black/10">
              <input
                type="checkbox"
                name="consentPromo"
                checked={promoConsent}
                onChange={() => setPromoConsent((v) => !v)}
                className="accent-brand-green mt-0.5 shrink-0"
              />
              <span>
                I authorize the PCC to use my profile materials to promote the PCC public launch
                across its social media platforms.
                <span className="text-black/40 ml-1">(Optional)</span>
              </span>
            </label>
          </div>
        </Section>
      )}

      <div className="flex items-center justify-between mt-10 pt-6 border-t border-black/10">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="text-black/60 hover:text-black disabled:opacity-0 disabled:pointer-events-none font-semibold text-sm px-4 py-2.5"
        >
          ← Back
        </button>

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => canAdvance && setStep((s) => Math.min(STEPS.length - 1, s + 1))}
            disabled={!canAdvance}
            className="bg-brand-green hover:bg-brand-green/90 disabled:opacity-50 text-brand-cream font-semibold px-8 py-3 rounded-full transition-colors text-sm"
          >
            Next →
          </button>
        ) : (
          <button
            type="submit"
            disabled={pending}
            className="bg-brand-green hover:bg-brand-green/90 disabled:opacity-50 text-brand-cream font-semibold px-8 py-3 rounded-full transition-colors text-sm"
          >
            {pending ? "Submitting application…" : "Submit Application"}
          </button>
        )}
      </div>
    </form>
  );
}
