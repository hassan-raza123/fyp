#!/usr/bin/env node
/**
 * Fail the build when an API route handler is not properly guarded.
 *
 * Two ways to fail: authenticating without authorizing, or establishing no
 * caller identity at all while not being listed as public.
 *
 * `src/proxy.ts` only verifies that a request carries a *valid token* — it does
 * not enforce roles or ownership on `/api/*`. Every route has to do that
 * itself, and 33 of them once did not: a student could delete a section, read
 * any batch's roster, or enumerate every programme's outcomes.
 *
 * Those were fixed one by one. This is what stops the next one being written:
 * a handler that calls `requireAuth` and nothing else is a build failure, not
 * a finding somebody has to notice in review.
 *
 * A handler passes when it does any of:
 *   - calls `authorize(...)` or `requireRole(...)`
 *   - compares `user.role` itself
 *   - calls an ownership helper (`canAccessX`, `canManageX`, a scope filter)
 *
 * Genuinely public routes are listed in PUBLIC_ROUTES below, with a reason.
 * Adding to that list should be a deliberate, reviewed act.
 *
 * Run: node scripts/check-route-authorization.mjs
 */

import { readFileSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';

const API_DIR = 'src/app/api';

/** Routes that are unauthenticated by design. Each needs a reason. */
const PUBLIC_ROUTES = new Map([
  ['auth/login', 'issues the session; nothing to authorize yet'],
  ['auth/logout', 'clears the cookie; must work even for a dead session'],
  ['auth/forgot-password', 'anonymous by definition'],
  ['auth/reset-password', 'authenticated by the emailed token'],
  ['auth/verify-otp', 'authenticated by the OTP challenge cookie'],
  ['auth/resend-otp', 'authenticated by the OTP challenge cookie'],
  ['auth/verify', 'reports session validity to the client'],
  ['auth/change-password', 'the forced-change flow, before a session is usable'],
  ['contact', 'public contact form'],
  [
    'surveys/respond-public',
    'external respondents have no account; verifies surveys.publicToken',
  ],
  [
    'surveys/[id]/external-respond',
    'external respondents have no account; verifies surveys.publicToken',
  ],
  // `surveys/[id]/public` is deliberately absent: it *mints* the token rather
  // than verifying one, so it is a staff action and must be checked like any
  // other. It was listed here once, and that is exactly how it shipped
  // unauthenticated.
  ['cron/update-semester-statuses', 'authenticates with CRON_SECRET'],
  ['e2e/otp', 'test-only; 404s unless E2E_TEST_MODE and a local host'],
]);

/**
 * Anything that establishes *who* is calling.
 *
 * The `getXFromRequest` helpers call `requireAuth` internally and resolve the
 * caller to their own faculty/student row, so a handler using one is
 * authenticated and self-scoped even though `requireAuth` never appears in it.
 */
const AUTHENTICATION =
  /\brequireAuth\s*\(|\bauthorize\s*\(|\brequireRole\s*\(|getStudentFromRequest\s*\(|getStudentIdFromRequest\s*\(|getFacultyFromRequest\s*\(|getFacultyIdFromRequest\s*\(|getDepartmentIdFromRequest\s*\(|getCurrentDepartmentId\s*\(/;

const ROLE_CHECK =
  /\bauthorize\s*\(|\brequireRole\s*\(|\.role\s*[!=]==?\s*['"]|\.includes\(\s*(?:user|auth)/;

const OWNERSHIP_CHECK =
  /\bcan[A-Z]\w+\s*\(|resolveDepartmentScope|departmentFilter|ScopeFilter|getDepartmentIdFromRequest|getCurrentDepartmentId|getFacultyIdFromRequest|getStudentIdFromRequest|getFacultyFromRequest|getStudentFromRequest/;

const HANDLER = /export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\b/g;

/** Locally-declared functions, so a handler that delegates can be followed. */
const LOCAL_FUNCTION =
  /(?:async\s+)?function\s+(\w+)\s*\(|const\s+(\w+)\s*=\s*(?:async\s*)?\(/g;

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Routes where a role check alone is the whole answer, because the resource is
 * not owned by a department.
 *
 * This list exists because the check below is otherwise strict: any handler
 * that names a resource by id, and any write handler at all, must resolve
 * ownership and not merely a role. That rule is what the sixth audit pass
 * missed — `authorize()` was called everywhere, so the old check passed, while
 * the *write* half of a dozen resources never asked whose row it was. A
 * department admin could rewrite another department's PEOs, graduation
 * thresholds, curriculum, courses and sections; the matching GET returned 403.
 *
 * Adding an entry here is a statement that the resource is genuinely global or
 * self-scoped. It should be as deliberate as adding to PUBLIC_ROUTES.
 */
const UNSCOPED_ROUTES = new Map([
  ['semesters', 'the academic calendar is university-wide, not per-department'],
  ['semesters/[id]', 'same: a semester has no owning department'],
  ['departments', 'creating departments is a super-admin act; listing is reference data'],
  ['departments/[id]', 'the resource *is* the department; handlers compare ids inline'],
  ['departments/by-code', 'reference lookup by code'],
  ['settings', 'a single global settings row'],
  ['profile', 'always the caller\'s own row'],
  ['notifications', 'addressed to the caller; scoped by recipient, not department'],
  ['notifications/[id]', 'same'],
  ['users', 'creation assigns a department rather than reading one'],
  ['users/import', 'bulk creation, department taken from the caller'],
  ['contact', 'public contact form'],
  ['action-plans/suggestions', 'derives suggestions from the caller\'s own scope'],
  [
    'surveys/[id]/respond',
    'the respondent is resolved from the session; scoped to that student, not a department',
  ],
]);

/** Prefixes whose whole subtree is role-gated rather than department-scoped. */
const UNSCOPED_PREFIXES = [
  ['super-admin/', 'super-admin-only surface; the role *is* the authorization'],
  ['admins/', 'account administration, guarded by canManageUser where it applies'],
  ['admin/', 'department-admin self-service; resolves the caller\'s own department'],
  ['auth/', 'authentication endpoints'],
  ['e2e/', 'test-only'],
  ['cron/', 'authenticated by CRON_SECRET'],
];

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.name === 'route.ts') yield full;
  }
}

function routeKey(file) {
  return relative(API_DIR, file).replace(/[/\\]route\.ts$/, '');
}

const violations = [];

for await (const file of walk(API_DIR)) {
  const key = routeKey(file).split('\\').join('/');
  if (PUBLIC_ROUTES.has(key)) continue;

  const source = readFileSync(file, 'utf8');

  /**
   * Names of local functions that themselves resolve ownership, so a handler
   * delegating to one counts as checked. `assessments/[id]` does exactly this
   * with `requireAssessmentAccess`, and reporting it would be a false positive.
   */
  const ownershipHelpers = new Set();
  for (const m of source.matchAll(LOCAL_FUNCTION)) {
    const name = m[1] ?? m[2];
    if (!name || /^(GET|POST|PUT|PATCH|DELETE)$/.test(name)) continue;
    const after = source.slice(m.index, m.index + 1600);
    if (OWNERSHIP_CHECK.test(after)) ownershipHelpers.add(name);
  }
  const delegates = ownershipHelpers.size
    ? new RegExp(`\\b(?:${[...ownershipHelpers].join('|')})\\s*\\(`)
    : null;

  const isDynamic = key.includes('[');
  const unscoped =
    UNSCOPED_ROUTES.has(key) ||
    UNSCOPED_PREFIXES.some(([prefix]) => key.startsWith(prefix));

  const marks = [...source.matchAll(HANDLER)];
  for (let i = 0; i < marks.length; i++) {
    const start = marks[i].index;
    const end = i + 1 < marks.length ? marks[i + 1].index : source.length;
    const body = source.slice(start, end);

    /**
     * A handler that establishes no caller identity at all is the more
     * dangerous case, not a safe one to skip.
     *
     * The first version of this check only looked at handlers that called
     * `requireAuth`, on the assumption that anything else was public and
     * listed below. That assumption was wrong twice in the same subsystem:
     * `surveys/[id]/public::POST` minted a survey's public token for anyone
     * who asked, and `surveys/[id]/external-respond` accepted responses
     * against a guessable integer id — both invisible to a check that only
     * inspected authenticated handlers.
     */
    if (!AUTHENTICATION.test(body)) {
      violations.push({
        location: `${file}::${marks[i][1]}`,
        reason: 'establishes no caller identity and is not listed as public',
      });
      continue;
    }

    const hasRole = ROLE_CHECK.test(body);
    const hasOwnership =
      OWNERSHIP_CHECK.test(body) || (delegates !== null && delegates.test(body));

    if (!hasRole && !hasOwnership) {
      violations.push({
        location: `${file}::${marks[i][1]}`,
        reason: 'authenticates but authorizes nothing',
      });
      continue;
    }

    /**
     * A role is not ownership.
     *
     * `authorize(request, ['super_admin','admin'])` answers "are you an
     * admin", never "are you *this* department's admin". Any handler that
     * names a resource by id, and every write handler, has to answer the
     * second question too.
     */
    const needsOwnership =
      !unscoped && (isDynamic || WRITE_METHODS.has(marks[i][1]));

    if (needsOwnership && !hasOwnership) {
      violations.push({
        location: `${file}::${marks[i][1]}`,
        reason:
          'checks a role but never resolves ownership — a role is not a claim ' +
          'on a particular department\'s row',
      });
    }
  }
}

if (violations.length > 0) {
  console.error(`\n✖ ${violations.length} API handler(s) are not properly guarded.\n`);
  for (const v of violations) {
    console.error(`    ${v.location}`);
    console.error(`        ${v.reason}`);
  }
  console.error(
    [
      '',
      'A valid token is not permission, and no token at all is not public.',
      'Add one of:',
      '',
      "  const auth = await authorize(request, ['super_admin', 'admin']);",
      '  if (!auth.ok) return auth.response;',
      '',
      '  // and, when the request names a resource by id:',
      '  if (!(await canAccessSection(request, auth.user, sectionId))) {',
      '    return forbiddenResponse();',
      '  }',
      '',
      'If the route is genuinely public, add it to PUBLIC_ROUTES in',
      'scripts/check-route-authorization.mjs with a reason.',
      '',
    ].join('\n')
  );
  process.exit(1);
}

console.log('✓ every authenticated API handler also authorizes');
