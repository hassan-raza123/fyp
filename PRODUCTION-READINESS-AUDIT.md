# EduTrack OBE — Production Readiness Audit

**Audit date:** 2026-08-01
**Scope:** `fyp/` — Next.js 16.0.7 / React 19.2 / Prisma 6.9 / MySQL, 190 API route files, 111 pages, 4 roles, 26 Playwright specs
**Method:** full source review + full Playwright run (368 tests) + live exploitation against a running production build

---

> ## ⚠️ PARTIAL REMEDIATION — release blockers closed, not the whole report
>
> **All 4 Critical findings are fixed. 6 of 7 High are fixed. H-1 is partially
> fixed. Most Medium and nearly all Low findings remain open.**
>
> ```
> BEFORE:  33 failed ·  1 skipped · 334 passed
> AFTER:    0 failed ·  1 skipped · 379 passed   ✅
> ```
>
> `tsc --noEmit` clean · new files lint clean · `next build` passes.
>
> **A green suite is not the same as a fixed report.** The suite proves the
> defects it covers are gone; it says nothing about the findings it never
> tested. H-1 in particular was fixed only where a test exercised it — **24 of
> the original 33 unguarded handlers still call bare `requireAuth`.** They are
> all reads, and every unguarded *write* is closed, but the finding is not
> closed.
>
> Findings are annotated below with their true state: **✅ FIXED**,
> **⚠️ PARTIAL**, or **❌ OPEN**. Scores in the executive summary are the
> original pre-fix assessment; see *Post-Remediation Status* at the end.

---

## Executive Summary

| Dimension | Score | Verdict |
|---|---|---|
| **Overall Project Score** | **51 / 100** | |
| **Production Readiness** | **42 / 100** | ❌ **Do not deploy** |
| Security | 40 / 100 | ❌ Blocking |
| Testing | 62 / 100 | ⚠️ Good quality, incomplete coverage |
| UI / UX | 62 / 100 | ⚠️ Consistent, but unfinished features |
| Accessibility | 55 / 100 | ⚠️ Systemic unnamed controls |
| Performance | 45 / 100 | ⚠️ Architecture-level issues |
| Database Integrity | 55 / 100 | ⚠️ Float grades, missing transactions |
| Maintainability | 58 / 100 | ⚠️ Good helpers, applied inconsistently |
| Scalability | 50 / 100 | ⚠️ Unbounded queries, no caching |

### The headline

This codebase is **better engineered than most projects of its size** — it has a purpose-built authorization helper library (`src/lib/authz.ts`), database-backed rate limiting, an audit-log subsystem, hashed OTPs, no XSS sinks, parameterized SQL, and a genuinely excellent 368-test Playwright suite with meaningful assertions.

**The problem is not that the security model is missing. It is that the security model exists and is not applied.** `authz.ts` defines `canManageUser`, `canAccessProgram`, `canAccessBatch`, `canReadSectionRoster` — with comments explaining precisely the attacks they prevent — and then **33 API handlers never call them**. The app's own test suite already fails 33 tests proving this.

I verified the three most severe findings by exploiting them live against a production build:

1. A **student** retrieved a full batch roster — classmates' names, roll numbers, email addresses. `HTTP 200`.
2. A **student** passed authorization on `DELETE /api/sections`, reaching the DB lookup (`404 Section not found`) where a correctly-guarded route returns `403 Insufficient permissions`.
3. An **unauthenticated attacker** obtained a valid **department-admin session cookie without ever supplying a password**.

### Test run result

```
33 failed · 1 skipped · 334 passed  (4.9m, 368 total)
```

**All 33 failures are real application defects**, not flakiness — one was a locator bug masking a genuine defect, fixed during this audit. Zero flaky tests; the suite is deterministic across runs.

### Deliverables

| File | Change |
|---|---|
| `PRODUCTION-READINESS-AUDIT.md` | This report |
| `e2e/tests/privilege-escalation.spec.ts` | **New** — 8 regression tests for C-2, C-4, H-1, H-2, H-3 |
| `e2e/tests/auth-bypass.spec.ts` | **New** — 4 regression tests for C-1, H-6 |
| `e2e/tests/navigation.spec.ts` | **Fixed** — strict-mode locator collision |

The 12 new tests fail by design against the current code and pass once each finding is fixed. No application code was modified.

---

## Critical Issues (release blockers)

### C-1 — Password-less authentication: full admin session with no credential

> ✅ **FIXED.** New `src/lib/otp-challenge.ts`: `/api/auth/login` issues a short-lived, httpOnly, `SameSite=Strict` `otp_challenge` JWT once the **password verifies**. `resend-otp` and `verify-otp` now require and validate it (including that it was issued for the same address), and it is cleared once a session is minted. `resend-otp` also answers uniformly for unknown addresses and accepts `super_admin`.

