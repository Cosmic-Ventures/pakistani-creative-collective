"use client";

import { useActionState } from "react";
import { enrollAction, type EnrollResult } from "@/lib/enroll-action";

const ROLES = [
  "Director", "Writer", "Producer", "Director of Photography", "Camera Operator",
  "Gaffer/Lighting", "Grip", "Sound Mixer", "Boom Operator", "Sound Designer",
  "Film Editor", "Colorist", "VFX Artist", "Composer", "Musician", "Singer",
  "Production Designer", "Art Director", "Set Decorator", "Costume Designer",
  "Hair & Makeup", "Stylist", "Casting Director", "Actor/Talent",
  "Graphic Designer", "Illustrator", "Animator", "Photographer",
  "Marketing", "Publicist", "Social Media Manager", "Journalist", "Film Critic",
  "Festival Programmer", "Event Producer",
];

const MEDIUMS = [
  "Short Film", "Feature Film", "Documentary", "Music Video", "Animation",
  "Photography", "Theater", "Television/Streaming", "Web Series", "Podcast",
  "Books/Publishing", "Social Media Content",
];

const PROJECT_TYPES = [
  "Narrative Fiction", "Documentary", "Commercial/Branded", "Music Video",
  "Short Form Digital", "Live Events", "Editorial/Print", "Animation",
];

const EXPERIENCE_LEVELS = [
  "Emerging (0–2 years)",
  "Developing (2–5 years)",
  "Established (5–8 years)",
  "Accomplished (8–12 years)",
  "Veteran / Master (12+ years)",
];

const LANGUAGES = [
  "English", "Urdu", "Punjabi", "Sindhi", "Pashto", "Balochi",
  "Hindi", "Arabic", "French", "Spanish",
];

