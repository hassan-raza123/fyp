#!/usr/bin/env node
/**
 * Fail the build when an API route handler authenticates but never authorizes.
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
  ['surveys/respond-public', 'external respondents; the token is the credential'],
  ['surveys/[id]/public', 'external respondents; the token is the credential'],
  ['surveys/[id]/external-respond', 'external respondents; token-authenticated'],
  ['cron/update-semester-statuses', 'authenticates with CRON_SECRET'],
  ['e2e/otp', 'test-only; 404s unless E2E_TEST_MODE and a local host'],
]);

const ROLE_CHECK =
  /\bauthorize\s*\(|\brequireRole\s*\(|\.role\s*[!=]==?\s*['"]|\.includes\(\s*(?:user|auth)/;

const OWNERSHIP_CHECK =
  /\bcan[A-Z]\w+\s*\(|resolveDepartmentScope|departmentFilter|ScopeFilter|getDepartmentIdFromRequest|getCurrentDepartmentId|getFacultyIdFromRequest|getStudentIdFromRequest|getFacultyFromRequest|getStudentFromRequest/;

const HANDLER = /export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\b/g;

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

  const marks = [...source.matchAll(HANDLER)];
  for (let i = 0; i < marks.length; i++) {
    const start = marks[i].index;
    const end = i + 1 < marks.length ? marks[i + 1].index : source.length;
    const body = source.slice(start, end);

    // Only handlers that authenticate at all are in scope; one that does not
    // touch requireAuth is either public (listed above) or already broken in a
    // way this check is not about.
    if (!body.includes('requireAuth(')) continue;
    if (ROLE_CHECK.test(body) || OWNERSHIP_CHECK.test(body)) continue;

    violations.push(`${file}::${marks[i][1]}`);
  }
}

if (violations.length > 0) {
  console.error(
    `\n✖ ${violations.length} API handler(s) call requireAuth() and then authorize nothing.\n`
  );
  for (const v of violations) console.error(`    ${v}`);
  console.error(
    [
      '',
      'A valid token is not permission. Add one of:',
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
