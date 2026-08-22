import {
  BookOpen,
  Building2,
  ClipboardCheck,
  FileCheck2,
  GraduationCap,
  Network,
  PieChart,
  ScrollText,
  Users,
} from 'lucide-react';

/**
 * Marketing copy for the landing page.
 *
 * Two rules held throughout, both learned from what was here before:
 *
 *  1. **Say what the software does, not how good it is.** The previous copy
 *     ran on adjectives — "Smart Outcome Mapping", "Intelligent Outcome
 *     Alignment", "Powerful Features for Complete OBE", "beautiful charts",
 *     "Comprehensive management". A head of department evaluating this can
 *     read all six of those and still not know whether it maps PEOs.
 *
 *  2. **Nothing that is not in the product.** No invented numbers, no
 *     invented customers. A `statistics` export used to sit here holding
 *     "5000+ Students", "200+ Faculty Members", "50+ Programs" — figures
 *     belonging to no one, waiting to be dropped onto the page. It is gone,
 *     for the same reason the fabricated testimonials were removed.
 *
 * The module and role lists below are drawn from the routes that actually
 * exist under `src/app/(authenticated-routes)`.
 */

/**
 * The six modules, as the system is actually divided.
 *
 * The old list led with "User Management" and "Academic Structure" —
 * true of every piece of software ever sold to a university, and so the
 * least informative thing the page could have opened with. The outcome
 * hierarchy, the mapping matrices, Bloom analysis, course files and action
 * plans — the parts that are hard to build and specific to OBE — were not
 * mentioned anywhere on the page at all.
 */
export const features = [
  {
    icon: Network,
    title: 'Outcome hierarchy',
    description:
      'PEOs, PLOs, CLOs and LLOs, plus the PEO–PLO, CLO–PLO and LLO–PLO matrices that tie them to each other and to the curriculum.',
  },
  {
    icon: ClipboardCheck,
    title: 'Assessments & rubrics',
    description:
      'Assessments broken into items, each carrying the CLO it tests and its Bloom level, marked against rubrics you define.',
  },
  {
    icon: ScrollText,
    title: 'Results & transcripts',
    description:
      'Marks entry, result evaluation, grade management, result sheets, academic records and official transcripts.',
  },
  {
    icon: PieChart,
    title: 'Attainment analytics',
    description:
      'CLO, LLO, PLO and PEO attainment computed from live marks, with a PLO coverage matrix and Bloom-level breakdown.',
  },
  {
    icon: FileCheck2,
    title: 'Accreditation reporting',
    description:
      'Course files, OBE reports, configurable graduation and pass/fail criteria, and the action plans that close the loop.',
  },
  {
    icon: Building2,
    title: 'Institution setup',
    description:
      'Departments, programmes, batches, sections, semesters and course offerings, with bulk student import.',
  },
];

/**
 * What each role gets.
 *
 * This replaces two separate sections that were doing the same job. A
 * six-card "For Students" block carried the largest heading on the page —
 * on a page whose reader is the person who decides whether to buy, which is
 * never the student — and the portal band below it repeated the same three
 * roles as three more cards linking to the same login screen.
 */
export const roles = [
  {
    icon: GraduationCap,
    title: 'Students',
    blurb: 'See where you stand, outcome by outcome.',
    points: [
      'Enrolled courses, assessment results and marks breakdowns',
      'Your own CLO, LLO and PLO attainment, per course',
      'Attendance and semester calendar',
      'Official transcript, on demand',
    ],
  },
  {
    icon: BookOpen,
    title: 'Faculty',
    blurb: 'Record marks once; the evidence follows.',
    points: [
      'Sections, course offerings and enrolled students',
      'Assessments, assessment items and rubrics',
      'Marks entry, result evaluation and result sheets',
      'Course file and per-course attainment analytics',
    ],
  },
  {
    icon: Users,
    title: 'Administrators',
    blurb: 'Run the programme and answer the panel.',
    points: [
      'Programmes, batches, sections, semesters and offerings',
      'The full outcome hierarchy and its mapping matrices',
      'Attainment across every cohort, with graduation criteria',
      'OBE reports, Bloom analysis and action plans',
    ],
  },
];

/**
 * The three steps of the evidence lifecycle.
 *
 * The old three were "Login to Portal", "Track Progress" and "Achieve
 * Excellence". Signing in is not a step in outcome-based education, and
 * "Achieve Excellence" is not a step in anything — it is a slogan standing
 * where the third step should have been.
 */
export const steps = [
  {
    number: '01',
    title: 'Map the outcomes',
    description:
      'Define PEOs, PLOs and CLOs for each programme and map them to one another and to the curriculum. Everything downstream computes against this mapping.',
  },
  {
    number: '02',
    title: 'Assess against them',
    description:
      'Faculty build assessments whose every item carries a CLO and a Bloom level, then enter marks as they always would. There is no separate evidence exercise afterwards.',
  },
  {
    number: '03',
    title: 'Read the attainment',
    description:
      'CLO, LLO, PLO and PEO attainment update as marks land. Course files, OBE reports and action plans come out of the same records.',
  },
];
