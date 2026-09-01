---
status: fixing
trigger: "2 to 3 people tried again and the enrollment form still does not go through when they press Submit; the button appears to do nothing."
created: 2026-09-01
updated: 2026-09-01
---

# Debug Session: Enrollment Submit Does Nothing

## Symptoms

- expected: A completed enrollment application submits and the applicant receives a clear success confirmation.
- actual: Pressing the Submit button appears to do nothing and the application does not go through.
- errors: No visible error was reported by the applicants.
- timeline: Reproduced by two to three applicants after the prior submission fix, on 2026-09-01.
- reproduction: Complete the multi-step enrollment form, including the headshot flow, reach the final step, and press Submit Application.

## Current Focus

- hypothesis: The submission service is healthy; the UX presents a Submit button even while earlier required fields block the click, which users experience as a dead or permission-disabled button.
- test: Make final-step readiness explicit, reserve the Submit label for a ready form, log privacy-safe blocker field names, then deploy and verify production.
- expecting: Incomplete applications show a required-item checklist and review action; complete applications submit and redirect; future blocked clicks identify the exact field in logs.
- next_action: deploy the verified UX and diagnostic change to production
- reasoning_checkpoint:
- tdd_checkpoint:

## Evidence

- timestamp: 2026-09-01T15:13:52-07:00
  result: Production returned 303 for POST /enroll, then 200 for GET /enroll/success; a matching PENDING Creative row was created.
- timestamp: 2026-09-01T15:12:49-07:00
  result: The only production enrollment rejection was `[enroll] rejected: validation failed on bio`; no 5xx, database failure, or authorization error occurred.
- timestamp: 2026-09-01T15:27:00-07:00
  result: Current form code only disables the real submit while pending. Missing client-side requirements intercept the click before POST, leaving no server evidence of which item blocked it.
- timestamp: 2026-09-01T15:29:00-07:00
  result: 108 tests pass, lint has zero errors, and the production build succeeds after Prisma client generation.

## Eliminated

- hypothesis: The submit endpoint is down or the database cannot accept applications.
  reason: A production application completed successfully and created a database row.
- hypothesis: Applicants lack permission to click or submit the form.
  reason: The action authenticated and accepted a real applicant; the button has no role-based or permission-based disable condition.
- hypothesis: A production server error is swallowing every submission.
  reason: No 5xx or database-write errors appear in production logs.

## Resolution

- root_cause: Final-step client validation could stop the click before any POST while the control still said “Submit Application,” making an incomplete earlier field look like a dead button. Existing logs could not observe pre-POST blockers.
- fix: Show the missing-item checklist immediately on the review step; show “Review N required items” until ready; only render “Submit Application” when no blockers remain; log allow-listed blocker field names without applicant data.
- verification: Full test suite (108 tests), lint (0 errors), and production build pass. Production deploy and live verification remain.
- files_changed: src/components/EnrollForm.tsx, src/lib/enroll-action.ts, tests/enroll-action.test.ts
