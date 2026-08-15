# Attainly

**Outcome-Based Education management, built for accreditation.**

Attainly tracks CLO, PLO and PEO attainment across an institution's programmes,
runs the assessment and grading workflow that produces the underlying data, and
generates the evidence an accreditation panel asks for — continuously, rather
than in the scramble before a visit.

Built with Next.js 16, React 19, TypeScript and Prisma on MySQL.

---

## Status

The application currently serves **one institution per deployment**. There is no
tenant model: the top of the hierarchy is `departments`, and `Settings` is a
singleton row. Running it for a second institution means a second database and a
second deployment.

Institution-specific branding (name, short name) is a setting rather than a
hardcoded string — see `src/lib/branding.ts`. Product identity lives in
`src/constants/branding.ts`.

## Quick start

```bash
npm install

cp .env.example .env
# Fill in DATABASE_URL, JWT_SECRET, CRON_SECRET and SEED_ADMIN_EMAIL.
# JWT_SECRET must be at least 32 characters — the app refuses to start without it.

npx prisma migrate deploy   # or `npm run db:migrate` in development
npm run seed                # creates the first super admin, prints its password once

npm run dev
```

The seeded super admin is created with `must_change_password` set, so the
generated password has to be replaced at first sign-in.

> `npm run seed` **wipes** the database before seeding. It is for a fresh
> installation, never for one holding real data.

## Environment variables

Every variable the code actually reads is documented in `.env.example`. In
summary:

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | MySQL connection string |
| `JWT_SECRET` | yes | Session token signing; min 32 chars, no fallback |
| `CRON_SECRET` | in production | Authenticates `/api/cron/*`; the route returns 503 without it |
| `NEXT_PUBLIC_APP_URL` | yes | Base URL for password-reset and survey links |
| `GMAIL_USER` / `GMAIL_APP_PASSWORD` | yes | Outbound mail — see the caveat below |
| `SEED_ADMIN_EMAIL` | for seeding | Owner of the first super admin account |
| `SEED_ADMIN_PASSWORD` | no | Fixes the seeded password instead of generating one |
| `E2E_TEST_MODE` | no | Enables the test-only OTP readback route |

**Mail is a known gap.** `src/lib/email-utils.ts` sends through Gmail with an app
password. That is fine for development and will not hold up in production: app
passwords get throttled and the mail lands in spam, which silently breaks
password resets and OTP sign-in. Move to a real sending provider on a domain you
control, with SPF, DKIM and DMARC.

## Authentication and authorization

Authentication is a custom JWT flow built on `jose`, with an OTP challenge and a
forced-password-change gate. **NextAuth is not used** — there is no
`/api/auth/[...nextauth]` route. A NextAuth credentials provider previously
existed and was removed deliberately: it duplicated the login flow while
skipping both OTP verification and the password-change gate, giving a second and
weaker way in.

`src/proxy.ts` verifies only that a request carries a *valid token*. It does not
enforce roles or ownership on `/api/*` — **every route authorizes itself**, using
the shared helpers in `src/lib/authz.ts` (`authorize`, `canAccessStudent`,
`canManageCourse`, `resolveDepartmentScope`, …).

`scripts/check-route-authorization.mjs` enforces this and runs on `prebuild`, so
a handler that authenticates without authorizing is a **build failure**, not a
review comment. Genuinely public routes are listed there with a reason.

## Roles

| Role | Scope |
| --- | --- |
| `super_admin` | The whole installation. Creates departments, assigns admins. |
| `admin` | One department. |
| `faculty` | The sections they teach. |
| `student` | Their own records. |

## Project structure

```
src/
├── app/
│   ├── (auth)/                  # Login, OTP, password reset
│   ├── (authenticated-routes)/  # Role dashboards
│   ├── (public)/                # External survey response pages
│   ├── (LandingPages)/          # Marketing site
│   └── api/                     # 190 route handlers
├── components/
├── constants/branding.ts        # Product identity
├── lib/
│   ├── authz.ts                 # Authorization helpers — start here
│   ├── branding.ts              # Per-installation identity, from Settings
│   ├── obe.ts                   # Attainment calculation
│   └── obe-report.ts            # Accreditation reporting
└── types/
prisma/
├── schema.prisma                # ~60 models
└── seed.js
e2e/                             # 29 Playwright specs
```

## Scripts

```bash
npm run dev              # development server
npm run build            # production build (runs the authorization check first)
npm run check:authz      # authorization gate on its own
npm run db:migrate       # create and apply a migration
npm run db:studio        # Prisma Studio
npm run seed             # wipe and seed — fresh installations only
npm run test:e2e         # Playwright suite
npm run test:e2e:ui      # Playwright in UI mode
```

## Security

- JWT sessions in an httpOnly, SameSite=strict cookie
- Per-route role and ownership checks, enforced at build time
- bcrypt password hashing, forced change on first sign-in and after admin reset
- OTP challenge on login
- Rate limiting backed by the `rate_limits` table
- Audit logging on sensitive mutations
- CSP and security headers set in `next.config.ts` — the CSP still allows
  `'unsafe-inline'` on `script-src` for Next's bootstrap; a nonce-based policy
  is the intended follow-up
