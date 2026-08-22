/**
 * The three diagrams on the OBE showcase band.
 *
 * These replace three stock infographics that were sitting in
 * `/public/info-images`: a generic "Benefits of Outcome-Based Education"
 * poster, a PDCA wheel, and a CLO-PLO clip-art. Three problems with them:
 *
 *  - None of them showed *this* product. They illustrated OBE as a concept,
 *    which anyone evaluating an OBE system already knows.
 *  - Their palette — blue, orange, purple, red and green — collided with the
 *    single-indigo brand, and three of those five are the attainment colours
 *    the palette reserves for meaning. Red and green appearing decoratively
 *    next to a real attainment figure is exactly what the colour rules at
 *    the top of globals.css exist to prevent.
 *  - Being raster images, they carried baked-in light backgrounds and could
 *    not follow the theme.
 *
 * These are drawn from tokens instead, so they follow the theme, stay sharp,
 * and depict the actual data model: the outcome hierarchy, an assessment
 * broken into CLO-tagged items, and an attainment matrix.
 *
 * Sample figures are illustrative and obviously so — a demo programme, not
 * any institution's results.
 */

const TIERS = [
  {
    label: 'PEO',
    caption: 'Programme educational objectives',
    items: ['PEO 1', 'PEO 2', 'PEO 3'],
  },
  {
    label: 'PLO',
    caption: 'Programme learning outcomes',
    items: ['PLO 1', 'PLO 2', 'PLO 3', 'PLO 4', 'PLO 5', '+7'],
  },
  {
    label: 'CLO',
    caption: 'Course learning outcomes',
    items: ['CLO 1', 'CLO 2', 'CLO 3', 'CLO 4'],
  },
];

export function OutcomeHierarchyVisual() {
  return (
    <figure className='m-0 p-6 sm:p-8'>
      <figcaption className='sr-only'>
        The outcome hierarchy: programme educational objectives mapped to
        programme learning outcomes, mapped to course learning outcomes.
      </figcaption>
      <div className='space-y-5'>
        {TIERS.map((tier, i) => (
          <div key={tier.label}>
            <div className='flex items-baseline gap-2 mb-2'>
              <span
                className='text-[11px] font-bold tracking-wider'
                style={{ color: 'var(--accent)' }}
              >
                {tier.label}
              </span>
              <span className='text-[11px] text-ink-muted'>{tier.caption}</span>
            </div>
            <div className='flex flex-wrap gap-2'>
              {tier.items.map((item) => (
                <span
                  key={item}
                  className='px-2.5 py-1.5 rounded-lg text-xs font-medium'
                  style={{
                    backgroundColor: 'var(--accent-wash)',
                    color: 'var(--accent-active)',
                  }}
                >
                  {item}
                </span>
              ))}
            </div>
            {i < TIERS.length - 1 && (
              <div
                aria-hidden
                className='ml-3 mt-3 h-4 w-px'
                style={{ backgroundColor: 'var(--border-firm)' }}
              />
            )}
          </div>
        ))}
      </div>
      <p className='mt-6 pt-4 border-t border-subtle text-xs text-ink-muted'>
        Each link between two tiers is a mapping row you control, carrying the
        weight every attainment figure downstream is calculated from.
      </p>
    </figure>
  );
}

const ITEMS = [
  { q: 'Q1', task: 'Trace the algorithm', clo: 'CLO 2', bloom: 'Apply', marks: 8 },
  { q: 'Q2', task: 'Prove the bound', clo: 'CLO 3', bloom: 'Analyse', marks: 12 },
  { q: 'Q3', task: 'Design a variant', clo: 'CLO 4', bloom: 'Create', marks: 20 },
];