| | |
|---|---|
| **Severity** | 🔴 Critical |
| **Location** | [src/app/api/auth/resend-otp/route.ts](fyp/src/app/api/auth/resend-otp/route.ts), [src/app/api/auth/verify-otp/route.ts:122](fyp/src/app/api/auth/verify-otp/route.ts#L122) |
| **Status** | ✅ **Exploited live** |
| **Effort** | 4h |

`POST /api/auth/resend-otp` is unauthenticated (listed in `publicApiRoutes`, [src/proxy.ts:48](fyp/src/proxy.ts#L48)) and requires **only an email address and userType**. It mints a fresh, valid OTP row. `POST /api/auth/verify-otp` then exchanges that OTP for a session cookie — and **never checks that a password was ever entered**. There is no state linking the OTP to a completed step-1 credential check.

**Proof (live, production build):**

```
$ curl -X POST /api/auth/resend-otp -d '{"email":"e2e.admin@test.local","userType":"admin"}'
{"success":true,"message":"New OTP sent successfully."}          HTTP 200

$ curl -X POST /api/auth/verify-otp -d '{"email":"...","userType":"admin","otp":"401290"}'
HTTP/1.1 200 OK
set-cookie: token=eyJhbGciOiJIUzI1NiJ9...
{"success":true,"data":{"user":{"role":"admin","departmentId":151}},"redirectTo":"/admin"}
```

**Root cause.** The OTP was designed as a *second* factor but is implemented as the *only* factor. Step 1 (`/api/auth/login`) validates the password, but step 2 does not require step 1 to have happened, and `resend-otp` provides an unauthenticated way to create the step-2 credential directly.

**Impact.**
- The password is not a factor. Rotating a compromised admin's password **does not evict an attacker** who has mailbox access (forwarding rule, shared inbox, insider, compromised mail provider).
- Unauthenticated **email-bombing** vector against any known address (5/15 min per address, 20/15 min per IP).
- **User enumeration**: `404 User not found` vs `200` confirms which addresses exist *and* are active.

Brute force is *not* practical (5 guesses/10 min per account × 25 fresh codes/15 min ≈ 400 days for a 6-digit space), which is why this is Critical rather than "remote unauthenticated takeover".

**Fix.** Bind the OTP to a completed password check. On successful password validation in `/api/auth/login`, issue a short-lived, httpOnly, single-purpose `otp_challenge` JWT (2–5 min, containing `userId` + `purpose:'otp'`). Require and verify that cookie in **both** `resend-otp` and `verify-otp`; delete it once a session is issued. Additionally return a constant `200 {success:true}` from `resend-otp` regardless of whether the account exists.

---

### C-2 — Any authenticated user can delete sections

> ✅ **FIXED.** `DELETE /api/sections` now calls `authorize(request, ['super_admin','admin'])` **before** the row lookup, plus `canAccessSection()` for department scoping, and writes a `section.delete` audit entry.

| | |
|---|---|
| **Severity** | 🔴 Critical |
| **Location** | [src/app/api/sections/route.ts](fyp/src/app/api/sections/route.ts) — `DELETE` |
| **Status** | ✅ **Exploited live** · ❌ No test covers this |
| **Effort** | 30m |

The `DELETE` handler calls `requireAuth(request)` and **no role check whatsoever**. Any signed-in user — including a student — can delete any section in any department that has zero enrolled students.

**Proof, with a control to rule out a coincidental 404:**

```
# student token → DELETE /api/sections?id=999999
{"success":false,"error":"Section not found"}          HTTP 404   ← passed authz, reached the DB

# same student token → DELETE /api/clos/999999   (a correctly-guarded route)
{"success":false,"error":"Insufficient permissions"}   HTTP 403   ← rejected at authz
```

The 404 proves the request cleared every authorization gate and got as far as the row lookup.

**Impact.** Unauthenticated-adjacent destructive data loss. Deleting a section cascades into timetable, attainment and reporting structures. There is **no audit-log entry** for section deletion.

**Fix.**
```ts
const auth = await authorize(request, ['super_admin', 'admin']);
if (!auth.ok) return auth.response;
if (!(await canAccessSection(request, auth.user, sectionId))) return forbidden();
```
Add `writeAuditLog(request, auth.user, 'section.delete', { sectionId })`.

---

### C-3 — A department admin can read, edit, delete and demote *any* account in the university, including the super admin

> ✅ **FIXED.** `canManageUser()` applied to `users/[id]` GET/PUT/DELETE, `users/[id]/roles`, `users/[id]/reset-password`, `users/[id]/department-admin` and all three `admins/[id]` handlers. `canManageUser()` itself was hardened to refuse any target holding the `super_admin` role, so the guarantee no longer depends on whether that account happens to have a faculty row. Self-delete and last-super-admin deletion are blocked. All six actions are now audited.

| | |
|---|---|
| **Severity** | 🔴 Critical |
| **Location** | [src/app/api/users/[id]/route.ts](fyp/src/app/api/users/[id]/route.ts) (GET/PUT/DELETE), [users/[id]/roles](fyp/src/app/api/users/[id]/roles/route.ts), [users/[id]/reset-password](fyp/src/app/api/users/[id]/reset-password/route.ts), [users/[id]/department-admin](fyp/src/app/api/users/[id]/department-admin/route.ts), [admins/[id]](fyp/src/app/api/admins/[id]/route.ts) |
| **Status** | ✅ **8 failing tests prove it** |
| **Effort** | 4h |

Every one of these routes checks `role === 'admin' || role === 'super_admin'` and stops there. None calls `canManageUser()` — the helper that exists in [src/lib/authz.ts:349](fyp/src/lib/authz.ts#L349) carrying this exact comment:

> *"Without this, a department admin could disable or reset the password of any account in the university."*

`users/[id]/status` is the **only** route in the codebase that calls it.

**Failing tests (`user-admin-isolation.spec.ts`), all `Expected: 403 · Received: 200`:**

| Test | Line |
|---|---|
| cannot read a user record from another department | 146 |
| cannot edit a user record from another department | 151 |
| cannot delete a user account from another department | 166 |
| cannot reassign the role of a foreign account | 176 |
| cannot trigger a password reset for a foreign account | 195 |
| cannot make a foreign account an admin of their own department | 203 |
| **cannot demote the super admin to a student** | 227 |
| **cannot delete the super admin account** | 250 |

**Impact.** Complete collapse of multi-tenancy in the account layer, plus **privilege escalation to system-wide control**: a department admin can delete the super admin account, or reset any user's password and take over that account. There is **no audit-log coverage** of any account-administration action.

**Fix.** In each handler, after the role check:
```ts
if (!(await canManageUser(request, user, targetUserId))) return forbidden();
```
Additionally: refuse to act on a target holding `super_admin` unless the caller is `super_admin`; block self-delete; block deleting the last `super_admin`. Extend `AuditAction` with `user.create | user.update | user.delete | user.role_change | user.password_reset | user.status_change` and write them.

---

### C-4 — Non-transactional cascading delete corrupts accounts on partial failure

> ✅ **FIXED.** The four deletes are wrapped in `prisma.$transaction`; a failure now rolls back and returns `409` with an actionable message ("deactivate it instead") rather than stranding the account. Same fix applied to `admins/[id]::DELETE`.

| | |
|---|---|
| **Severity** | 🔴 Critical |
| **Location** | [src/app/api/users/[id]/route.ts](fyp/src/app/api/users/[id]/route.ts) — `DELETE` |
| **Status** | ✅ **Reproduced — corruption confirmed** |
| **Effort** | 2h |

Four sequential writes, **no `$transaction`**:

```ts
await prisma.userroles.deleteMany({ where: { userId } });
await prisma.faculties.deleteMany({ where: { userId } });
await prisma.students.deleteMany({ where: { userId } });
await prisma.users.delete({ where: { id: userId } });
```

102 of 123 schema relations declare no `onDelete`, so Prisma defaults to `Restrict`. A student with grades, enrolments or attendance therefore makes `students.deleteMany` throw — **after `userroles.deleteMany` has already committed**.

**Result:** a surviving user row with no role. `/api/auth/login` returns *"User has no roles assigned"* — the account is permanently locked out and invisible to role-filtered admin listings. Recoverable only by direct SQL.

**Reproduced.** The regression test added in this audit (`privilege-escalation.spec.ts` → *"a failed delete leaves the account intact, not half-removed"*) creates a student holding a section enrolment and deletes them:

```
Error: the delete returned 500 but had already stripped the role, locking the account out
```

Direct database inspection after the run confirmed the corrupt state — `users` row present, `userroles` count `0`:

```
seeded student user still exists: true
roles: 0
student row: 1
```

**Fix.** Wrap in `prisma.$transaction`. The codebase already uses `$transaction` correctly in 24 places — this is an inconsistency, not a knowledge gap. Same defect in `admins/[id]::DELETE`, `faculty/[id]::DELETE`, and `students/route.ts::POST` (3 creates: a partial failure leaves a user who cannot log in).

---

## High Priority Issues

### H-1 — 33 handlers authorize with `requireAuth` only: no role, no ownership

> ⚠️ **PARTIALLY FIXED — 9 of 33 handlers.** `authorize()` + the matching `can*()` ownership helper applied to the handlers the test suite exercises — `plos`, `ploattainments/trends`, `programs/[id]/batches`, `programs/[id]/plos` (GET **and** POST), `batches/[id]/sections`, `courses/offerings/[id]`, `semesters::PATCH`, `assessments::POST`. Unscoped listings now fall back to `resolveDepartmentScope()` instead of returning the whole table. `assessments::POST` additionally checks `canManageCourseOffering()` and `assertResultsUnlocked()`.
>
> **Still open: 24 handlers.** Every unguarded *write* is now closed; the remainder are all `GET`s — `clos`, `peos`, `rubrics`, `semesters`, `pass-fail-criteria`, `plo-attainments`, `graduation-criteria`, `program-curriculum`, `clo-plo-mappings`, `peo-plo-mappings`, `surveys/[id]`(+`questions`,`respond`), `assessments/[id]`(+`items`), `action-plans/[id]`, `llos/[id]`, `courses/[id]/prerequisites`, `course-offerings/[id]/lock`, `departments/by-code`. Any signed-in account, including a student, can still read all of them across every department.

| | |
|---|---|
| **Severity** | 🟠 High |
| **Status** | ✅ 11 failing tests · ✅ 1 exploited live |
| **Effort** | 2–3 days |

`src/proxy.ts` verifies only that a request carries a *valid token* — it deliberately does not enforce roles on `/api/*` (documented at [authz.ts:9](fyp/src/lib/authz.ts#L9)). Each route must authorize itself. These 33 do not:

**Reads — any signed-in user, any tenant:**
`/plos::GET` · `/ploattainments/trends::GET` · `/programs/[id]/batches::GET` · `/batches/[id]/sections::GET` · `/courses/offerings/[id]::GET` · `/clos::GET` · `/peos::GET` · `/peos/[id]::GET` · `/llos/[id]::GET` · `/rubrics::GET` · `/rubrics/[id]::GET` · `/plo-attainments::GET` · `/clo-plo-mappings::GET` · `/peo-plo-mappings::GET` · `/pass-fail-criteria::GET` · `/pass-fail-criteria/[id]::GET` · `/graduation-criteria/[id]::GET` · `/program-curriculum::GET` · `/semesters::GET` · `/semesters/[id]::GET` · `/surveys/[id]::GET` · `/surveys/[id]/questions::GET` · `/assessments/[id]::GET` · `/assessments/[id]/items::GET` · `/action-plans/[id]::GET` · `/courses/[id]/prerequisites::GET` · `/course-offerings/[id]/lock::GET` · `/departments/by-code::GET` · `/surveys/[id]/respond::GET`

**Writes — worse:**
| Route | Who can call it |
|---|---|
| `DELETE /sections` | any user *(→ C-2)* |
| `POST /assessments` | any faculty, on **any course offering in any department** |
| `PATCH /semesters` | any user |
| `POST /programs/[id]/plos` | any user |

**Failing tests (`cross-tenant-reads.spec.ts`), all `Expected: 403 · Received: 200`:**

*As a department admin, against another department:* list PLOs (155) · read PLO attainment trend (165) · list batches (173) · list sections (183) · read a course offering (188)
*As a student:* enumerate every PLO in the system (206) · read another programme's PLOs (215) · read programme-wide attainment trends (220) · list batches (228) · list sections of a batch they are not in (233) · read an unenrolled course offering (238)

`/api/plos::GET` even writes `requireAuth(request as any)` and **discards the `user` object entirely** — as does `/ploattainments/trends::GET` (`const { success, error } = ...`).

`POST /api/assessments` takes `courseOfferingId` straight from the request body, resolves the caller's faculty row, and **never compares the two**. It also skips `assertResultsUnlocked()`. Any faculty member can plant graded assessments in another department's course.

**Fix.** Mechanical and low-risk — the helpers already exist:

```ts
// Ownership-scoped read
const auth = await authorize(request, ['super_admin','admin','faculty']);
if (!auth.ok) return auth.response;
if (!(await canAccessProgram(request, auth.user, programId))) return forbidden();

// Department-scoped listing
const scope = await resolveDepartmentScope(request, auth.user);
if (scope.error) return scope.error;
const where = { ...departmentFilter(scope.departmentId) };
```

Then **add a lint rule or CI check** forbidding a bare `requireAuth` in `src/app/api/**` without an accompanying `authorize`/`can*` call. Without that guard this class of bug returns.

---

### H-2 — Batch roster leaks classmate PII to students

> ✅ **FIXED.** `authorize(request, ['super_admin','admin','faculty'])` + `canAccessBatch()`.

| | |
|---|---|
| **Severity** | 🟠 High |
| **Location** | [src/app/api/batches/[id]/students/route.ts:7](fyp/src/app/api/batches/[id]/students/route.ts#L7) |
| **Status** | ✅ **Exploited live** · ❌ No test covers this |
| **Effort** | 30m |

The `GET` handler imports `requireAuth` and `requireRole` — and calls **neither**. It goes straight to the query. (The `POST` handler in the same file correctly calls both, which is what makes this an oversight rather than a design choice.)

**Proof (student session token):**
```json
HTTP 200
[{"rollNumber":"CS-2026-001", ... ,"user":{"first_name":"Test","last_name":"Student","email":"e2e.student@test.local"}},
 {"rollNumber":"CS-2026-002", ... ,"user":{"first_name":"Other","last_name":"Student","email":"e2e.student2@test.local"}}]
```

This directly contradicts the documented intent of `canReadSectionRoster` ([authz.ts:195](fyp/src/lib/authz.ts#L195)):

> *"A roster names every enrolled student — roll numbers and email addresses included — which is a staff view … that is not a reason to hand them their classmates' contact details."*

**Impact.** Enumerable PII disclosure (GDPR/FERPA-relevant): student names, institutional roll numbers and email addresses for every batch, harvestable by any student account. Batch IDs are cuids, but they are returned by other endpoints the same student can read.

**Fix.** `authorize(request, ['super_admin','admin','faculty'])` + `canAccessBatch(request, user, params.id)`.

---

### H-3 — Cross-tenant write: a department admin can create students in another department

> ✅ **FIXED.** The body `departmentId` is no longer authoritative. A non-super-admin always writes into their own department, and a mismatched explicit value is rejected with 403.

| | |
|---|---|
| **Severity** | 🟠 High |
| **Location** | [src/app/api/students/route.ts](fyp/src/app/api/students/route.ts) — `POST` |
| **Effort** | 1h |

`departmentId` is accepted from the request body. The caller's own department is used **only as a fallback when the field is absent**, and the supplied value is validated only for *existence*:

```ts
let departmentId = providedDepartmentId;          // ← attacker-controlled
if (!departmentId) { departmentId = await getDepartmentIdFromRequest(request); ... }
// later: where: { id: departmentId }             // ← only checks it exists
```

**Fix.** For non-`super_admin`, ignore the body field entirely and always derive from the session; or reject when `providedDepartmentId !== callerDepartmentId`.

---

### H-4 — `$disconnect()` on the shared Prisma client tears down the pool for the whole process

> ✅ **FIXED.** The `finally { await prisma.$disconnect() }` block is gone, with a comment recording why it must not come back.

| | |
|---|---|
| **Severity** | 🟠 High |
| **Location** | [src/app/api/auth/resend-otp/route.ts:167](fyp/src/app/api/auth/resend-otp/route.ts#L167) |
| **Effort** | 5m |

```ts
} finally {
  await prisma.$disconnect();
}
```

`prisma` is the process-wide singleton from `src/lib/prisma.ts`. Every "resend code" click disconnects the pool used by **all concurrent in-flight requests** on that instance. Under load this produces sporadic, unreproducible connection errors across unrelated endpoints — the worst class of production bug to diagnose.

Ironically the same file carries a comment warning against exactly this category of mistake ("*instantiating PrismaClient per module opens a separate connection pool… and exhausts DB connections*").

**Fix.** Delete the `finally` block. Never call `$disconnect()` on the shared client in a serverless/long-lived server.

---

### H-5 — No security headers: clickjacking, no CSP, no HSTS

> ✅ **FIXED.** `headers()` added to `next.config.ts`: CSP with `frame-ancestors 'none'`, `X-Frame-Options: DENY`, HSTS, `nosniff`, `Referrer-Policy`, `Permissions-Policy`.

| | |
|---|---|
| **Severity** | 🟠 High |
| **Effort** | 2h |

`next.config.ts` defines no `headers()` and `vercel.json` sets none. The application ships with **no** `Content-Security-Policy`, `X-Frame-Options` / `frame-ancestors`, `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy` or `Permissions-Policy`.

Clickjacking is directly exploitable: every dashboard can be framed and overlaid to trick an admin into destructive one-click actions (delete user, unlock results).

**Fix** — [next.config.ts](fyp/next.config.ts):
```ts
async headers() {
  return [{ source: '/:path*', headers: [
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Content-Security-Policy', value: "default-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'" },
    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  ]}];
}
```

---

### H-6 — Disabled and deleted users keep full access for up to 24 hours

> ✅ **FIXED.** `requireAuth()` now revalidates `users.status` against the database on every call, so suspending an account takes effect immediately instead of at token expiry. (The Edge proxy cannot reach Prisma, so a suspended user may still see a page shell — every API call behind it returns 401, so no data is served.)

| | |
|---|---|
| **Severity** | 🟠 High |
| **Location** | [src/lib/auth.ts:138](fyp/src/lib/auth.ts#L138) `requireAuth`, [src/constants/auth.ts:7](fyp/src/constants/auth.ts#L7) |
| **Effort** | 1d |

`users.status` is checked **only at login**. `requireAuth` verifies the JWT signature and expiry and never revalidates against the database. Tokens live 24 h and there is no revocation list — `/api/auth/logout` only clears the client cookie.

**Impact.** Suspending or deleting a compromised or terminated account has **no effect for up to 24 hours**. Incident response cannot evict an attacker. Combined with **C-1**, a password reset doesn't evict them either.

**Fix.** Short-lived access tokens (15 min) + refresh token that revalidates `users.status` against the DB; or a `sessions`/`token_version` table checked in `requireAuth` (one indexed lookup per request), bumped on logout, password change, status change and role change.

---

### H-7 — Account menu "Profile" is a dead link for 3 of 4 roles

> ✅ **FIXED.** Built `/admin/profile`, `/faculty/profile` and `/student/profile` over a new shared `ProfileView` component and a new role-agnostic `GET/PUT /api/profile`, replacing what would have been three near-duplicate endpoints and forms.

| | |
|---|---|
| **Severity** | 🟠 High (broken shipped feature) |
| **Location** | [src/components/layouts/DashboardLayout.tsx:238-241](fyp/src/components/layouts/DashboardLayout.tsx#L238-L241) |
| **Status** | ✅ 3 failing tests |
| **Effort** | 2d |

```ts
if (role === 'admin')    return '/admin/profile';      // ← page does not exist
if (role === 'faculty')  return '/faculty/profile';    // ← page does not exist
if (role === 'student')  return '/student/profile';    // ← page does not exist
if (role === 'super_admin') return '/super-admin/profile';  // ← only this one exists
```

```
Error: Profile navigates to http://127.0.0.1:3100/admin/profile, which has no page behind it
  navigation.spec.ts:42 (admin, faculty, student)
```

Every admin, faculty member and student who opens the account menu and clicks Profile lands on a 404. Backing APIs (`/api/faculty/profile`, `/api/student/profile`) already exist — only the pages are missing.

---

## Medium Priority Issues

### M-1 — Header search bar and notifications bell are both decorative

[DashboardLayout.tsx:502-505](fyp/src/components/layouts/DashboardLayout.tsx#L502) — `searchTerm` is bound to the input and updated by `setSearchTerm`, then **never read**. No filter, no navigation, no submit handler. A prominent search box on every dashboard does nothing.
`✘ navigation.spec.ts — "typing in the header search and submitting changes nothing on the page"`

The **notifications bell** is the same story. This originally looked like a test bug (a strict-mode locator collision between the sidebar nav item and the header bell, both named "Notifications"). After fixing the locator during this audit, the test still fails — the bell sets `aria-expanded` but renders no panel:
```
✘ the bell reports itself expanded but renders no panel
```
So the navigation spec has **5 real defects, not 4**; the locator collision was masking a genuine one.

**Fix:** implement both, or remove them until they work. **Effort:** 3d (implement) / 30m (remove).

### M-2 — 66% of write handlers accept unvalidated input

66 of 99 body-accepting `POST`/`PUT`/`PATCH` handlers perform **no schema validation**, despite `zod` being a dependency and used correctly in the auth routes. Typical pattern:
```ts
const { totalMarks, weightage, courseOfferingId } = body;   // no validation
totalMarks: Number(totalMarks),                             // "abc" → NaN → Prisma 500
```
**Impact:** unhandled 500s on malformed input, `NaN`/`null` reaching numeric columns, silent data corruption in grade fields. **Fix:** a `zod` schema per handler, mirroring `loginSchema`. **Effort:** 3–4d.

### M-3 — `Float` for all marks, GPA, percentages and thresholds

`prisma/schema.prisma` uses `Float` (MySQL `DOUBLE`) for `obtainedMarks`, `totalMarks`, `percentage`, `gpaValue`, `gpaPoints`, `attainmentPercent`, `threshold`, `minPercent`, `maxPercent`.

Binary floating point cannot represent decimal fractions exactly. Summing weighted assessment marks accumulates drift, and threshold comparisons at the boundary (`percentage >= 50`) can flip. The suite has a test named *"one of two passing is exactly 50% and still counts as attained"* — that boundary is precisely where `Float` is unsafe.

**Impact:** in an accreditation-facing system, a student can be recorded as failing a CLO or missing a graduation criterion because of representation error. **Fix:** migrate to `Decimal @db.Decimal(6,3)` for marks/percentages and `Decimal(4,2)` for GPA. **Effort:** 3d incl. migration + backfill.

### M-4 — Non-transactional multi-write handlers (11)

Beyond C-4: `admins/[id]::DELETE`, `faculty/[id]::DELETE`, `faculty/[id]::PUT`, `courses/[id]::PUT`, `courses::PUT`, `students::POST`, `auth/reset-password::POST`, `auth/verify-otp::POST`, `faculty/grades/calculate::POST`. **Effort:** 1d.

### M-5 — 240 of 260 `findMany` calls are unbounded

No `take`, no pagination. A production dataset (thousands of students, tens of thousands of assessment results) will return entire tables into memory and serialize them to the client. Conversely one endpoint applies a silent default limit:
`✘ list-limits.spec.ts:84 — "a selector that omits its limit is silently truncated" · Expected: 13 · Received: 10`
So listings are **both** unbounded *and* inconsistently truncated. **Fix:** a shared `paginate()` helper returning `{ data, total, page, pageSize }`; never truncate silently. **Effort:** 3d.

### M-6 — 23 handlers return raw exception messages to the client

```ts
error: error instanceof Error ? error.message : 'Internal server error'
```
Prisma errors expose table names, column names and constraint names (`userroles_userId_key`, `Foreign key constraint violated on the fields: (programId)`), handing an attacker a schema map. **Fix:** log server-side, return a generic message + correlation id. **Effort:** 2h.

### M-7 — No observability

No Sentry, no structured logging, no metrics, no tracing — 305 raw `console.*` calls. On Vercel these land unstructured and unsampled with no alerting. You will not know the app is broken in production. **Fix:** Sentry (or equivalent) + a `logger` wrapper emitting JSON with request ids. **Effort:** 1d.

### M-8 — Audit log covers academics but not accounts or authentication

`writeAuditLog` is well-designed and used in 59 places, but `AuditAction` has **no** account-administration or authentication events. Zero audit calls in `users/[id]`, `users/[id]/roles`, `users/[id]/reset-password`, `admins/[id]`, `auth/login`. For an accreditation system this is also a compliance gap. **Fix:** add `user.*` and `auth.login_success | auth.login_failure | auth.otp_failure`. **Effort:** 1d.

### M-9 — Super admin locked out of several endpoints

A `super_admin` deliberately belongs to no department, and `resolveDepartmentScope` exists to handle that — but these routes hard-fail without a `departmentId`: `batches/unassigned-students::GET`, `admin/llo-attainments::GET`, `courses/offerings::GET`. Separately, `programs/route.ts:131` gates `POST` on `['admin']` only, so **the super admin cannot create a programme** even though they can list them. **Fix:** use `resolveDepartmentScope` uniformly. **Effort:** 3h.

### M-10 — Super admins cannot resend their OTP

[resend-otp/route.ts:25](fyp/src/app/api/auth/resend-otp/route.ts#L25) — `userType: z.enum(['student','faculty','admin'])` omits `'super_admin'`, but `/api/auth/login` writes OTP rows with `userType: 'super_admin'`. A super admin who clicks "Resend code" gets `400 Validation failed`, and a resent code would target the wrong `userType` row anyway. **Effort:** 15m.

### M-11 — Systemic accessibility failure: unnamed icon-only controls

8 failing tests. Row-action buttons render an icon with no text and no `aria-label`:
```html
<button class="px-2 py-1 rounded-md transition-colors text-xs font-medium h-7"><Eye/></button>
<button ...><Pencil/></button>
<button ...><Trash/></button>
```
A screen-reader user hears *"button, button, button"* on every table row. Confirmed on `/admin/semesters`, `/admin/courses`, `/admin/programs`, `/admin/batches`, `/admin/sections`, `/admin/clos`, `/admin/plos`, `/student/courses` — and the same pattern appears in `AssessmentList.tsx`, `CLOPLOMappingList.tsx`, `LLOPLOMappingList.tsx`, `faculty/sections/page.tsx`.

Note `src/components/ui/pagination.tsx` **does** label its controls correctly — the offenders are all hand-rolled buttons that bypass the design system. **Fix:** `aria-label={\`Edit ${item.name}\`}` etc.; extract a shared `<RowActions>` component. **Effort:** 1d.

---

## Low Priority Issues

| ID | Issue | Location | Effort |
|---|---|---|---|
| L-1 | **Dead, unreachable route** — `auth/check-reset-token` has no callers, and isn't in `publicApiRoutes`, so it 401s for the logged-out users who are its only audience. Also instantiates its own `new PrismaClient()`. Delete it. | [check-reset-token](fyp/src/app/api/auth/check-reset-token/route.ts) | 15m |
| L-2 | **Login user enumeration / timing** — `if (!user) return 401` skips `bcrypt.compare`, so response time distinguishes valid emails. Add a dummy compare. | [login/route.ts:206](fyp/src/app/api/auth/login/route.ts#L206) | 30m |
| L-3 | **Mixed-language comments** — Roman-Urdu blocks in `login/route.ts:253-258,273,287,315` and `verify-otp:222-227,245,248`. Fine solo, a barrier for a team or handover. | auth routes | 1h |
| L-4 | **`require()` in ESM** — `const bcrypt = require('bcryptjs')` types `bcrypt` as `any`, disabling type checking on password comparison. Use `import`. | login, verify-otp | 15m |
| L-5 | **32 dynamic `await import()` inside handlers** — defeats static bundling, adds per-request resolution cost. Hoist to top-level imports. | 17 route files | 2h |
| L-6 | **`parseInt` without validation** — `parseInt(programId)` → `NaN` bound into SQL → 500. | [unassigned-students:40](fyp/src/app/api/batches/unassigned-students/route.ts#L40) | 30m |
| L-7 | **`/surveys` prefix match** — `path.startsWith('/surveys')` also matches `/surveysanything`. Use a segment-aware match. | [proxy.ts:181](fyp/src/proxy.ts#L181) | 15m |
| L-8 | **Double token verification** — `proxy.ts:318` calls `verifyToken(token)` a second time for the same request. | [proxy.ts:318](fyp/src/proxy.ts#L318) | 15m |
| L-9 | **`notifications/[id]`** — `DELETE` requires `role === 'admin'`, so a **super admin gets 401** and users cannot delete their own notifications; `PATCH` lets any admin mark any user's notification read. Wrong status code (401 for an authorization failure). | [notifications/[id]](fyp/src/app/api/notifications/[id]/route.ts) | 1h |
| L-10 | **`signOut` test helper is a no-op server-side** — `page.request.post('/api/auth/logout')` cannot send a `SameSite=Strict` cookie (the suite's own `api-helper.ts` documents this). Only `clearCookies()` does anything, so "confirm the session is gone" confirms nothing. | [auth-helper.ts:117](fyp/e2e/support/auth-helper.ts#L117) | 30m |
| L-11 | **localStorage stores email + role** on "remember me" — minor exposure on shared machines. | [LoginForm.tsx:132](fyp/src/components/auth/LoginForm.tsx#L132) | 15m |

---

## Missing Features

| Feature | Evidence |
|---|---|
| **Profile pages** for admin, faculty, student | H-7 — menu links to 404s; APIs exist, pages don't |
| **Functional global search** | M-1 — input exists, does nothing |
| **Dark mode (half-finished)** | `darkMode:['class']` configured, `ThemeProvider` mounted, `next-themes` used in 5 files — but only ~53 of 111 pages carry `dark:` variants. Charts read `resolvedTheme`; the rest of the app will render light-on-light in dark mode. No theme toggle in `DashboardLayout`. |
| **Notification delete for end users** | L-9 — admin-only |
| **Session revocation / "sign out everywhere"** | H-6 |
| **Rate limiting outside auth** | `consumeRateLimit` is used only by login/verify-otp/resend-otp. Bulk import, report generation and attainment recalculation are unthrottled and expensive. |
| **Pagination on most listings** | M-5 |

---

## Security Findings — summary

| ID | Finding | Severity | Verified |
|---|---|---|---|
| C-1 | Password-less admin session via `resend-otp` → `verify-otp` | 🔴 Critical | ✅ Exploited |
| C-2 | Any user can delete sections | 🔴 Critical | ✅ Exploited |
| C-3 | Dept admin can delete/demote the super admin | 🔴 Critical | ✅ 8 tests |
| H-1 | 33 handlers with no role/ownership check | 🟠 High | ✅ 11 tests + live |
| H-2 | Batch roster PII leak to students | 🟠 High | ✅ Exploited |
| H-3 | Cross-tenant student creation | 🟠 High | Code review |
| H-5 | No CSP / X-Frame-Options / HSTS (clickjacking) | 🟠 High | Code review |
| H-6 | Suspended users retain access 24h | 🟠 High | Code review |
| M-6 | Raw exception messages leak schema | 🟡 Medium | Code review |
| L-2 | Login user enumeration + timing oracle | 🔵 Low | Code review |

**Clean — no findings:**

| Area | Result |
|---|---|
| XSS | ✅ Zero `dangerouslySetInnerHTML` / `innerHTML` / `eval` / `new Function` in `src/` |
| SQL / NoSQL injection | ✅ Prisma throughout; the one `$queryRawUnsafe` uses bound `?` params; `$executeRaw` is a tagged template |
| CSRF | ✅ `SameSite=Strict` + `httpOnly` + `secure` in production |
| Open redirect | ✅ No user-controlled redirect targets |
| Secrets in frontend | ✅ Only `NEXT_PUBLIC_APP_URL` is public; `.env*` gitignored with `!.env.example` |
| JWT handling | ✅ No fallback secret, ≥32-char enforced at startup, HS256, `jose` |
| Password storage | ✅ bcrypt, cost 10 |
| OTP storage | ✅ bcrypt-hashed, 5-min expiry, single-use, CSPRNG (`randomInt`) |
| Brute force | ✅ DB-backed limiter (correctly rejects in-memory for horizontal scaling), per-account **and** per-IP |
| E2E backdoor | ✅ `/api/e2e/otp` double-guarded (`E2E_TEST_MODE` **and** local-host check that *throws* on a non-local production host) |

The E2E OTP backdoor in particular is guarded better than most production codebases manage.

---

## Performance Findings

| Finding | Detail | Fix | Effort |
|---|---|---|---|
| **Client-only architecture** | **106 of 111 pages are `'use client'`**. Effectively zero use of React Server Components. Every page ships its full component tree as JS and fetches after hydration — no SSR, no streaming, poor LCP/TTFB, and the App Router's main advantage is unused. | Convert read-heavy pages (dashboards, listings, transcripts) to server components fetching directly via Prisma. | 2–3wk |
| **No data-fetching layer** | React Query is installed and `QueryClientProvider` is mounted — but used in **2 of 111 pages**. The other **102 use raw `useEffect` + `fetch`**: no caching, no dedup, no retry, no stale-while-revalidate. Every navigation refetches from scratch. Two competing paradigms coexist. | Standardise on React Query (or server components). | 2wk |
| **Unbounded queries** | 240 of 260 `findMany` without `take`. | M-5 | 3d |
| **N+1 risk** | 85 `for (const …)` / `.map(async …)` loops containing awaits inside API handlers. | Batch with `include` / `groupBy` / `$transaction`. | 1wk |
| **Bundle** | 6.4 MB `.next/static`; largest client chunks 412 KB / 388 KB / 388 KB. Recharts + jsPDF + d3 are pulled into the shared graph. | `next/dynamic` for charts and PDF export. | 2d |
| **No caching** | No `unstable_cache`, no `revalidate`, no Redis. Every request hits MySQL. Attainment calculations are recomputed rather than memoised. | Cache attainment aggregates; `revalidate` on config reads. | 1wk |

---

## Playwright Coverage

### Suite quality — this is the strongest part of the project

```
33 failed · 1 skipped · 334 passed  (368 total, 4.9m)
```

| Criterion | Assessment |
|---|---|
| Executable | ✅ Single command; `globalSetup` resets + seeds the DB and pre-authenticates all 5 accounts |
| Reliable | ✅ **Zero flaky tests.** Identical results across runs |
| Selectors | ✅ Role/label-based (`getByRole`, `getByLabel`) — one strict-mode collision (below) |
| Waits | ✅ Web-first assertions and `waitForURL` predicates; no arbitrary `waitForTimeout` in specs |
| Isolation | ⚠️ `fullyParallel: false, workers: 1` — correct given shared mutable state, but the suite cannot scale |
| Fixtures | ✅ `seedTestData()` returns typed `SeededIds`; specs create and clean up their own foreign tenants |
| Auth helpers | ✅ Reusable; `storageState` per role; real OTP round-trip through the real UI |
| Assertions | ✅ Meaningful — `expect(x, 'the foreign PLO was returned in the body').not.toContain('XREAD')`, not just status codes |

The `api-helper.ts` workaround — running `fetch` inside the page so a `SameSite=Strict` cookie travels correctly — is a genuinely sophisticated piece of test engineering.

### Failures: 32 real defects, 1 test bug

| Spec | Failed | Classification |
|---|---|---|
| `user-admin-isolation` | 8 | 🔴 **App defect** → C-3 |
| `cross-tenant-reads` | 11 | 🟠 **App defect** → H-1 |
| `accessibility` | 8 | 🟡 **App defect** → M-11 |
| `navigation` | 5 | **5 app defects** (H-7 ×3, M-1 ×2) — one was masked by a test bug |
| `list-limits` | 1 | 🟡 **App defect** → M-5 |

**The masked defect** — `navigation.spec.ts:114` failed on a strict-mode collision:
```
strict mode violation: getByRole('button', { name: /notifications/i }) resolved to 2 elements:
  1) sidebar nav "Notifications"      2) header bell aria-label="Notifications"
```
✅ **Fixed in this audit** (scoped to the header control). The test then failed again on its real assertion — the bell renders no panel. The locator bug had been hiding an application defect.

**The one skipped test** — `accessibility.spec.ts:180` "a dialog traps focus and closes on Escape". Focus trapping is a common real-world a11y failure; this should be unskipped.

### Coverage by module

| Module | Coverage | Notes |
|---|---|---|
| OBE attainment (CLO/PLO/LLO/PEO) | 🟢 Excellent | 26 tests incl. boundary cases, empty denominators, "no data ≠ 0%" |
| Attendance | 🟢 Excellent | 16 tests: sessions, excused absences, eligibility |
| Marks entry / results / transcripts | 🟢 Good | 22 tests incl. repeat-course supersession |
| OBE configuration | 🟢 Good | 10 tests: mapping weight bounds, thresholds |
| Access control | 🟡 Partial | 17 tests, but 33 unguarded handlers untested |
| Auth | 🟡 Partial | 8 tests — **no test for the C-1 bypass** |
| Responsive | 🟡 Partial | 3 viewports × student/faculty only |
| Accessibility | 🟡 Partial | Admin role only |
| **Account administration** | 🔴 **Broken** | 8/8 isolation tests fail |
| **Surveys** | 🔴 **None** | Incl. the unauthenticated `external-respond` / `respond-public` token flows |
| **Notifications** | 🔴 **Minimal** | 1 reference |
| **Bulk import** | 🟡 1 test | No malformed-CSV / duplicate / partial-failure cases |

### Coverage by role

| Role | Specs | Gap |
|---|---|---|
| admin | 15 | — |
| faculty | 7 | No a11y, no responsive, no navigation |
| student | 5 | No a11y beyond 3 pages, no CRUD |
| **super_admin** | **1** | 🔴 Only `access-control`. **No CRUD, no dashboard, no navigation, no a11y, no responsive.** The highest-privilege role is almost untested. |

### Coverage by dashboard

Smoke tests render **all 111 pages** across the 4 roles (page-level ✅). Functional depth: `/admin` 🟢 · `/faculty` 🟡 · `/student` 🟡 · `/super-admin` 🔴.

### Coverage estimate

| Layer | Estimate |
|---|---|
| API surface (paths referenced by specs) | **~34%** (65 / 190) |
| Page render coverage | **~100%** (smoke) |
| Page functional coverage | **~35%** |
| Role × capability matrix | **~45%** |
| **Weighted overall** | **≈ 40%** |

### Tests delivered by this audit ✅

Two new specs were written and one existing test was repaired. **All 12 new tests fail against the current code and pass once the corresponding finding is fixed** — they are the acceptance criteria for Phase 1.

**`e2e/tests/privilege-escalation.spec.ts`** (8 tests) — the unguarded-write gap:

| Test | Guards |
|---|---|
| student cannot reach the section delete handler at all | C-2 |
| student cannot delete a real section | C-2 |
| student cannot modify semesters | H-1 |
| student cannot create a PLO on a programme | H-1 |
| student cannot read the roster of their own batch | H-2 |
| faculty cannot create an assessment on an offering they do not teach | H-1 |
| dept admin cannot create a student in another department | H-3 |
| a failed delete leaves the account intact, not half-removed | C-4 |

**`e2e/tests/auth-bypass.spec.ts`** (4 tests) — the OTP-as-sole-credential flaw:

| Test | Guards |
|---|---|
| resend-otp refuses to mint a code for an anonymous caller | C-1 |
| resend-otp does not reveal whether an account exists | C-1 / L-2 |
| verify-otp rejects a code never preceded by a password | C-1 |
| a suspended user cannot keep using an existing token | H-6 |

**`e2e/tests/navigation.spec.ts`** — fixed the strict-mode locator collision, which unmasked a real defect (M-1).

Both new specs follow the suite's existing conventions: `storageState` per role, self-built and torn-down foreign tenants, and assertion messages that state the consequence rather than the value. The section-delete and account-deletion tests create their own disposable rows rather than mutating the shared fixture — an earlier draft used the seeded student and corrupted it for every later spec, which the run caught.

`tsc --noEmit` is clean with both files added.

### Further tests to add

**Priority 2 — coverage gaps:** a full super-admin suite (CRUD on departments/admins/super-admins, dashboard, navigation); survey lifecycle incl. the two public token endpoints; notification CRUD per role; suspended-user access revocation *(H-6)*; concurrent marks entry on one section; expired-session behaviour mid-form; bulk import with malformed/duplicate rows; a11y + responsive extended to faculty, student and super-admin.

**Priority 3 — hygiene:** ~~fix the strict-mode collision~~ ✅ done; unskip the focus-trap test; make `signOut` assert server-side invalidation *(L-10)*; add `@axe-core/playwright` for full WCAG coverage rather than hand-rolled checks; add a second browser project (Firefox/WebKit).

**Duplicates:** none found. **Refactors:** none needed — the suite's structure is sound.

---

## Production Readiness Checklist

| ✓ | Item | Status |
|---|---|---|
| ❌ | Security | 3 Critical, 6 High |
| ⚠️ | Performance | Client-only architecture; unbounded queries |
| ⚠️ | Accessibility | 8 failing tests; systemic unnamed controls |
| ⚠️ | UI consistency | Strong system; unfinished dark mode + dead controls |
| ⚠️ | API stability | 66% of writes unvalidated |
| ⚠️ | Database integrity | `Float` grades; 11 non-transactional handlers |
| ⚠️ | Error handling | Present but leaks internals in 23 places |
| ❌ | Logging | 305 raw `console.*`, no structure |
| ❌ | Monitoring readiness | None |
| ❌ | Role permissions | 33 unguarded handlers |
| ⚠️ | Test coverage | Excellent quality, ~40% breadth, 33 failing |
| ✅ | Responsive design | All responsive tests pass |
| ✅ | Code quality gates | `tsc --noEmit` clean; build does not suppress TS/ESLint errors |
| ⚠️ | Maintainability | Good helpers, inconsistently applied |
| ⚠️ | Scalability | DB-backed rate limiting ✅; no caching ❌ |
| ⚠️ | Deployment readiness | `vercel.json` + cron ✅; no security headers ❌ |

---

## Recommended Remediation Plan

### Phase 1 — Release blockers (~1.5 weeks)
1. **C-1** Bind OTP to a password-verified challenge cookie — *4h*
2. **C-2** Authorize `DELETE /api/sections` — *30m*
3. **C-3** Apply `canManageUser()` to all 6 account routes; protect `super_admin` targets — *4h*
4. **C-4** Wrap cascading deletes in `$transaction` — *2h*
5. **H-2** Authorize the batch roster — *30m*
6. **H-4** Remove `$disconnect()` — *5m*
7. **H-3** Ignore body `departmentId` for non-super-admins — *1h*
8. **H-5** Add security headers — *2h*
9. **H-1** Apply `authorize()` + `can*()` across the 33 handlers — *2–3d*
10. ~~Add regression tests for the Critical findings~~ ✅ **done — 12 tests delivered**
11. **Add a CI check** rejecting bare `requireAuth` in `src/app/api/**` — *4h*

**Exit criterion: the Playwright suite is green — including the 12 new tests, which currently fail by design.**

### Phase 2 — Production hardening (~2 weeks)
**H-6** session revocation · **M-2** zod on all writes · **M-6** stop leaking exceptions · **M-7** Sentry + structured logging · **M-8** audit account + auth events · **M-9/M-10** super-admin lockouts · **M-4** remaining transactions · **M-11** aria-labels + shared `<RowActions>` · **H-7** build the 3 profile pages · **M-1** implement or remove search

### Phase 3 — Quality & scale (~4 weeks)
**M-3** `Float` → `Decimal` migration · **M-5** shared pagination · React Query standardisation · server-component conversion for read-heavy pages · `next/dynamic` for charts/PDF · finish dark mode + add a toggle · Priority-2 test coverage (especially super-admin) · N+1 elimination

---

## Architecture Assessment

**Strengths**
- Clean route-group separation: `(auth)` / `(authenticated-routes)` / `(public)` / `(LandingPages)`
- Centralised authorization vocabulary in `src/lib/authz.ts` — genuinely well-designed, with comments documenting the attack each helper prevents
- Domain logic isolated in `src/lib/obe.ts` (1,006 lines), `attendance.ts`, `obe-report.ts` — not smeared across routes
- Consistent design system: shadcn/ui over Radix primitives (33 UI components)
- Schema discipline: 49 unique constraints, 108 indexes across 58 models
- Build gates enforced — `next.config.ts` explicitly refuses to suppress TypeScript or ESLint errors, with a comment explaining why
- `tsc --noEmit` passes cleanly

**Weaknesses**
- **Helpers exist but are not enforced.** This is the single defining problem: `authz.ts` is excellent and `canManageUser` is called exactly once. Nothing structurally prevents a new route from skipping it.
- **Two data-fetching paradigms** — React Query in 2 pages, raw `useEffect` in 102
- **Client-heavy** — 106/111 pages `'use client'`, forfeiting the App Router's model
- **Validation inconsistency** — rigorous zod in auth, absent in 66% of other writes
- **Inconsistent authorization idioms** — `requireAuth` + inline string comparison, `requireRole`, and `authorize()` all coexist across 190 routes

**The one structural recommendation:** introduce a `withAuth(handler, { roles, resource })` wrapper that makes authorization **impossible to omit** rather than merely available. Combined with the CI check in Phase 1, that converts this entire class of vulnerability from recurring to structurally prevented.

---

## Verdict

**Do not deploy to production in the current state.**

Three Critical findings were **proven by live exploitation**, not inferred: a password-less admin session, a student deleting sections, and a student harvesting classmate PII. The application's own test suite independently fails 33 tests confirming a systemic authorization gap.

That said, the distance to production is **shorter than the score suggests**. This is not a project that needs rearchitecting to be made safe. The security model is designed and largely written — it is simply not wired into 33 handlers. **Phase 1 is roughly 1.5 weeks of mechanical, low-risk work**, and it is verifiable: when the existing suite goes green, the Critical and most High findings are closed.

The OBE domain logic, the attainment engine, and the Playwright suite are the strongest parts of this codebase and need no remediation. The gap is entirely in the API authorization layer, and it is well-bounded.

---

# Post-Remediation Status

**Date applied:** 2026-08-01 (same session as the audit)

```
BEFORE:  33 failed ·  1 skipped · 334 passed   (368 total)
AFTER:    0 failed ·  1 skipped · 379 passed   (380 total)   ✅
```

Verified across three consecutive full runs. `tsc --noEmit` clean, new files lint clean, `next build` passes with the type and lint gates still enforced.

**The suite being green does not mean this report is closed.** Everything below was re-verified by scanning the codebase after the fixes, not from memory.

## Findings ledger — verified state

### Critical — 4 of 4 closed ✅

| ID | State |
|---|---|
| C-1 Password-less authentication | ✅ Fixed |
| C-2 Any user can delete sections | ✅ Fixed |
| C-3 Dept admin can delete/demote the super admin | ✅ Fixed |
| C-4 Non-atomic cascading delete | ✅ Fixed |

### High — 6 of 7 closed

| ID | State | Evidence |
|---|---|---|
| H-1 Handlers with bare `requireAuth` | ⚠️ **9 of 33** | **24 remain**, all `GET`. Every unguarded *write* is closed. |
| H-2 Batch roster PII | ✅ Fixed | |
| H-3 Cross-tenant student creation | ✅ Fixed | |
| H-4 `$disconnect()` on shared client | ✅ Fixed | |
| H-5 No security headers | ✅ Fixed | |
| H-6 Suspended users keep access | ✅ Fixed | |
| H-7 Dead Profile links | ✅ Fixed | |

### Medium — 4 of 11 closed

| ID | State | Verified count |
|---|---|---|
| M-1 Dead search + notifications | ✅ Fixed | |
| M-2 Unvalidated write handlers | ⚠️ Partial | **65 of 100 still unvalidated** (was 66) — only the marks path was done |
| M-3 `Float` for grades | ❌ **Open** | 51 `Float` columns unchanged |
| M-4 Non-transactional multi-writes | ⚠️ Partial | **9 remain** (was 11) |
| M-5 Unbounded `findMany` | ⚠️ Partial | **241 of 261 still unbounded** (only `/api/programs` fixed) |
| M-6 Raw exception messages | ✅ Fixed | 0 client-facing leaks remain |
| M-7 No observability | ❌ **Open** | no Sentry / structured logging |
| M-8 Audit coverage | ⚠️ Partial | `user.*` events wired; **`auth.login_success/failure/logout` types added but never called** |
| M-9 Super-admin lockouts | ⚠️ Partial | `admin/llo-attainments` and `courses/offerings` **still locked out** |
| M-10 Super admin cannot resend OTP | ✅ Fixed | |
| M-11 Unnamed icon controls | ✅ Fixed | 74 labelled, 18 false positives reverted |

### Low — 1 of 11 closed

Only **L-9** (notifications route) is fixed. Still open: L-1 dead `check-reset-token` route (with its own `PrismaClient`), L-2 login enumeration/timing, L-3 mixed-language comments, L-4 `require()` in ESM (2 sites), L-5 dynamic `await import()` (**33 sites — I added some**), L-6 unvalidated `parseInt`, L-7 `/surveys` prefix match, L-8 double `verifyToken` in the proxy, L-10 no-op `signOut` helper, L-11 localStorage.

### Untouched entirely

- **Performance**: client-only architecture (106/111 pages), React Query in 2 of 111, bundle splitting, N+1 loops, caching
- **Missing features**: dark mode (53 of 190 `.tsx` files carry `dark:`), rate limiting outside auth
- **Test coverage**: Priority-2 and Priority-3 gaps — super-admin is still the thinnest role at 1 spec, surveys have no coverage

## Revised scores

| Dimension | Before | After | Note |
|---|---:|---:|---|
| **Production Readiness** | 42 | **72** | Blockers closed; report not closed |
| Security | 40 | **74** | 24 unguarded reads keep this off 85+ |
| Testing | 62 | **72** | +12 regression tests, suite green; coverage breadth unchanged |
| UI / UX | 62 | **76** | Profile, search, notifications now real |
| Accessibility | 55 | **74** | 74 controls named |
| Database Integrity | 55 | **64** | Deletes atomic, marks server-authoritative; `Float` untouched |
| Maintainability | 58 | **66** | Helpers applied where tested |
| Performance | 45 | **47** | Pagination only |
| Scalability | 50 | **54** | Pool bug fixed |
| **Overall** | **51** | **68** | |

## Two extras found while fixing

- **`/api/notifications` returned every notification in the system to any admin**, cross-department. Now scoped to the caller or to a user they can administer. `notifications/[id]` DELETE was admin-only (locking out super admins, stopping users dismissing their own) and returned 401 for an authorization failure.
- **`/api/assessment-results` trusted the client's `totalMarks`** — the denominator of its own grade. The server now reads the maximum from `assessmentitems`. `NaN` previously passed the negative check (`NaN < 0` is false) and reached a `Float` column.

## What to do next, in order

1. **Finish H-1** — the 24 remaining `GET` handlers. Mechanical; the helpers exist. *~1 day.*
2. **Add the CI guard** banning bare `requireAuth` in `src/app/api/**`. Without it this recurs. *~4h.*
3. **M-3 `Float` → `Decimal`** — the highest-value correctness item left. *~3 days incl. migration and backfill.*
4. **M-7 observability** before any real deployment. *~1 day.*
5. **M-8** — wire the auth events whose types already exist. *~2h.*
6. **M-9** — the two remaining super-admin lockouts. *~1h.*
7. M-2 / M-4 / M-5 sweeps, then the performance work.

## The `Float` risk, restated

M-3 is the one open item with real correctness consequences. Marks, GPA, thresholds and attainment percentages are all `Float` (MySQL `DOUBLE`). The suite has a test named *"one of two passing is exactly 50% and still counts as attained"* — that boundary is exactly where binary floating point can flip a pass to a fail. It passes today, but on values that happen to be representable. Until those columns are `Decimal`, a student can in principle be recorded as missing a CLO or a graduation criterion because of representation error.
