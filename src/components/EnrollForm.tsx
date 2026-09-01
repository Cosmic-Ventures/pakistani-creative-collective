"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useActionState } from "react";
import { enrollAction, type EnrollResult } from "@/lib/enroll-action";
import { saveEnrollmentDraft, discardEnrollmentDraft } from "@/lib/enroll-draft-actions";
import { HeadshotUpload } from "@/components/HeadshotUpload";
import { EXPERIENCE_LEVELS, EXPERIENCE_TIERS } from "@/lib/experience-levels";
import {
  ROLE_CATEGORIES,
  ALL_ROLES,
  MEDIUMS,
  PROJECT_TYPES,
  LANGUAGES,
  HOW_HEARD,
  CURRENCIES,
  PRONOUNS,
  RATE_STRUCTURES,
  TRAVEL_OPTIONS,
  REFERRAL_TRIGGER,
} from "@/lib/enroll-constants";

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

/**
 * The red callout for the checkbox groups, which have no single input to outline
 * — roles, mediums and the consent list. Module scope, not a nested component:
 * a component declared inside EnrollForm is a new type on every render and
 * remounts everything under it (AGENTS.md gotcha #12).
 */
function FieldNotice({ id, message }: { id: string; message: string }) {
  return (
    <p
      id={id}
      className="scroll-mt-24 text-sm text-red-600 font-semibold bg-red-50 border border-red-500 rounded-lg px-3 py-2 mb-4"
    >
      {message}
    </p>
  );
}

/** DOM id for a field's wrapper, so the pre-submit summary can scroll to it. */
function anchorId(name: string): string {
  return `field-${name}`;
}

/**
 * `error` is what turns a field red. It's only ever passed once the applicant
 * has tried to submit (09/01 round: "the parts they need to revise ... be
 * highlighted in red so that they know what to revise before resubmitting"), and
 * it clears itself the moment the field is filled in correctly, because it's
 * derived during render rather than stored.
 *
 * `anchor` gives the field a DOM id so the summary above the submit button can
 * scroll straight to it.
 */
function Field({
  label, required, children, hint, dark, error, anchor,
}: {
  label: string; required?: boolean; children: React.ReactNode; hint?: string; dark?: boolean;
  error?: string; anchor?: string;
}) {
  return (
    <div className="mb-5 scroll-mt-24" id={anchor}>
      <label
        className={`block text-sm mb-1.5 ${
          error ? "text-red-600 font-semibold" : dark ? "text-brand-cream/80" : "text-black/70"
        }`}
      >
        {label}
        {required && <span className={error ? "text-red-600 ml-0.5" : "text-red-400 ml-0.5"}>*</span>}
      </label>
      {children}
      {error ? (
        <p className="text-xs mt-1 text-red-600 font-semibold">{error}</p>
      ) : (
        hint && <p className={`text-xs mt-1 ${dark ? "text-brand-cream/60" : "text-black/40"}`}>{hint}</p>
      )}
    </div>
  );
}

const inputCls = "w-full bg-white border border-brand-green/20 rounded-lg px-4 py-2.5 text-black placeholder-black/40 focus:outline-none focus:border-brand-green text-sm";
const textareaCls = `${inputCls} resize-none`;
// Spelled out in full rather than appended to `inputCls`: `border-red-500` and
// `border-brand-green/20` are the same Tailwind property, so which one wins
// depends on their order in the generated stylesheet, not in the attribute.
const inputErrorCls = "w-full bg-red-50 border border-red-500 ring-2 ring-red-500/20 rounded-lg px-4 py-2.5 text-black placeholder-black/40 focus:outline-none focus:border-red-600 text-sm";
const textareaErrorCls = `${inputErrorCls} resize-none`;

function inputClsFor(error?: string): string {
  return error ? inputErrorCls : inputCls;
}

type Values = Record<string, string>;

function TextField({
  name, label, required, hint, type = "text", placeholder, values, update, dark, error,
}: {
  name: string; label: string; required?: boolean; hint?: string; type?: string; placeholder?: string;
  values: Values; update: (name: string, value: string) => void; dark?: boolean; error?: string;
}) {
  return (
    <Field label={label} required={required} hint={hint} dark={dark} error={error} anchor={anchorId(name)}>
      <input
        name={name}
        type={type}
        value={values[name] ?? ""}
        onChange={(e) => update(name, e.target.value)}
        className={inputClsFor(error)}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
      />
    </Field>
  );
}

