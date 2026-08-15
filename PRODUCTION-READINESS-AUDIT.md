# EduTrack OBE — Production Readiness Audit

**Audit date:** 2026-08-01
**Scope:** `fyp/` — Next.js 16.0.7 / React 19.2 / Prisma 6.9 / MySQL, 190 API route files, 111 pages, 4 roles, 26 Playwright specs
**Method:** full source review + full Playwright run (368 tests) + live exploitation against a running production build

---

> ## ✅ REMEDIATION — three passes, all Critical and High closed
>
> **4 of 4 Critical · 7 of 7 High · 9 of 11 Medium · 6 of 11 Low**, plus
> **6 further defects found in three fresh sweeps** — see *Third Pass* (2 High,
> 1 Medium: unauthenticated survey token minting and response stuffing),
> *Fourth Pass* (1 High: two endpoints the UI calls that never existed) and
> *Fifth Pass* (1 High: the admin assessments page could never load its data).
>
> **One incomplete feature stands: rubrics have a database, an API, domain
> logic and tests, but no user interface.**
>
> Two Medium items remain partial by decision (M-2 validation, M-3 `Float`
> columns), both documented with the reason.
>
> ```
> ORIGINAL:  33 failed ·  1 skipped · 334 passed  (368 tests)
> NOW:        0 failed ·  1 skipped · 471 passed  (472 tests)   ✅
> ```
>
> `tsc --noEmit` clean · `next build` passes · a new `prebuild` gate fails the
> build if any API handler authenticates without authorizing.
>
> Findings are annotated below with their state: **✅ FIXED**, **⚠️ PARTIAL**,
> or **❌ OPEN**. Scores in the executive summary are the original pre-fix
> assessment, kept as the record of what was found.

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

> ✅ **FIXED — all 33 handlers.** `authorize()` + the matching `can*()` ownership helper applied across every one — `plos`, `ploattainments/trends`, `programs/[id]/batches`, `programs/[id]/plos` (GET **and** POST), `batches/[id]/sections`, `courses/offerings/[id]`, `semesters::PATCH`, `assessments::POST`. Unscoped listings now fall back to `resolveDepartmentScope()` instead of returning the whole table. `assessments::POST` additionally checks `canManageCourseOffering()` and `assertResultsUnlocked()`.
>
> The remaining 24 `GET` handlers were finished in the second pass. Two new helpers — `programScopeFilter` and `courseScopeFilter` in `authz.ts` — express the shared rule once ("a named id is checked with `canAccessProgram`/`canAccessCourse`; no id scopes the listing to the caller's department") instead of repeating it 24 times. Enforced from now on by `scripts/check-route-authorization.mjs`, wired to `prebuild`.

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

# Third Pass — Fresh Sweep (2026-08-15)

A deliberate re-audit of areas the first two passes never examined closely: the
external survey flows, file upload, the cron endpoint, migrations, and the
role matrix. **It found three more real defects**, two of them High.

```
385 passed · 1 skipped · 0 failed
```

## N-1 — Anyone could mint a survey's public link token 🟠 High

`POST /api/surveys/[id]/public` carried the comment *"Requires admin auth"* and
checked **nothing**, while `proxy.ts` listed the path as public. Any anonymous
caller could ask for the token of any alumni/employer survey by id.

**Fixed.** The handler now calls `authorize(request, ['super_admin','admin','faculty'])`,
and the path was removed from `publicApiRoutePatterns` — minting a credential is
a staff action even though using it is not.

## N-2 — Anyone could stuff survey responses 🟠 High

`POST /api/surveys/[id]/external-respond` never looked at the token at all. The
survey id is a small integer in the URL, so anybody could walk `/1`, `/2`, `/3`
and submit unlimited responses to any active alumni or employer survey.

Those responses are averaged into **indirect PLO attainment** by
`accumulateSurveyRatings` — so the endpoint let an anonymous caller move a
figure an accreditation review reads.

**Fixed.** A shared `surveyForToken()` guard now verifies `surveys.publicToken`
on both the GET and the POST, answering the same 404 for a missing survey and a
wrong token so the endpoint cannot be used to enumerate survey ids.

**Why these two survived two passes:** the survey subsystem had *zero* test
coverage — noted in the original report under "Coverage by module", and not
acted on. `e2e/tests/survey-access.spec.ts` now covers it (6 tests), including
that a legitimate holder of the token still gets through.

## N-3 — The super admin was locked out of 21 more endpoints 🟡 Medium

M-9 was reported as two routes; a full sweep of the role matrix found the same
pattern at **23 sites across 19 files** — `role !== 'admin'` with no
`super_admin` branch. LLOs, LLO-PLO mappings, pass/fail criteria, programme
curriculum, action plans, bulk user import, user creation, the admin overview
and academic records were all unreachable for the highest-privilege role.

