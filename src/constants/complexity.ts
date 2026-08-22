/**
 * Complex Engineering Problems and Activities.
 *
 * PEC's Manual of Accreditation (Third Edition, 2019) requires that core
 * engineering courses and the final-year design project include Complex
 * Engineering Problems, and that these are evaluated through a pre-defined
 * rubric and by no other means. A programme evaluator asks which assessments
 * carry CEPs and which attributes they exercise, then checks coverage across
 * the programme.
 *
 * The attribute lists below are Tables 9 (problems) and 10 (activities) of that
 * manual. A single problem normally exercises several attributes; PEC expects
 * WP1 (depth of knowledge) to be present in any item claimed as a CEP.
 */

export interface ComplexAttribute {
  /** PEC's own code — evaluators refer to these directly. */
  code: string;
  label: string;
  description: string;
}

/** Table 9 — Complex Engineering Problems. */
export const CEP_ATTRIBUTES: ComplexAttribute[] = [
  {
    code: 'WP1',
    label: 'Depth of knowledge required',
    description:
      'Cannot be resolved without in-depth engineering knowledge at the level of one or more of WK3, WK4, WK5, WK6 or WK8.',
  },
  {
    code: 'WP2',
    label: 'Range of conflicting requirements',
    description:
      'Involves wide-ranging or conflicting technical, engineering and other issues.',
  },
  {
    code: 'WP3',
    label: 'Depth of analysis required',
    description:
      'Has no obvious solution and requires abstract thinking and originality in analysis to formulate suitable models.',
  },
  {
    code: 'WP4',
    label: 'Familiarity of issues',
    description: 'Involves infrequently encountered issues.',
  },
  {
    code: 'WP5',
    label: 'Extent of applicable codes',
    description:
      'Is outside problems encompassed by standards and codes of practice for professional engineering.',
  },
  {
    code: 'WP6',
    label: 'Extent of stakeholder involvement',
    description:
      'Involves diverse groups of stakeholders with widely varying needs.',
  },
  {
    code: 'WP7',
    label: 'Interdependence',
    description: 'Is a high-level problem including many component parts or sub-problems.',
  },
];

/** Table 10 — Complex Engineering Activities. */
export const CEA_ATTRIBUTES: ComplexAttribute[] = [
  {
    code: 'EA1',
    label: 'Range of resources',
    description:
      'Involves the use of diverse resources — people, money, equipment, materials, information and technologies.',
  },
  {
    code: 'EA2',
    label: 'Level of interaction',
    description:
      'Requires resolution of significant problems arising from interactions between wide-ranging or conflicting technical, engineering or other issues.',
  },
  {
    code: 'EA3',
    label: 'Innovation',
    description:
      'Involves creative use of engineering principles and research-based knowledge in novel ways.',
  },
  {
    code: 'EA4',
    label: 'Consequences for society and the environment',
    description:
      'Has significant consequences in a range of contexts, characterised by difficulty of prediction and mitigation.',
  },
  {
    code: 'EA5',
    label: 'Familiarity',
    description:
      'Can extend beyond previous experiences by applying principles-based approaches.',
  },
];

export type ComplexityKind = 'cep' | 'cea';

export function attributesFor(kind: ComplexityKind): ComplexAttribute[] {
  return kind === 'cep' ? CEP_ATTRIBUTES : CEA_ATTRIBUTES;
}

/**
 * PEC treats depth of knowledge as the defining characteristic of a complex
 * problem: an item claiming CEP status without WP1 will be questioned.
 */
export const CEP_REQUIRED_ATTRIBUTE = 'WP1';

export function validateComplexity(
  kind: ComplexityKind | null | undefined,
  codes: string[] | null | undefined,
  hasRubric: boolean
): string[] {
  if (!kind) return [];
  const errors: string[] = [];
  const chosen = codes ?? [];

  if (chosen.length === 0) {
    errors.push(
      `Select at least one ${kind.toUpperCase()} attribute — an evaluator checks which ones the problem exercises.`
    );
  }

  const valid = new Set(attributesFor(kind).map((a) => a.code));
  const unknown = chosen.filter((c) => !valid.has(c));
  if (unknown.length) {
    errors.push(`Not ${kind.toUpperCase()} attributes: ${unknown.join(', ')}.`);
  }

  if (kind === 'cep' && chosen.length && !chosen.includes(CEP_REQUIRED_ATTRIBUTE)) {
    errors.push(
      'A Complex Engineering Problem must include WP1 (depth of knowledge). Without it PEC does not treat the problem as complex.'
    );
  }

  // The manual is explicit that CEPs and CEAs are assessed by rubric and by no
  // other means, so this is a hard requirement rather than a recommendation.
  if (!hasRubric) {
    errors.push(
      `A ${kind.toUpperCase()} must be scored with a rubric. Attach one to this item before marking it complex.`
    );
  }

  return errors;
}
