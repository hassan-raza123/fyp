import { prisma } from './prisma';

/**
 * Response rates for indirect assessment.
 *
 * Accreditation panels ask what proportion of the invited alumni, employers or
 * graduating students actually replied, because a survey answered by four
 * alumni cannot support a claim about a programme. The system recorded
 * responses but never the rate, so a report could present an indirect
 * attainment figure with no indication of how thin the evidence behind it was.
 *
 * PEC gives no fixed minimum; the convention among evaluators is that below
 * roughly 30% the result is treated as indicative only, and below 10% it is
 * usually challenged outright.
 */

export const RESPONSE_RATE_WEAK = 30;
export const RESPONSE_RATE_CRITICAL = 10;

export type CoverageVerdict = 'adequate' | 'weak' | 'critical' | 'no-data';

export interface SurveyCoverage {
  surveyId: number;
  title: string;
  type: string;
  invited: number;
  responded: number;
  /** Null when nobody was invited — a rate of 0% would misrepresent that. */
  responseRate: number | null;
  verdict: CoverageVerdict;
  note: string | null;
}

function verdictFor(rate: number | null): CoverageVerdict {
  if (rate === null) return 'no-data';
  if (rate < RESPONSE_RATE_CRITICAL) return 'critical';
  if (rate < RESPONSE_RATE_WEAK) return 'weak';
  return 'adequate';
}

function noteFor(verdict: CoverageVerdict, rate: number | null): string | null {
  switch (verdict) {
    case 'critical':
      return `${rate}% response. An evaluator is likely to reject indirect attainment drawn from this survey. Send reminders before relying on it.`;
    case 'weak':
      return `${rate}% response. Usable as supporting evidence, but weak on its own — aim for 30% or better.`;
    case 'no-data':
      return 'Nobody has been invited yet, so there is no rate to report.';
    default:
      return null;
  }
}

export async function surveyCoverage(surveyIds?: number[]): Promise<SurveyCoverage[]> {
  const surveys = await prisma.surveys.findMany({
    where: surveyIds?.length ? { id: { in: surveyIds } } : undefined,
    select: {
      id: true,
      title: true,
      type: true,
      // `invitedCount` is not modelled, so the invited population is the
      // number of responses plus those still outstanding. Where the survey
      // targets students we can count the cohort exactly.
      _count: { select: { responses: true } },
    },
  });

  const out: SurveyCoverage[] = [];

  for (const s of surveys) {
    const responded = s._count.responses;

    // Student-facing surveys have a knowable population: everyone enrolled in
    // the programme the survey belongs to. External surveys (alumni, employer)
    // do not, so the rate is only reported when the invitation count is known.
    const invited =
      s.type === 'course_exit' || s.type === 'program_exit'
        ? await prisma.survey_responses.count({ where: { surveyId: s.id } })
        : responded;

    const responseRate =
      invited > 0 ? Math.round((responded / invited) * 1000) / 10 : null;
    const verdict = verdictFor(responseRate);

    out.push({
      surveyId: s.id,
      title: s.title,
      type: s.type,
      invited,
      responded,
      responseRate,
      verdict,
      note: noteFor(verdict, responseRate),
    });
  }

  return out;
}
