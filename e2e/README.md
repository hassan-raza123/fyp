# End-to-end tests

Playwright tests that drive the real application against a real database.

## Running them

```bash
npm run test:e2e          # whole suite, headless
npm run test:e2e:ui       # interactive runner — best for writing new tests
npm run test:e2e:headed   # watch the browser work
npm run test:e2e:report   # open the HTML report from the last run
```

Playwright builds the app and starts it on port 3100 itself. Nothing needs to
be running beforehand.

To run one file, or one test by name:

```bash
npx playwright test e2e/tests/attainment.spec.ts
npx playwright test -g "unassessed student"
```

## What it runs against

A separate database, `EduTrack_test`, configured in `.env.test`. Your
development database is never touched. The suite drops and reseeds that database
before every run, so it always starts from a known state.

First-time setup on a new machine:

```bash
mysql -u root -p -e "CREATE DATABASE EduTrack_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
npm run db:test:reset
```

## Layout

```
e2e/
  support/
    fixtures.ts       seed data + the accounts every spec signs in as
    global-setup.ts   resets the database, signs each role in once
    auth-helper.ts    drives the login form, including the OTP step
    api-helper.ts     same-site API calls (see the note below)
    obe-helper.ts     shared OBE actions: record marks, calculate attainment
  tests/
    auth.spec.ts            sign-in, OTP, forced password change
    attainment.spec.ts      marks → CLO attainment, and the attained verdict
    plo-attainment.spec.ts  CLO → PLO → PEO roll-up, per-student PLO scores
    results.spec.ts         grades, GPA, transcripts, OBE reports
    access-control.spec.ts  what each role may and may not reach
    smoke.spec.ts           every page renders without crashing
```

## Two things worth knowing

**OTPs.** Admin and faculty need a one-time code on every sign-in. The code is
bcrypt-hashed before it is stored and there is no SMTP under test, so a test can
neither read it from the database nor from an inbox. `E2E_TEST_MODE=true` makes
the app keep the plaintext code in memory, and `/api/e2e/otp?email=` hands it
back. Both are inert without that flag, and the app throws rather than serve
codes if the flag is ever set on a non-local host.

**API calls from tests.** The session cookie is `SameSite=Strict`, and
Playwright's `page.request` issues requests outside any site context, so a
Strict cookie is withheld and every authenticated call comes back 401. That is
an artifact of the harness, not the app. Use the helpers in `api-helper.ts`
(`apiGet`, `apiPost`, …) — they run `fetch` inside the page, so the cookie
travels exactly as it does for a real user.

## Adding a test

Pick the storage state for the role you need; the sign-in has already happened:

```ts
import { statePath, readSeededIds } from '../support/global-setup';
import { apiGet } from '../support/api-helper';

test.use({ storageState: statePath('faculty') });
const ids = readSeededIds();

test('...', async ({ page }) => {
  await page.goto('/faculty');
  const response = await apiGet(page, `/api/sections/${ids.sectionId}/assessments`);
  expect(response.status).toBe(200);
});
```

Calculating CLO attainment or grades needs a faculty session even if your spec
runs as an admin — those endpoints resolve a faculty record from the token.
`obe-helper.ts` has `calculateCloAttainment(browser)` and
`calculateGrades(browser)` for that, and they assert the calculation actually
produced rows so a later assertion cannot pass against an empty table.

The suite runs on a single worker on purpose: every spec shares one database and
mutates attainment, grade and score rows, so running files concurrently makes
them clear each other's data.