**Fixed** at 22 sites. The two that needed department scoping were converted to
`resolveDepartmentScope`. One exclusion was left in place —
`admin/check-department` documents that a super admin has no department to
check, which is correct.

## Also fixed in this pass

- **Unbounded CSV upload.** `POST /api/users/import` read the whole file into
  memory with no size check. Now capped at 2 MB with a message that says what
  to do about it.

## The guard had the same blind spot

`scripts/check-route-authorization.mjs` did not catch N-1 or N-2, because it
only inspected handlers that call `requireAuth` — a handler with *no*
authentication was invisible to it, which is the more dangerous case.

It now fails on both: authenticating without authorizing, **and** establishing
no caller identity while not being listed as public. `surveys/[id]/public` was
removed from `PUBLIC_ROUTES` so it is actually checked; the two genuinely public
survey routes carry a reason naming the token they verify.

Verified both ways again: passes on the current tree, fails on a deliberately
unguarded handler.

---

# Fourth Pass — A-to-Z Feature Verification (2026-08-15)

A completeness sweep rather than a security one: every navigation entry against
its page, every `fetch()` in the UI against its API route, stub/TODO markers,
and a feature inventory of the OBE domain.

```
389 passed · 1 skipped · 0 failed   ·   tsc clean · build passes · authz guard passes
```

## What was clean

| Check | Result |
|---|---|
| Navigation entries → page exists | **73 / 73** ✅ |
| Real `TODO`/`FIXME`/"not implemented" markers | **0** ✅ |
| Stub pages | none — the 7-line files are the shared `ProfileView` wrappers |
| Prisma migrations | present and versioned (2 + lock file) ✅ |
| Cron endpoint | properly guarded by `CRON_SECRET`, 503 when unset ✅ |
| Every OBE domain area (PEO/PLO/CLO/LLO, mappings, attainment, attendance, surveys, transcripts, reports, graduation, curriculum, Bloom) | has API + UI ✅ |

## F-1 — Two endpoints the UI calls did not exist 🟠 High

Comparing all 168 distinct API calls in the UI against the 190 route files
turned up two that had **no backing route at all**:

**`/api/courses/[id]/llos/plo-mappings`** — called by
`faculty/results/llo-attainments`. Its `catch` only writes to the console, so
the "LLO-PLO Mappings" panel rendered *"No LLO-PLO mappings found"* permanently,
whatever the mappings were. A silent 404 is indistinguishable from empty data.

**`/api/departments/[id]/programs`** — called by `faculty/students/[id]` to fill
the programme dropdown. It surfaced a "Failed to fetch programs" toast, so the
field could never be populated and the student edit form could not be
completed.

**Fixed.** Both routes written, authorized like their neighbours
(`canAccessCourse` for the first, department scoping for the second), and
covered by `e2e/tests/missing-endpoints.spec.ts` (4 tests).

The CLO equivalent (`clos/plo-mappings`) had existed all along — only the LLO
half was missing, which is why the gap looked like a data problem rather than a
missing route.

## F-2 — Rubrics are backend-only ⚠️ Incomplete feature

Not a bug — a feature that was built halfway:

| Layer | State |
|---|---|
| Database | `rubrics`, `rubric_criteria`, `rubric_scores` — 3 models ✅ |
| API | `/api/rubrics`, `/api/rubrics/[id]`, `/api/assessment-results/[id]/rubric-score` ✅ |
| Domain logic | `RUBRIC_LEVEL_FRACTIONS`, `scoreFromRubric()` in `obe.ts` ✅ |
| Tests | covered in `records.spec.ts` ✅ |
| **User interface** | **none — the word "rubric" does not appear anywhere in `src/app/(authenticated-routes)` or `src/components`** ❌ |

A faculty member cannot create, edit or apply a rubric through the application.
The capability exists and is reachable only by calling the API directly.

**Not fixed here.** This is feature development, not remediation — it needs a
criteria/levels builder and wiring into assessment-item scoring, plus decisions
about who may edit a rubric once marks have been recorded against it. Building
it half-guessed would be worse than leaving the gap documented.

## Also fixed

- **`POST /api/users/import`** read an entire uploaded CSV into memory with no
  size check. Capped at 2 MB with an actionable message.
- **21 further super-admin lockouts** (see *Third Pass*, N-3). One remains and
  is correct: `admin/check-department` documents that a super admin has no
  department to check.

---

# Fifth Pass — Runtime Verification (2026-08-15)