export function AssessmentVisual() {
  return (
    <figure className='m-0 p-6 sm:p-8'>
      <figcaption className='sr-only'>
        An assessment broken into items, each tagged with the course learning
        outcome it tests and its Bloom level.
      </figcaption>

      <div className='flex items-baseline justify-between mb-5'>
        <div>
          <p className='text-sm font-semibold text-ink'>Midterm examination</p>
          <p className='text-xs text-ink-muted'>CS-301 · Data Structures</p>
        </div>
        <span className='text-xs font-medium text-ink-2 tabular-nums'>
          40 marks
        </span>
      </div>

      <ul className='space-y-2 list-none m-0 p-0'>
        {ITEMS.map((item) => (
          <li
            key={item.q}
            className='flex items-center gap-3 rounded-xl border border-subtle bg-surface-2 px-3 py-2.5'
          >
            <span className='text-xs font-bold text-ink-muted w-6 shrink-0'>
              {item.q}
            </span>
            <span className='text-xs text-ink flex-1 min-w-0 truncate'>
              {item.task}
            </span>
            <span
              className='text-[11px] font-semibold px-2 py-0.5 rounded-md shrink-0'
              style={{
                backgroundColor: 'var(--accent-wash)',
                color: 'var(--accent-active)',
              }}
            >
              {item.clo}
            </span>
            <span className='text-[11px] text-ink-2 w-14 shrink-0 hidden sm:block'>
              {item.bloom}
            </span>
            <span className='text-xs font-medium text-ink tabular-nums w-6 text-right shrink-0'>
              {item.marks}
            </span>
          </li>
        ))}
      </ul>

      <p className='mt-6 pt-4 border-t border-subtle text-xs text-ink-muted'>
        The CLO tag is set once, when the paper is built. Marks entered against
        these items need no further classification.
      </p>
    </figure>
  );
}

const PLO_COLUMNS = ['PLO 1', 'PLO 2', 'PLO 3', 'PLO 4'];
const COHORTS = [
  { batch: 'BSCS-21', scores: [82, 74, 58, 91] },
  { batch: 'BSCS-22', scores: [88, 69, 47, 85] },
  { batch: 'BSCS-23', scores: [79, 81, 62, 88] },
];

/**
 * The palette reserves red, amber and green for attainment. This is that.
 *
 * The figure is set in ink rather than in the band colour. `text-good` on
 * `bg-good-wash` — the pairing used for grade and criteria badges throughout
 * the authenticated app — measures 4.46:1 in the light theme, just under the
 * 4.5 AA needs for text this size. Ink on the same wash clears 15:1 in both
 * themes, and the wash still carries the band at a glance, with the legend
 * above naming what each one means.
 */
function bandFor(score: number) {
  if (score >= 70) return 'var(--good-wash)';
  if (score >= 60) return 'var(--warn-wash)';
  return 'var(--bad-wash)';
}

export function AttainmentVisual() {
  return (
    <figure className='m-0 p-6 sm:p-8'>
      <figcaption className='sr-only'>
        Programme learning outcome attainment by cohort, banded against the
        threshold.
      </figcaption>

      <div className='flex items-baseline justify-between mb-4'>
        <p className='text-sm font-semibold text-ink'>PLO attainment</p>
        <span className='text-xs text-ink-muted'>Threshold 60%</span>
      </div>

      {/* Without this the banding read as arbitrary: the header said
          "Threshold 60%" while 69% rendered amber and 74% green. */}
      <ul className='flex flex-wrap gap-x-4 gap-y-1 mb-4 list-none p-0 m-0'>
        {[
          { label: 'Attained', fg: 'var(--good)' },
          { label: 'Marginal', fg: 'var(--warn)' },
          { label: 'Below threshold', fg: 'var(--bad)' },
        ].map((key) => (
          <li key={key.label} className='flex items-center gap-1.5'>
            <span
              aria-hidden
              className='w-2 h-2 rounded-full'
              style={{ backgroundColor: key.fg }}
            />
            <span className='text-[11px] text-ink-muted'>{key.label}</span>
          </li>
        ))}
      </ul>

      <div className='overflow-x-auto'>
        <table className='w-full border-collapse text-xs'>
          <thead>
            <tr>
              <th className='text-left font-medium text-ink-muted pb-2 pr-3'>
                Cohort
              </th>
              {PLO_COLUMNS.map((plo) => (
                <th
                  key={plo}
                  className='font-medium text-ink-muted pb-2 px-1.5 text-center whitespace-nowrap'
                >
                  {plo}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COHORTS.map((row) => (
              <tr key={row.batch}>
                <td className='py-1.5 pr-3 font-medium text-ink whitespace-nowrap'>
                  {row.batch}
                </td>
                {row.scores.map((score, i) => (
                  <td key={PLO_COLUMNS[i]} className='py-1.5 px-1.5'>
                    <span
                      className='block rounded-md py-1.5 text-center font-semibold tabular-nums text-ink'
                      style={{ backgroundColor: bandFor(score) }}
                    >
                      {score}%
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className='mt-6 pt-4 border-t border-subtle text-xs text-ink-muted'>
        PLO 3 sits under threshold in every cohort. That is the finding an
        action plan attaches to — and the one a panel will ask about.
      </p>
    </figure>
  );
}