function TextAreaField({
  name, label, required, hint, rows = 3, placeholder, values, update, dark, error,
}: {
  name: string; label: string; required?: boolean; hint?: string; rows?: number; placeholder?: string;
  values: Values; update: (name: string, value: string) => void; dark?: boolean; error?: string;
}) {
  return (
    <Field label={label} required={required} hint={hint} dark={dark} error={error} anchor={anchorId(name)}>
      <textarea
        name={name}
        rows={rows}
        value={values[name] ?? ""}
        onChange={(e) => update(name, e.target.value)}
        className={error ? textareaErrorCls : textareaCls}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
      />
    </Field>
  );
}

function SelectField({
  name, label, required, hint, options, values, update, placeholder = "Select…", dark, error,
}: {
  name: string; label: string; required?: boolean; hint?: string; options: readonly string[];
  values: Values; update: (name: string, value: string) => void; placeholder?: string; dark?: boolean;
  error?: string;
}) {
  return (
    <Field label={label} required={required} hint={hint} dark={dark} error={error} anchor={anchorId(name)}>
      <select
        name={name}
        value={values[name] ?? ""}
        onChange={(e) => update(name, e.target.value)}
        className={inputClsFor(error)}
        aria-invalid={error ? true : undefined}
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

/**
 * Full five-tier breakdown, matching the landing page's "Five Experience Tiers"
 * section including each tier's criteria — the client asked for the same
 * breakdown here so applicants can self-assess without leaving the form
 * (08/08 round: "provide the full breakdown of each tier, as shown on the main
 * landing page").
 */
function TierReference() {
  return (
    <div className="mb-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      {EXPERIENCE_TIERS.map(({ name, years, projects, criteriaNote, criteria }) => (
        <div key={name} className="bg-brand-green/5 border border-brand-green/10 rounded-lg p-3 flex flex-col">
          <p className="font-semibold text-xs text-black">{name}</p>
          <p className="text-black/60 text-[11px] mt-0.5 mb-2">{years} · {projects}</p>
          {criteriaNote && (
            <p className="text-[10px] font-semibold uppercase tracking-wide text-black/50 mb-1">{criteriaNote}</p>
          )}
          <ul className="text-black/70 text-[11px] space-y-1 leading-snug">
            {criteria.map((c) => (
              <li key={c} className="flex gap-1">
                <span className="text-brand-green/50 shrink-0">•</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

const OTHER_OPTION = "Other";

/**
 * Checkbox dropdown for picking several values at once. Replaces the native
 * `<select multiple>` used for work-sample roles, which rendered as an
 * always-open scrolling list box — the client's "it should be a drop down
 * selection where you can choose multiple, not a page" (08/08 round).
 *
 * Selections are submitted as hidden inputs so the surrounding form's FormData
 * carries them exactly as a multi-value field would.
 */
function MultiSelectDropdown({
  name, options, selected, onToggle, placeholder, includeOther, otherValue, setOtherValue,
}: {
  name: string;
  options: readonly string[];
  selected: string[];
  // Takes the option to flip rather than the next array: the parent applies it
  // through a functional setState, so several boxes ticked in quick succession
  // can't each compute their next value from the same stale snapshot.
  onToggle: (option: string) => void;
  placeholder: string;
  includeOther?: boolean;
  otherValue?: string;
  setOtherValue?: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [otherChecked, setOtherChecked] = useState(Boolean(otherValue));
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const visible = query
    ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))
    : options;

  const summary = selected.length === 0
    ? placeholder
    : selected.length <= 2
    ? selected.join(", ")
    : `${selected.length} selected`;

  return (
    <div ref={containerRef} className="relative">
      {selected.map((v) => (
        <input key={v} type="hidden" name={name} value={v} />
      ))}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`${inputCls} text-left flex items-center justify-between gap-2`}
      >
        <span className={selected.length ? "text-black" : "text-black/40"}>{summary}</span>
        <span className="text-black/40 text-xs shrink-0">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-brand-green/20 rounded-lg shadow-lg max-h-72 overflow-auto">
          <div className="p-2 sticky top-0 bg-white border-b border-black/5">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter…"
              className="w-full bg-white border border-brand-green/15 rounded px-3 py-1.5 text-sm text-black placeholder-black/30 focus:outline-none focus:border-brand-green"
            />
          </div>
          <div className="p-2 space-y-1">
            {visible.map((opt) => (
              <label key={opt} className="flex items-center gap-2 text-sm text-black/80 cursor-pointer px-1 py-0.5 hover:bg-brand-green/5 rounded">
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={() => onToggle(opt)}
                  className="accent-brand-mint"
                />
                {opt}
              </label>
            ))}
            {visible.length === 0 && <p className="text-xs text-black/40 px-1 py-2">No matches.</p>}
            {includeOther && (
              <label className="flex items-center gap-2 text-sm text-black/80 cursor-pointer px-1 py-0.5 border-t border-black/5 mt-1 pt-2">
                <input
                  type="checkbox"
                  checked={otherChecked}
                  // Read the next value off the event rather than negating the
                  // captured one, so the updater stays pure and can't go stale.
                  onChange={(e) => {
                    const next = e.target.checked;
                    setOtherChecked(next);
                    if (!next) setOtherValue?.("");
                  }}
                  className="accent-brand-mint"
                />
                {OTHER_OPTION}
              </label>
            )}
          </div>
        </div>
      )}

      {includeOther && otherChecked && (
        <input
          value={otherValue ?? ""}
          onChange={(e) => setOtherValue?.(e.target.value)}
          className={`${inputCls} mt-2`}
          placeholder="Which role?"
        />
      )}
    </div>
  );
}

function HeadshotUploadField({
  values, update, error,
}: { values: Values; update: (name: string, value: string) => void; error?: string }) {
  return (
    <Field label="Professional Headshot" required hint="Image file, up to 8MB" error={error} anchor={anchorId("headshotLink")}>
      <HeadshotUpload
        name="headshotLink"
        value={values.headshotLink ?? ""}
        onChange={(dataUrl) => update("headshotLink", dataUrl)}
      />
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
    // dark: this sits inside the green Work for Hire card, where the default
    // black label/hint text was unreadable.
    <Field
      label="Current Availability"
      hint="Add one or more date ranges when you're available for work, starting any time from today onward"
      dark
    >
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
            <span className="text-brand-cream/70 text-sm">to</span>
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
                className="text-brand-cream/60 hover:text-red-300 text-sm px-2"
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
        className="mt-2 text-sm text-brand-mint font-semibold hover:text-brand-mint/80"
      >
        + Add another range
      </button>
      <input type="hidden" name="availability" value={summary} />
    </Field>
  );
}

/**
 * Everything still standing between the applicant and a successful submit.
 *
 * `label` is the one-line version listed in the summary above the submit button;
 * `message` is the longer sentence shown in red under the field itself; `field`
 * is the input's name, which doubles as its scroll anchor.
 */
type Problem = { step: number; field: string; label: string; message: string };

// Deliberately loose — this catches the typos an applicant actually makes
// ("sara@gmail", "sara.gmail.com"), and anything subtler is the server's Zod
// schema to reject. A stricter regex here would start rejecting valid addresses.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type EnrollFormProps = {
  initialDraft?: Record<string, unknown> | null;
  draftSavedAt?: string | null;
  canSaveProgress?: boolean;
};

type Snapshot = {
  values: Values;
  roles: string[];
  mediums: string[];
  preferredProjectTypes: string[];
  languagesCheck: string[];
  collaborationPreferences: string[];
  consents: boolean[];
  promoConsent: boolean;
  availabilityRanges: DateRange[];
  wsRoles: Record<string, string[]>;
  wsRoleOther: Record<string, string>;
};

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}
function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

export default function EnrollForm({
  initialDraft = null,
  draftSavedAt = null,
  canSaveProgress = false,
}: EnrollFormProps) {
  const [state, formAction, pending] = useActionState<EnrollResult | null, FormData>(enrollAction, null);

  const d = asRecord(initialDraft);
  const draftValues = asRecord(d.values) as Values;
  const draftRanges = Array.isArray(d.availabilityRanges)
    ? (d.availabilityRanges as DateRange[]).filter((r) => r && typeof r === "object")
    : null;

  // Every field is controlled by local state (not derived from `state`), so
  // values survive a failed submission — useActionState resets *uncontrolled*
  // fields after any action runs (AGENTS.md gotcha #6).
  const [values, setValues] = useState<Values>({ rateCurrency: "USD", ratePublic: "no", ...draftValues });
  const update = (name: string, value: string) => setValues((v) => ({ ...v, [name]: value }));

  const [roles, setRoles] = useState<string[]>(asStringArray(d.roles));
  const [mediums, setMediums] = useState<string[]>(asStringArray(d.mediums));
  const [preferredProjectTypes, setPreferredProjectTypes] = useState<string[]>(asStringArray(d.preferredProjectTypes));
  const [languagesCheck, setLanguagesCheck] = useState<string[]>(asStringArray(d.languagesCheck));
  const [collaborationPreferences, setCollaborationPreferences] = useState<string[]>(asStringArray(d.collaborationPreferences));
  const [consents, setConsents] = useState<boolean[]>(
    Array.isArray(d.consents) && d.consents.length === 6 ? (d.consents as boolean[]) : Array(6).fill(false)
  );
  const [promoConsent, setPromoConsent] = useState(Boolean(d.promoConsent));
  const [availabilityRanges, setAvailabilityRanges] = useState<DateRange[]>(
    draftRanges && draftRanges.length ? draftRanges : [{ start: "", end: "" }]
  );
  const [wsRoles, setWsRoles] = useState<Record<number, string[]>>({
    1: asStringArray(asRecord(d.wsRoles)["1"]),
    2: asStringArray(asRecord(d.wsRoles)["2"]),
    3: asStringArray(asRecord(d.wsRoles)["3"]),
  });
  const [wsRoleOther, setWsRoleOther] = useState<Record<number, string>>({
    1: String(asRecord(d.wsRoleOther)["1"] ?? ""),
    2: String(asRecord(d.wsRoleOther)["2"] ?? ""),
    3: String(asRecord(d.wsRoleOther)["3"] ?? ""),
  });

  const [step, setStep] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);
  const [showMissing, setShowMissing] = useState(false);

  const [savedAt, setSavedAt] = useState<string | null>(draftSavedAt);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  // Sanctioned "derive during render" pattern (AGENTS.md gotcha #6) rather than
  // a useEffect: surface a server-side error where the applicant can see it.
  if (state && "error" in state && state.error !== lastError) {
    setLastError(state.error);
    setShowMissing(true);
    setStep(0);
    // 09/01: the server rejected an application and the applicant saw nothing
    // happen at all. The banner was rendering the whole time — at the top of a
    // five-step form, while she was at the bottom of it on a phone. Jumping to
    // step 1 without moving the viewport is indistinguishable from a dead
    // button. Scroll it into view; whatever the server objected to, it has to
    // be on screen.
    if (typeof window !== "undefined") {
      requestAnimationFrame(() => {
        document.getElementById("enroll-server-error")?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      });
    }
  }

  const bioText = values.bio ?? "";
  const bioWords = bioText.trim().split(/\s+/).filter(Boolean).length;

  /**
   * Only genuinely essential fields block submission (08/08 round: "make sure
   * only essential fields are required ... regardless of experience"). Notably
   * NOT required: portfolio/website URL, availability, professional references,
   * and every work sample — an emerging creative may legitimately have none of
   * them yet.
   */
  const problems: Problem[] = [];
  const problem = (step: number, field: string, label: string, message: string) =>
    problems.push({ step, field, label, message });

  if (!values.firstName?.trim()) problem(0, "firstName", "First name", "First name is required.");
  if (!values.lastName?.trim()) problem(0, "lastName", "Last name", "Last name is required.");
  if (!values.email?.trim()) problem(0, "email", "Email address", "Email address is required.");
  else if (!EMAIL_RE.test(values.email.trim()))
    problem(0, "email", "Email address — check the format", "That doesn't look like an email address. It should read like name@example.com.");
  if (!values.headshotLink) problem(0, "headshotLink", "Professional headshot", "Upload a headshot before submitting.");
  if (bioText.trim().length < 100)
    problem(0, "bio", "Professional bio — at least 100 characters", `Your bio is ${bioText.trim().length} character${bioText.trim().length === 1 ? "" : "s"} long; it needs at least 100.`);
  else if (bioWords > 200)
    problem(0, "bio", "Professional bio — 200 words maximum", `Your bio is ${bioWords} words; please trim it to 200 or fewer.`);
  if (roles.length === 0 && !values.rolesOther?.trim())
    problem(1, "roles", "At least one professional role", "Tick at least one role, or type your own under \u201cOther role(s) not listed\u201d.");
  if (mediums.length === 0 && !values.mediumsOther?.trim())
    problem(1, "mediums", "At least one medium", "Tick at least one medium, or type your own under \u201cOther medium(s) not listed\u201d.");
  if (!values.experienceLevel) problem(2, "experienceLevel", "Experience level", "Choose the tier that best describes your experience.");
  if (consents.some((c) => !c)) problem(4, "consents", "All six consent checkboxes", "Please tick all six required consent boxes.");

  const canSubmit = problems.length === 0 && !pending;

  /**
   * Nothing turns red until submit has been attempted — a form that scolds you
   * about the last field while you're still typing in the first one is nagging,
   * not helping. After that the highlight is derived on every render, so it
   * clears itself the moment the applicant fixes the field.
   */
  const errorFor = (field: string): string | undefined =>
    showMissing ? problems.find((p) => p.field === field)?.message : undefined;
  const stepHasProblem = (index: number) => showMissing && problems.some((p) => p.step === index);

  function goToProblem(p: Problem) {
    setStep(p.step);
    setShowMissing(true);
    // The target step is revealed in this same commit, so wait a frame for it to
    // be laid out before scrolling — `hidden` elements have no position to
    // scroll to.
    requestAnimationFrame(() => {
      const el = document.getElementById(anchorId(p.field));
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.querySelector<HTMLElement>("input, textarea, select")?.focus({ preventScroll: true });
    });
  }

  function snapshot(): Snapshot {
    return {
      values,
      roles,
      mediums,
      preferredProjectTypes,
      languagesCheck,
      collaborationPreferences,
      consents,
      promoConsent,
      availabilityRanges,
      wsRoles: { "1": wsRoles[1], "2": wsRoles[2], "3": wsRoles[3] },
      wsRoleOther: { "1": wsRoleOther[1], "2": wsRoleOther[2], "3": wsRoleOther[3] },
    };
  }

  function handleSaveProgress() {
    setSaveMessage(null);
    startSaving(async () => {
      const result = await saveEnrollmentDraft(snapshot() as unknown as Record<string, unknown>);
      if (result.ok) {
        setSavedAt(result.savedAt);
        setSaveMessage("Progress saved — you can close this page and finish later.");
      } else {
        setSaveMessage(result.error);
      }
    });
  }

  function handleDiscardDraft() {
    startSaving(async () => {
      await discardEnrollmentDraft();
      setSavedAt(null);
      setSaveMessage("Saved draft discarded.");
    });
  }

  // Steps are always rendered and merely hidden when inactive. Unmounting the
  // inactive ones removed their inputs from the DOM, so the FormData built on
  // submit contained only the final step's fields and the action rejected every
  // application — the client's "I clicked submit and it wouldn't let me"
  // (08/08 round).
  //
  // This is a plain helper returning a className, not a nested <StepPanel>
  // component: a component declared inside EnrollForm would be a brand-new type
  // on every render, remounting the whole step subtree and wiping the local
  // state of everything inside it (open dropdowns, their "Other" checkboxes).
  const stepClass = (index: number) => (index === step ? "" : "hidden");

  return (
    <form action={formAction} className="bg-white rounded-3xl p-6 sm:p-10">
      {lastError && (
        <div
          id="enroll-server-error"
          role="alert"
          className="scroll-mt-24 text-sm text-red-700 bg-red-50 border border-red-500 rounded-lg px-4 py-3 mb-6"
        >
          <p className="font-semibold mb-0.5">Your application wasn&apos;t submitted</p>
          <p>{lastError}</p>
        </div>
      )}

      {savedAt && (
        <p className="text-sm text-brand-green bg-brand-mint/20 border border-brand-mint rounded-lg px-4 py-2 mb-6 flex flex-wrap items-center justify-between gap-2">
          <span>Draft restored — last saved {new Date(savedAt).toLocaleString()}.</span>
          <button
            type="button"
            onClick={handleDiscardDraft}
            className="text-xs font-semibold underline underline-offset-2 hover:no-underline"
          >
            Discard draft
          </button>
        </p>
      )}

      {/* Every step is reachable at any time so applicants can read ahead and
          review the criteria across the whole application (08/08 round). */}
      <ol className="flex flex-wrap gap-2 mb-8 text-xs font-semibold">
        {STEPS.map((label, i) => (
          <li key={label}>
            <button
              type="button"
              onClick={() => setStep(i)}
              className={`px-3 py-1.5 rounded-full transition-colors ${
                i === step
                  ? "bg-brand-green text-brand-cream"
                  : stepHasProblem(i)
                  ? "bg-red-50 text-red-700 border border-red-500 hover:bg-red-100"
                  : "bg-brand-mint/25 text-brand-green hover:bg-brand-mint/40"
              }`}
            >
              {i + 1}. {label}
              {stepHasProblem(i) && (
                <span className={i === step ? "ml-1.5 text-red-300" : "ml-1.5 text-red-600"}>&#9679;</span>
              )}
            </button>
          </li>
        ))}
      </ol>

      <div className={stepClass(0)}>
        <Section title="Personal / Basic Info">
          <div className="grid grid-cols-2 gap-4">
            <TextField name="firstName" label="First Name" required values={values} update={update} error={errorFor("firstName")} />
            <TextField name="lastName" label="Last Name" required values={values} update={update} error={errorFor("lastName")} />
          </div>
          <SelectField name="pronouns" label="Pronouns" options={PRONOUNS} values={values} update={update} />
          <TextField name="email" label="Email Address" type="email" required values={values} update={update} error={errorFor("email")} />
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
          <HeadshotUploadField values={values} update={update} error={errorFor("headshotLink")} />
        </Section>

        <Section title="Bio & Background">
          <Field
            label="Professional Bio"
            required
            hint={`${bioWords} / 200 words max — at least 100 characters (${bioText.trim().length} so far)`}
            error={errorFor("bio")}
            anchor={anchorId("bio")}
          >
            <textarea
              name="bio"
              rows={8}
              value={values.bio ?? ""}
              onChange={(e) => update("bio", e.target.value)}
              className={errorFor("bio") ? textareaErrorCls : textareaCls}
              placeholder="Write your professional bio in third person…"
              aria-invalid={errorFor("bio") ? true : undefined}
            />
          </Field>
          <TextAreaField name="pccGoals" label="What are you looking for from the PCC?" rows={3} values={values} update={update} />
          <TextField name="previousCollaborators" label="Previous Collaborators" placeholder="Names of collaborators you've worked with" values={values} update={update} />
          <TextField name="unionMemberships" label="Union / Guild Memberships" placeholder="e.g. SAG-AFTRA, WGA, IATSE…" values={values} update={update} />
          <TextAreaField name="education" label="Education / Training" rows={2} values={values} update={update} />
          <TextAreaField name="additionalNotes" label="Additional Notes" rows={2} values={values} update={update} />
        </Section>
      </div>

      <div className={stepClass(1)}>
        <Section title="Professional Roles">
          <p className="text-xs text-black/50 mb-4">Select all that apply.</p>
          {errorFor("roles") && <FieldNotice id={anchorId("roles")} message={errorFor("roles")!} />}
          <div className="space-y-5">
            {Object.entries(ROLE_CATEGORIES).map(([category, opts]) => (
              <div key={category}>
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-green/80 mb-2">{category}</p>
                <CheckboxGrid name="roles" options={opts} selected={roles} onToggle={(v) => setRoles((r) => toggleValue(r, v))} />
              </div>
            ))}
          </div>
          <div className="mt-6">
            <TextField name="rolesOther" label="Other role(s) not listed" hint="Optional" values={values} update={update} />
          </div>
        </Section>

        <Section title="Mediums">
          {errorFor("mediums") && <FieldNotice id={anchorId("mediums")} message={errorFor("mediums")!} />}
          <CheckboxGrid name="mediums" options={MEDIUMS} selected={mediums} onToggle={(v) => setMediums((m) => toggleValue(m, v))} />
          {/* Breathing room between the medium checkboxes and the free-text
              field below them, per the 08/08 round. */}
          <div className="mt-6">
            <TextField name="mediumsOther" label="Other medium(s) not listed" hint="Optional" values={values} update={update} />
          </div>
        </Section>
      </div>

      <div className={stepClass(2)}>
        <Section title="Experience & Portfolio">
          <p className="text-xs text-black/50 mb-3">Not sure which tier fits? Here&apos;s how the five levels break down:</p>
          <TierReference />
          <SelectField name="experienceLevel" label="Experience Level" required options={EXPERIENCE_LEVELS} values={values} update={update} error={errorFor("experienceLevel")} />
          <div className="grid grid-cols-2 gap-4">
            <TextField name="yearsExperience" label="Years of Professional Experience" type="number" values={values} update={update} />
            <TextField name="completedProjects" label="Completed Projects" type="number" values={values} update={update} />
          </div>
          <TextAreaField name="notableAchievements" label="Notable Achievements" rows={3} placeholder="Festival selections, awards, publications…" values={values} update={update} />
          <TextAreaField
            name="references"
            label="Professional References"
            rows={3}
            hint="Optional but recommended — three references help us verify your experience faster."
            placeholder="Name, relationship, contact info"
            values={values}
            update={update}
          />
          <TextField name="website" label="Website / Portfolio URL" type="url" placeholder="https://…" values={values} update={update} />
          <div className="grid grid-cols-2 gap-4">
            <TextField name="imdb" label="IMDb" placeholder="IMDb URL or nm…" values={values} update={update} />
            <TextField name="instagram" label="Instagram" placeholder="@handle or URL" values={values} update={update} />
            <TextField name="linkedin" label="LinkedIn" placeholder="linkedin.com/in/…" values={values} update={update} />
            <TextField name="vimeo" label="Vimeo / YouTube" placeholder="vimeo.com/…" values={values} update={update} />
          </div>

          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-brand-green/5 border border-brand-green/10 rounded-xl p-4 mb-3">
              <p className="text-xs text-black/50 uppercase tracking-wide mb-3">
                Work Sample {n}
                <span className="normal-case tracking-normal text-black/40"> (optional)</span>
              </p>
              <div className="grid grid-cols-2 gap-3">
                <TextField name={`ws${n}Title`} label="Title" values={values} update={update} />
                <SelectField name={`ws${n}Medium`} label="Medium" options={MEDIUMS} values={values} update={update} />
                <TextField name={`ws${n}Year`} label="Year" placeholder="2024" values={values} update={update} />
              </div>
              <Field label="Your Role(s)" hint="Choose as many as apply">
                <MultiSelectDropdown
                  name={`ws${n}RoleSelect`}
                  options={ALL_ROLES}
                  selected={wsRoles[n]}
                  onToggle={(opt) => setWsRoles((r) => ({ ...r, [n]: toggleValue(r[n], opt) }))}
                  placeholder="Select role(s)…"
                  includeOther
                  otherValue={wsRoleOther[n]}
                  setOtherValue={(v) => setWsRoleOther((r) => ({ ...r, [n]: v }))}
                />
                <input type="hidden" name={`ws${n}RoleOther`} value={wsRoleOther[n] ?? ""} />
              </Field>
              <TextField name={`ws${n}Link`} label="Link" type="url" placeholder="https://…" values={values} update={update} />
            </div>
          ))}
        </Section>

        {/* Work for Hire — deliberately an inverted block in the middle of the
            application so it reads as its own, clearly optional section, with
            its title and every label inside it in white (08/08 round). */}
        <div className="bg-brand-green rounded-2xl p-5 sm:p-7">
          <h2 className="font-heading font-bold text-lg text-brand-cream border-b border-brand-cream/20 pb-3 mb-5">
            Work for Hire
          </h2>
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
      </div>

      <div className={stepClass(3)}>
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
      </div>

      <div className={stepClass(4)}>
        <Section title="Review & Submit">
          <p className="text-sm text-black/60 mb-5">
            Please confirm the following before submitting your application.
          </p>
          {errorFor("consents") && <FieldNotice id={anchorId("consents")} message={errorFor("consents")!} />}
          <div className="space-y-3">
            {[
              "I consent to my information being added to the PCC database.",
              "I understand that my contact information is kept private and routed through Aneesa Talks.",
              "The information I have provided is accurate to the best of my knowledge.",
              "I consent to Aneesa Talks verifying my credentials.",
              "I agree to notify the PCC if my information changes significantly.",
              "I understand that the PCC reserves the right to reject any application at their discretion.",
            ].map((text, i) => (
              <label
                key={i}
                className={`flex items-start gap-3 text-sm cursor-pointer ${
                  errorFor("consents") && !consents[i] ? "text-red-600 font-semibold" : "text-black/80"
                }`}
              >
                <input
                  type="checkbox"
                  name={`consent${i}`}
                  checked={consents[i]}
                  onChange={() => setConsents((c) => c.map((v, idx) => (idx === i ? !v : v)))}
                  className={`mt-0.5 shrink-0 ${
                    errorFor("consents") && !consents[i]
                      ? "accent-red-600 outline outline-2 outline-offset-2 outline-red-500"
                      : "accent-brand-green"
                  }`}
                />
                <span>
                  {text}
                  <span className="text-red-500 ml-0.5">*</span>
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
      </div>

      {/* Outstanding required fields, with a jump link to wherever each one
          lives — so a blocked submit says exactly what's missing and where,
          instead of failing with a single server-side message. */}
      {showMissing && problems.length > 0 && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-500 rounded-lg px-4 py-3 mb-6">
          <p className="font-semibold mb-1.5">
            Your application wasn&apos;t submitted yet — {problems.length}{" "}
            {problems.length === 1 ? "item needs" : "items need"} your attention. Each one is
            highlighted in red on its step:
          </p>
          <ul className="space-y-1">
            {problems.map((m) => (
              <li key={m.field + m.label}>
                <button
                  type="button"
                  onClick={() => goToProblem(m)}
                  className="underline underline-offset-2 hover:no-underline text-left"
                >
                  {m.label} <span className="text-red-500">— step {m.step + 1}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 mt-10 pt-6 border-t border-black/10">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="text-black/60 hover:text-black disabled:opacity-0 disabled:pointer-events-none font-semibold text-sm px-4 py-2.5"
        >
          ← Back
        </button>

        <div className="flex items-center gap-3 ml-auto">
          {canSaveProgress ? (
            <button
              type="button"
              onClick={handleSaveProgress}
              disabled={saving}
              className="text-sm font-semibold text-brand-green border border-brand-green/30 hover:bg-brand-green/5 disabled:opacity-50 px-5 py-2.5 rounded-full transition-colors"
            >
              {saving ? "Saving…" : "Save progress"}
            </button>
          ) : (
            <a
              href="/auth/signin?next=/enroll"
              className="text-sm text-black/50 hover:text-black underline underline-offset-2"
            >
              Sign in to save your progress
            </a>
          )}

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
              className="bg-brand-green hover:bg-brand-green/90 text-brand-cream font-semibold px-8 py-3 rounded-full transition-colors text-sm"
            >
              Next →
            </button>
          ) : (
            <button
              type="submit"
              disabled={pending}
              onClick={(e) => {
                if (!canSubmit) {
                  e.preventDefault();
                  setShowMissing(true);
                  // Take them straight to the first thing that needs fixing
                  // rather than leaving them on the review step wondering which
                  // of the five it was on.
                  if (problems.length > 0) goToProblem(problems[0]);
                }
              }}
              className="bg-brand-green hover:bg-brand-green/90 disabled:opacity-50 text-brand-cream font-semibold px-8 py-3 rounded-full transition-colors text-sm"
            >
              {pending ? "Submitting application…" : "Submit Application"}
            </button>
          )}
        </div>
      </div>

      {saveMessage && (
        <p className="text-sm text-brand-green mt-4 text-right">{saveMessage}</p>
      )}
    </form>
  );
}