The first four passes read code and asserted API behaviour. This one asks a
different question: **when a real browser opens each page, does anything
actually fail?**

`e2e/tests/runtime-health.spec.ts` visits all **82 dashboard pages** across the
four roles and asserts three things per page: no console error, no failed
same-origin request, and **no API call returning 4xx/5xx**.

That last one matters most. `smoke.spec.ts` proves a page *renders* — but a page
whose data call 404s renders too, just empty, and the two look identical from
outside. That is precisely how the missing LLO-PLO endpoint survived.

```
471 passed · 1 skipped · 0 failed
```

## F-3 — The admin's assessments page could never load its data 🟠 High

`/admin/assessments` renders the shared `AssessmentList` and
`CreateAssessmentForm` components, which call `/api/faculty/course-offerings`.
That route resolved the caller **only** through `getFacultyIdFromRequest`, which
returns null for anything that is not a faculty account — so every load of the
admin assessments screen got a **401** and the course-offering selector was
permanently empty.

The page rendered fine, so it read as "no course offerings exist" rather than a
broken call. No test caught it because no test asserted the network.

**Fixed.** The endpoint is now role-aware, answering the same shape to a
slightly different question per role:

| Role | Gets |
|---|---|
| faculty | the offerings they teach, with their sections |
| admin | the offerings in their department, with all sections |
| super_admin | the same, unscoped |

## One false positive, correctly identified

`/student` reported two "failed" requests to `/student/courses/342?_rsc=…`.
Those are Next's React-payload prefetches for links in view, aborted when the
router navigates away — the framework working as designed, not a defect. The
check now ignores `_rsc=` aborts rather than being taught to ignore failures
generally.

## Standing state after five passes

| Gate | Result |
|---|---|
| Playwright | **471 passed · 1 skipped · 0 failed** |
| `tsc --noEmit` | clean |
| `npm run build` | passes |
| Authorization guard (`prebuild`) | passes |
| All 82 dashboard pages, 4 roles | runtime-clean |
| 73 navigation entries | all resolve |
| 168 UI API calls | all resolve |

---

# Post-Remediation Status

**Second remediation pass — 2026-08-15**

```
ORIGINAL:  33 failed ·  1 skipped · 334 passed   (368 total)
NOW:        0 failed ·  1 skipped · 379 passed   (380 total)   ✅
```

Green across five consecutive full runs. `tsc --noEmit` clean; `next build` passes with type and lint gates enforced, and now with an authorization gate in front of it.

Every number below was re-measured against the codebase after the changes, not carried over from the previous pass.

## Findings ledger — verified

### Critical — 4 of 4 closed ✅

C-1 password-less authentication · C-2 section deletion · C-3 account-admin IDOR · C-4 non-atomic deletes.

### High — 7 of 7 closed ✅

| ID | Verified |
|---|---|
| **H-1** Handlers with bare `requireAuth` | **33 → 0** |
| H-2 Batch roster PII | closed |
| H-3 Cross-tenant student creation | closed |
| H-4 `$disconnect()` on shared client | closed |
| H-5 No security headers | closed |
| H-6 Suspended users keep access | closed |
| H-7 Dead Profile links | closed |

H-1 was finished in this pass. The 24 remaining `GET` handlers were authorized through `authorize()` plus an ownership helper, using two new helpers — `programScopeFilter` and `courseScopeFilter` — so the "named id → check it; no id → scope to the caller's department" rule is written once rather than 24 times.

### Medium — 9 of 11 closed, 2 partial

| ID | State | Verified |
|---|---|---|
| M-1 Dead search + notifications | ✅ | |
| M-2 Unvalidated write handlers | ⚠️ **Partial** | **58 of 100** remain (was 66) |
| M-3 `Float` for grades | ⚠️ **Mitigated, not migrated** | see below |
| M-4 Non-transactional multi-writes | ✅ | **11 → 2**, both intentional and documented |
| M-5 Unbounded / truncating listings | ✅ | 8 endpoints fixed |
| M-6 Raw exception messages | ✅ | **0** client-facing leaks |
| M-7 No observability | ✅ | `src/lib/logger.ts` |
| M-8 Audit coverage | ✅ | `user.*` + `auth.*` wired (5 call sites) |
| M-9 Super-admin lockouts | ✅ | both remaining routes fixed |
| M-10 Super admin cannot resend OTP | ✅ | |
| M-11 Unnamed icon controls | ✅ | |

### Low — 6 of 11 closed

Closed: **L-1** dead `check-reset-token` route deleted · **L-4** `require()` → `import` (bcrypt now type-checked) · **L-6** `parseInt` validation on the raw-SQL path · **L-7** `/surveys` prefix match now segment-aware · **L-8** double `verifyToken` in the proxy removed · **L-9** notifications route.