const AVAILABILITY = [
  "Available now", "Available in 1–3 months", "Selectively available", "Not currently available",
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h2 className="font-heading font-extrabold uppercase text-lg text-brand-green border-b border-brand-green/15 pb-3 mb-5">{title}</h2>
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

export default function EnrollForm() {
  const [state, formAction, pending] = useActionState<EnrollResult | null, FormData>(enrollAction, null);

  return (
    <form action={formAction} className="space-y-0">
      {state && "error" in state && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2 mb-6">
          {state.error}
        </p>
      )}

      <Section title="Basic Information">
        <div className="grid grid-cols-2 gap-4">
          <Field label="First Name" required>
            <input name="firstName" required className={inputCls} />
          </Field>
          <Field label="Last Name" required>
            <input name="lastName" required className={inputCls} />
          </Field>
        </div>
        <Field label="Pronouns">
          <select name="pronouns" className={inputCls}>
            <option value="">Select…</option>
            <option>She/Her</option><option>He/Him</option><option>They/Them</option>
            <option>She/They</option><option>He/They</option><option>Any</option>
          </select>
        </Field>
        <Field label="Email Address" required>
          <input name="email" type="email" required className={inputCls} />
        </Field>
        <Field label="Phone Number">
          <input name="phone" type="tel" className={inputCls} />
        </Field>
        <Field label="Address" hint="City and country is fine; full address is optional. Kept private — never shown publicly.">
          <input name="address" className={inputCls} placeholder="e.g. Los Angeles, CA, USA" />
        </Field>
        <Field label="Public Location" hint="Shown on your public profile, e.g. city/state only">
          <input name="location" className={inputCls} placeholder="e.g. NJ/NYC" />
        </Field>
        <Field label="How did you hear about PCC?">
          <select name="howHeard" className={inputCls}>
            <option value="">Select…</option>
            <option>Direct email from Aneesa Talks</option>
            <option>Referral from another member</option>
            <option>Social media</option>
            <option>Event</option>
            <option>Other</option>
          </select>
        </Field>
        <Field label="Professional Headshot Link" required hint="Google Drive, Dropbox, or direct image URL">
          <input name="headshotLink" className={inputCls} placeholder="https://…" />
        </Field>
      </Section>

      <Section title="Bio & Background">
        <Field label="Professional Bio" required hint="300–450 words">
          <textarea name="bio" required rows={8} className={textareaCls} placeholder="Write your professional bio in third person…" />
        </Field>
        <Field label="What are you looking for from PCC?">
          <textarea name="pccGoals" rows={3} className={textareaCls} />
        </Field>
        <Field label="Previous Collaborators">
          <input name="previousCollaborators" className={inputCls} placeholder="Names of collaborators you've worked with" />
        </Field>
        <Field label="Union / Guild Memberships">
          <input name="unionMemberships" className={inputCls} placeholder="e.g. SAG-AFTRA, WGA, IATSE…" />
        </Field>
        <Field label="Education / Training">
          <textarea name="education" rows={2} className={textareaCls} />
        </Field>
        <Field label="Additional Notes">
          <textarea name="additionalNotes" rows={2} className={textareaCls} />
        </Field>
      </Section>

      <Section title="Professional Roles">
        <p className="text-xs text-brand-brown/50 mb-4">Select all that apply.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {ROLES.map((r) => (
            <label key={r} className="flex items-center gap-2 text-sm text-brand-brown/80 cursor-pointer">
              <input type="checkbox" name="roles" value={r} className="accent-brand-green" />
              {r}
            </label>
          ))}
        </div>
      </Section>

      <Section title="Mediums">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {MEDIUMS.map((m) => (
            <label key={m} className="flex items-center gap-2 text-sm text-brand-brown/80 cursor-pointer">
              <input type="checkbox" name="mediums" value={m} className="accent-brand-green" />
              {m}
            </label>
          ))}
        </div>
      </Section>

      <Section title="Experience & Portfolio">
        <Field label="Experience Level" required>
          <select name="experienceLevel" required className={inputCls}>
            <option value="">Select…</option>
            {EXPERIENCE_LEVELS.map((l) => <option key={l}>{l}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Years of Professional Experience">
            <input name="yearsExperience" type="number" min="0" className={inputCls} />
          </Field>
          <Field label="Completed Projects">
            <input name="completedProjects" type="number" min="0" className={inputCls} />
          </Field>
        </div>
        <Field label="Notable Achievements">
          <textarea name="notableAchievements" rows={3} className={textareaCls} placeholder="Festival selections, awards, publications…" />
        </Field>
        <Field label="Professional References (3 preferred)">
          <textarea name="references" rows={3} className={textareaCls} placeholder="Name, relationship, contact info" />
        </Field>
        <Field label="Website / Portfolio URL" required>
          <input name="website" type="url" required className={inputCls} placeholder="https://…" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="IMDb"><input name="imdb" className={inputCls} placeholder="IMDb URL or nm…" /></Field>
          <Field label="Instagram"><input name="instagram" className={inputCls} placeholder="@handle or URL" /></Field>
          <Field label="LinkedIn"><input name="linkedin" className={inputCls} placeholder="linkedin.com/in/…" /></Field>
          <Field label="Vimeo / YouTube"><input name="vimeo" className={inputCls} placeholder="vimeo.com/…" /></Field>
        </div>
        <Field label="Public link to display on your profile" hint="This is the one link unpaid users will see">
          <input name="publicLink" className={inputCls} placeholder="Your most representative link" />
        </Field>

        {[1, 2, 3].map((n) => (
          <div key={n} className="bg-brand-green/5 border border-brand-green/10 rounded-xl p-4 mb-3">
            <p className="text-xs text-brand-brown/50 uppercase tracking-wide mb-3">Work Sample {n}</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Title"><input name={`ws${n}Title`} className={inputCls} /></Field>
              <Field label="Medium"><input name={`ws${n}Medium`} className={inputCls} placeholder="Short Film, Music Video…" /></Field>
              <Field label="Year"><input name={`ws${n}Year`} className={inputCls} placeholder="2024" /></Field>
              <Field label="Your Role"><input name={`ws${n}Role`} className={inputCls} /></Field>
            </div>
            <Field label="Link"><input name={`ws${n}Link`} type="url" className={inputCls} placeholder="https://…" /></Field>
          </div>
        ))}
      </Section>

      <Section title="Work for Hire">
        <Field label="Rate Structure">
          <select name="rateStructure" className={inputCls}>
            <option value="">Select…</option>
            <option>Day rate</option><option>Weekly rate</option>
            <option>Project rate</option><option>Hourly</option><option>Negotiable</option>
          </select>
        </Field>
        <Field label="Standard Rate Range" hint="e.g. $500–800/day or $5,000/project">
          <input name="rateRange" className={inputCls} />
        </Field>
        <Field label="Make rate visible to paid subscribers?">
          <select name="ratePublic" className={inputCls}>
            <option value="no">No — keep private</option>
            <option value="yes">Yes — show to paid subscribers</option>
          </select>
        </Field>
        <Field label="Current Availability" required>
          <select name="availability" required className={inputCls}>
            <option value="">Select…</option>
            {AVAILABILITY.map((a) => <option key={a}>{a}</option>)}
          </select>
        </Field>
        <Field label="Travel">
          <select name="travel" className={inputCls}>
            <option value="">Select…</option>
            <option>Will travel/open to international work</option>
            <option>Domestic travel only</option>
            <option>Local only</option>
            <option>Remote work only</option>
          </select>
        </Field>
        <Field label="Preferred Project Types">
          <div className="grid grid-cols-2 gap-2">
            {PROJECT_TYPES.map((t) => (
              <label key={t} className="flex items-center gap-2 text-sm text-brand-brown/80 cursor-pointer">
                <input type="checkbox" name="preferredProjectTypes" value={t} className="accent-brand-green" />
                {t}
              </label>
            ))}
          </div>
        </Field>
      </Section>

      <Section title="Skills & Languages">
        <Field label="Languages Spoken" hint="Select all that apply">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {LANGUAGES.map((l) => (
              <label key={l} className="flex items-center gap-2 text-sm text-brand-brown/80 cursor-pointer">
                <input type="checkbox" name="languagesCheck" value={l} className="accent-brand-green" />
                {l}
              </label>
            ))}
          </div>
          <input name="languages" className={`${inputCls} mt-3`} placeholder="Other languages (comma-separated)" />
        </Field>
        <Field label="Special Skills / Certifications">
          <textarea name="specialSkills" rows={2} className={textareaCls} />
        </Field>
        <Field label="Professional Equipment">
          <textarea name="equipment" rows={2} className={textareaCls} placeholder="List any owned professional equipment" />
        </Field>
      </Section>

      <Section title="Collaboration Preferences">
        <Field label="Preferred collaborator experience level(s)">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {EXPERIENCE_LEVELS.map((l) => (
              <label key={l} className="flex items-center gap-2 text-sm text-brand-brown/80 cursor-pointer">
                <input type="checkbox" name="collaborationPreferences" value={l} className="accent-brand-green" />
                {l}
              </label>
            ))}
            <label className="flex items-center gap-2 text-sm text-brand-brown/80 cursor-pointer">
              <input type="checkbox" name="collaborationPreferences" value="Any level" className="accent-brand-green" />
              Any level
            </label>
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
              <input type="checkbox" required name={`consent${i}`} className="accent-brand-green mt-0.5 shrink-0" />
              <span>{text}</span>
            </label>
          ))}
        </div>
        <Field label="Referred by" hint="Optional — name of the person who invited you">
          <input name="referralName" className={`${inputCls} mt-3`} />
        </Field>
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
