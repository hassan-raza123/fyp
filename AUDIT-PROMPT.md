# Audit prompt — copy everything below into a fresh Claude Code chat

---

You are performing an independent production-readiness audit of an Outcome-Based
Education (OBE) management system. Your job is to find what is **still wrong**,
prove it, and fix it.

## The project

- **Path:** `/Volumes/Work Drive/random/fyp project/fyp`
- **Stack:** Next.js 16.0.7 (App Router) · React 19.2 · Prisma 6.9 · MySQL · Playwright
- **Size:** 192 API routes · 116 pages · 58 Prisma models · 29 Playwright specs
- **Roles:** `super_admin`, `admin` (department admin), `faculty`, `student`
- **Domain:** PEO → PLO → CLO/LLO attainment chain, assessments, marks, attendance,
  surveys, transcripts, graduation criteria, accreditation reports

Read `PRODUCTION-READINESS-AUDIT.md` first. It documents six prior audit passes,
what was found, what was fixed, and one accepted debt. **Treat it as claims to
verify, not facts.** A previous audit asserted "all Critical and High closed"
twice and was wrong both times.

## How to run things

```bash
cd "/Volumes/Work Drive/random/fyp project/fyp"

npx tsc --noEmit                          # type gate
node scripts/check-route-authorization.mjs # authorization gate
npm run build                             # includes the authz gate via prebuild
npx playwright test                        # full suite (~5 min, needs local MySQL)
npx playwright test <spec-name>            # one spec
```

The Playwright suite uses `.env.test` and its own database; `globalSetup` resets
and seeds it, then signs in each role and saves storage state. Never point the
tests at the development database.

**Expected baseline when you start: 493 passed · 1 skipped · 0 failed.**
If that is not what you get, that is your first finding.

## What actually found bugs before — do all six

Each of these found real defects that the previous ones missed. Do not skip one
because an earlier one passed.

1. **Authorization review, per handler.** `src/proxy.ts` only checks that a
   request carries a *valid token* — it does **not** enforce roles or ownership
   on `/api/*`. Every route must authorize itself using `src/lib/authz.ts`.
   Check every handler for: a role check, *and* an ownership check when the
   request names a resource by id.

2. **Run the existing suite.** Failing tests are findings. Read what each
   failure actually asserts before assuming it is flaky.

3. **Sweep the subsystems with no test coverage.** This is where bugs live. Two
   unauthenticated High-severity holes were found in the survey subsystem
   precisely because it had zero tests. Find today's equivalent: which modules
   have API routes but few or no specs?

4. **Cross-reference the UI against the API.** Extract every `fetch('/api/…')`
   in `src/` and confirm a matching route file exists. Two endpoints the UI had
   been calling for months did not exist at all — one silently rendered an empty
   panel forever, the other showed a toast nobody connected to a missing route.
   Do the same for navigation: every `href` in `src/config/navigation.ts` must
   resolve to a real page.

5. **Runtime check, not just render.** `e2e/tests/runtime-health.spec.ts` opens
   all 84 dashboard pages across four roles and asserts no console error, no
   failed request, and **no API call returning 4xx/5xx**. This found the admin
   assessments page 401-ing on every load. A page that renders is not a page
   that works — a page whose data call fails renders too, just empty.

6. **Feature inventory.** For each domain area, does it have API *and* UI *and*
   tests? Rubrics had a database, an API, scoring logic and tests — and no user
   interface at all, so the feature was unreachable. Look for the same shape:
   backend capability with no way to use it, or UI with no backing route.

## Traps that cost the previous audit time

- **A guard that only inspects authenticated handlers misses unauthenticated
  ones.** The first version of `check-route-authorization.mjs` only looked at
  handlers calling `requireAuth`, so two routes with *no* auth at all were
  invisible to it. Verify the guard catches both failure modes — introduce a
  deliberately broken handler and confirm it fails.
- **`getStudentFromRequest` / `getFacultyIdFromRequest` call `requireAuth`
  internally.** A handler using them is authenticated even though `requireAuth`
  never appears. Do not report those as unguarded.
- **`page.request.*` in Playwright does not send the `SameSite=Strict` session
  cookie.** Use the helpers in `e2e/support/api-helper.ts`, which run `fetch`
  inside the page. A 401 from `page.request` is usually the harness, not the app.
- **Do not run `prettier` on whole files.** It reformats everything (the project
  uses single quotes) and buries your actual change in hundreds of lines.
- **An `aria-label` on a control that already has visible text *overrides* that
  text for screen readers.** Only add labels to genuinely icon-only controls.
- **Prisma `Decimal` is not a number.** See the accepted-debt section below
  before touching the schema.

## Areas to probe hardest

- **Authorization:** cross-department reads and writes; a student reaching staff
  endpoints; a department admin acting on another department's or a super
  admin's account.
- **Authentication:** the OTP flow binds to a password-verified challenge cookie
  (`src/lib/otp-challenge.ts`) — verify that binding cannot be bypassed.
- **Data integrity:** multi-write handlers without `$transaction`; unvalidated
  numeric input reaching `Float` columns; anything that could leave a user row
  without a role.
- **Attainment correctness:** the PEO/PLO/CLO/LLO chain in `src/lib/obe.ts`;
  threshold comparisons; students excluded from denominators.
- **Thin coverage:** `super_admin` is the least-tested role; notifications and
  some survey paths are light.

## One accepted debt — read before acting

Grade columns are `Float` (MySQL `DOUBLE`) rather than `Decimal`. **Do not
migrate this without a plan.** It was measured, not guessed:

- 434 arithmetic sites across 52 files — `sum + marks` becomes string
  concatenation, silently
- 21 Prisma aggregates (`_sum`/`_avg`) return `Decimal` and are not covered by
  client result extensions
- 1691 `NextResponse.json()` boundaries where `60.5` would become `"60.5"` —
  a wire-type change the test suite would not necessarily catch

The practical failure mode (a student marked down by representation error) is
already fixed via `meetsThreshold()` and locked by
`e2e/tests/float-boundary.spec.ts`. If you believe the migration should happen,
produce a plan covering all three surfaces plus data backfill — do not start it.

## How to work

- **Prove findings.** Exploit them against a running build, or cite the failing
  test. "This looks unsafe" is not a finding; a request and its response is.
- **Distinguish app defects from test defects.** Both are worth fixing; label
  them correctly.
- **Fix what you find**, then re-run the full suite. Add a regression test for
  every fix — an untested fix is how these came back.
- **Do not weaken a test to make it pass.** If a test fails, either the app is
  wrong or the test's premise is wrong; say which, with evidence.
- **Report honestly.** If you cannot verify something, say so. If a claim in
  `PRODUCTION-READINESS-AUDIT.md` turns out to be wrong, say that plainly.

## Deliverables

1. Every finding with: severity, exact location, root cause, impact, and proof.
2. Fixes applied, each with a regression test.
3. Full suite green, `tsc --noEmit` clean, `npm run build` passing, authorization
   guard passing.
4. A short written verdict: what is production-ready, what is not, and what you
   deliberately did not touch — with the reason.

Do not stop at the first issue. Work through all six check types even if the
early ones come back clean.