Still open: L-2 login timing oracle, L-3 mixed-language comments, L-5 dynamic imports (33 sites), L-10 no-op `signOut` test helper, L-11 localStorage.

## The two that are not simply "done"

### M-3 — `Float` grades: mitigated, migration still open

The audit named the risk as *"a student recorded as failing a CLO because of representation error"*. That specific defect is now fixed; the schema change is not.

**What was done.** Every threshold comparison in the system now goes through `meetsThreshold()` in `src/lib/obe.ts`, which compares with a 1e-9 tolerance, and stored percentages are rounded to four decimal places by `roundPercentage()`. Applied at 13 sites across `obe.ts`, `obe-report.ts`, the student CLO/LLO/PLO attainment routes, transcript, analytics, PEO attainment, graduation status and the LLO calculation. `(3/5)*100 = 60.00000000000001` no longer decides anything.

**What was not done, and why.** Migrating the 51 `Float` columns to `Decimal` would be actively dangerous done blind. Prisma returns `Decimal` objects, not numbers — `sum + item.marks` stops being arithmetic and starts being string concatenation, silently. There are **434 arithmetic sites across 52 files** consuming these fields. Changing the schema without rewriting all of them produces corrupt grades that still look like numbers, which is worse than the drift it fixes. It needs its own change window, a data backfill and a verification plan against real transcripts.

### M-2 — validation: the numeric paths, not all 100

58 of 100 write handlers still lack a schema. The ones done in this pass were chosen because they write the numbers the attainment engine consumes, where a bad value corrupts every figure derived from it rather than failing loudly:

`pass-fail-criteria` and `graduation-criteria` (the thresholds that decide passing and graduation) · `clo-plo-mappings` and `llo-plo-mappings` (the weights `weightedAverage` divides by — a `NaN` here makes every downstream attainment `NaN`) · `assessments/[id]` (`totalMarks`, `weightage`) · `assessment-results/[id]` · and `assessment-results` marks entry from the first pass, which now also takes the per-item maximum from the database instead of trusting the client.

The remaining 58 are mostly CRUD over names, codes and descriptions. They should still be done; nothing derived from them silently becomes `NaN`.

## What stops H-1 recurring

`scripts/check-route-authorization.mjs`, wired to `prebuild` — so `npm run build` fails if any API handler calls `requireAuth` and then authorizes nothing.

It was verified both ways: it passes on the current tree, and it fails with a pointed message when a deliberately unguarded handler is introduced. Genuinely public routes live in an explicit `PUBLIC_ROUTES` map, each with a reason, so adding one is a visible decision rather than a silent omission.

## Revised scores

| Dimension | Original | Now | Note |
|---|---:|---:|---|
| **Production Readiness** | 42 | **84** | Critical + High all closed, guarded by CI |
| Security | 40 | **88** | Authorization complete and enforced at build time |
| Testing | 62 | **74** | +12 regression tests; coverage breadth unchanged |
| UI / UX | 62 | **76** | Profile, search, notifications real |
| Accessibility | 55 | **74** | 74 controls named |
| Database Integrity | 55 | **74** | Deletes atomic, thresholds tolerant, marks server-authoritative |
| Maintainability | 58 | **76** | Helpers applied uniformly; scope filters extracted |
| Performance | 45 | **50** | Pagination only; architecture untouched |
| Scalability | 50 | **56** | Pool bug fixed; caching still absent |
| **Overall** | **51** | **76** | |

## Deliberately not attempted

| Item | Why |
|---|---|
| `Float` → `Decimal` migration | 434 arithmetic sites; needs a change window and data backfill. See above. |
| Client-only architecture (106/111 pages `'use client'`) | 2–3 week rework. Correctness unaffected. |
| React Query standardisation (102 pages on raw `useEffect`) | Same. |
| Remaining 241 unbounded `findMany` | The truncating ones are fixed; a shared `paginate()` across all listings is a larger sweep. |
| Dark mode completion (~half the pages) | Needs per-screen design decisions. |
| Sentry/APM wiring | `logger.reportError()` is the seam; the DSN and sampling policy are a deployment decision. |
| Priority-2/3 test coverage | super-admin is still the thinnest role at 1 spec; surveys have none. |

## Next, in order

1. **M-3 `Float` → `Decimal`** — the mitigation holds the boundary case, but the columns are still wrong.
2. **M-2** — the remaining 58 handlers.
3. **Sentry** — implement `reportError()` before the first real deployment.
4. **Test coverage** — super-admin CRUD, surveys, notifications.
5. L-2, L-5, L-10, L-11.
