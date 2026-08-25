/**
 * Turns an audit row into a sentence an administrator can read.
 *
 * The dashboards' own version of this expected `action` to be one of
 * 'CREATE' | 'UPDATE' | 'LOGIN' | 'LOGOUT', and expected `details` to carry
 * `entity`, `field`, `oldValue`, `newValue` and `entityId`. None of that is
 * what the audit trail writes. `writeAuditLog` records dotted actions —
 * 'rubric.create', 'marks.entry', 'graduation_criteria.update' — and a
 * free-form details object keyed per call site ('rubricId', 'code', 'name').
 *
 * So every row fell through to the catch-all branch and rendered as
 *
 *     clo.create on entity () [ID: ]
 *
 * with the literal word "entity" standing in for a name that was never
 * looked up, and two empty brackets where a field and an id would have gone.
 * That was the first thing a department admin saw on signing in.
 *
 * This reads the vocabulary that actually exists: split the action on the
 * dot, say the verb in English, name the subject, and add the record's own
 * name or code when the call site recorded one. Internal row ids are left
 * out — they mean nothing to the person reading the feed.
 */

const VERBS: Record<string, string> = {
  create: 'Created',
  update: 'Updated',
  delete: 'Deleted',
  remove: 'Removed',
  add: 'Added',
  archive: 'Archived',
  lock: 'Locked',
  unlock: 'Unlocked',
  submit: 'Submitted',
  approve: 'Approved',
  entry: 'Entered marks for',
  bulk_entry: 'Entered marks in bulk for',
  evaluate: 'Evaluated',
  bulk_evaluate: 'Evaluated in bulk',
  calculate: 'Recalculated',
  clo_calculate: 'Recalculated CLO attainment for',
  llo_calculate: 'Recalculated LLO attainment for',
  plo_calculate: 'Recalculated PLO attainment for',
  bulk_submit: 'Submitted grades in bulk for',
  login: 'Signed in',
  logout: 'Signed out',
};

/** Subjects whose readable form is not just the snake_case spelled out. */
const SUBJECTS: Record<string, string> = {
  clo: 'a CLO',
  llo: 'an LLO',
  plo: 'a PLO',
  peo: 'a PEO',
  clo_plo_mapping: 'a CLO–PLO mapping',
  llo_plo_mapping: 'an LLO–PLO mapping',
  peo_plo_mapping: 'a PEO–PLO mapping',
  graduation_criteria: 'the graduation criteria',
  pass_fail_criteria: 'the pass/fail criteria',
  assessment_item: 'an assessment item',
  course_offering: 'a course offering',
  offering: 'a course offering',
  marks: 'marks',
  grade: 'a grade',
  result: 'a result',
  attainment: 'attainment',
  user: 'a user account',
  rubric: 'a rubric',
  survey: 'a survey',
  report: 'a report',
  transcript: 'a transcript',
  curriculum: 'the curriculum',
  program: 'a programme',
  course: 'a course',
  batch: 'a batch',
  section: 'a section',
  peo_archive: 'a PEO',
};

function readableSubject(subject: string): string {
  return SUBJECTS[subject] ?? `a ${subject.replace(/_/g, ' ')}`;
}

/**
 * The affected record's own name, when the call site happened to log one.
 *
 * `email` is deliberately not a candidate. `writeAuditLog` stamps every row
 * with `email: user.email` — the person who *made* the change, not the thing
 * changed — so reading it here produced lines like "Deleted a rubric —
 * admin@example.edu", naming the actor twice and the rubric not at all. The
 * feed already shows who did it on its own line.
 */
function nameFrom(details: Record<string, unknown>): string | null {
  for (const key of ['code', 'name', 'title', 'rollNumber']) {
    const v = details[key];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return null;
}

export function summariseAuditAction(
  action: string,
  rawDetails: unknown
): string {
  let details: Record<string, unknown> = {};
  try {
    const parsed =
      typeof rawDetails === 'string' ? JSON.parse(rawDetails) : rawDetails;
    if (parsed && typeof parsed === 'object') {
      details = parsed as Record<string, unknown>;
    }
  } catch {
    // A details blob that will not parse is not worth failing the feed over.
  }

  if (!action) return 'Recorded a change';

  // 'attainment.plo_calculate' -> ['attainment', 'plo_calculate']
  const dot = action.indexOf('.');
  const subject = dot === -1 ? action : action.slice(0, dot);
  const verbKey = dot === -1 ? '' : action.slice(dot + 1);

  const name = nameFrom(details);

  // Sign-in events name no subject.
  if (subject === 'auth' || verbKey === 'login' || verbKey === 'logout') {
    return VERBS[verbKey] ?? 'Signed in';
  }

  const verb = VERBS[verbKey];

  if (!verb) {
    // An action this map has not been taught yet: still say something
    // readable rather than printing the raw identifier.
    const spelled = action.replace(/[._]/g, ' ');
    return spelled.charAt(0).toUpperCase() + spelled.slice(1);
  }

  const base = `${verb} ${readableSubject(subject)}`;
  return name ? `${base} — ${name}` : base;
}
