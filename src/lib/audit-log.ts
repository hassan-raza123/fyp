import { NextRequest } from 'next/server';
import { prisma } from './prisma';
import { Prisma } from '@prisma/client';
import { TokenPayload } from '@/types/auth';
import { getUserId } from './authz';

/**
 * Audit trail for changes that affect a student's record.
 *
 * The `auditlogs` table is read by the admin/super-admin dashboards; this is
 * what writes to it. Accreditation reviews ask who changed a mark and when, so
 * every mutation of marks, grades, results and attainments should pass through
 * here.
 */

export type AuditAction =
  // marks & results
  | 'marks.entry'
  | 'marks.update'
  | 'marks.bulk_entry'
  | 'result.evaluate'
  | 'result.bulk_evaluate'
  | 'result.delete'
  // grades
  | 'grade.calculate'
  | 'grade.update'
  | 'grade.submit'
  | 'grade.lock'
  | 'grade.bulk_submit'
  // attainments
  | 'attainment.clo_calculate'
  | 'attainment.llo_calculate'
  | 'attainment.plo_calculate'
  // configuration that changes how results are derived
  | 'offering.lock'
  | 'offering.unlock'
  | 'clo.create'
  | 'clo.update'
  | 'clo.delete'
  | 'clo_plo_mapping.update'
  | 'clo_plo_mapping.delete'
  | 'assessment_item.update'
  | 'assessment_item.delete'
  // attendance & exam eligibility
  | 'attendance.session_create'
  | 'attendance.session_update'
  | 'attendance.session_delete'
  | 'attendance.mark'
  | 'attendance.finalize'
  | 'attendance.reopen'
  | 'eligibility.override'
  // closing the loop
  | 'action_plan.auto_create'
  // reports
  | 'report.generate'
  | 'report.update'
  | 'report.delete'
  // structural configuration
  | 'section.create'
  | 'section.delete'
  /**
   * The accreditation chain and the rules derived from it.
   *
   * The seventh audit pass closed a cross-tenant hole on every one of these
   * writes — a foreign department admin could rewrite a programme's objectives,
   * its curriculum, and the CGPA required to graduate from it. Refusing the
   * foreign write is half the answer; the other half is being able to say who
   * made the legitimate one. These are the figures an accreditation body asks
   * about, so "who changed this, and when" has to be answerable.
   */
  | 'peo.create'
  | 'peo.update'
  | 'peo.archive'
  | 'peo_plo_mapping.create'
  | 'peo_plo_mapping.delete'
  | 'graduation_criteria.create'
  | 'graduation_criteria.update'
  | 'pass_fail_criteria.create'
  | 'pass_fail_criteria.update'
  | 'curriculum.add'
  | 'curriculum.update'
  | 'curriculum.remove'
  | 'course.update'
  | 'course.delete'
  | 'batch.create'
  | 'batch.update'
  | 'batch.delete'
  | 'program.create'
  | 'rubric.create'
  | 'rubric.update'
  | 'rubric.delete'
  | 'survey.create'
  | 'survey.update'
  | 'survey.delete'
  | 'transcript.update'
  | 'transcript.delete'
  // account administration — who can sign in, as what, is a security event and
  // an accreditation question ("who granted this person marking rights?").
  // Without these the audit trail covers marks but not the accounts that set them.
  | 'user.create'
  | 'user.update'
  | 'user.delete'
  | 'user.role_change'
  | 'user.status_change'
  | 'user.password_reset'
  // authentication — needed to investigate a compromise after the fact
  | 'auth.login_success'
  | 'auth.login_failure'
  | 'auth.otp_failure'
  | 'auth.logout';

/**
 * Record an audited action. Never throws — a failure to write the audit row
 * must not fail the user's request, but it is logged to the server console so
 * the gap is visible in production logs.
 */
/**
 * Record an authentication event.
 *
 * Separate from `writeAuditLog` because that one takes a `TokenPayload`, and
 * the interesting authentication events happen *before* one exists — a failed
 * password, a failed OTP. It takes a raw `userId` instead.
 *
 * `auditlogs.userId` is a required foreign key, so an attempt against an
 * address with no account cannot be attributed and is not written here; the
 * rate limiter is what defends that case. What this captures is the targeted
 * one: repeated failures against an account that does exist.
 */
export async function writeAuthAuditLog(
  request: NextRequest,
  userId: number,
  action: Extract<AuditAction, `auth.${string}`>,
  details: Record<string, unknown> = {}
): Promise<void> {
  try {
    await prisma.auditlogs.create({
      data: {
        userId,
        action,
        details: details as Prisma.InputJsonValue,
        ipAddress:
          request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
          request.headers.get('x-real-ip') ??
          null,
        userAgent: request.headers.get('user-agent') ?? null,
      },
    });
  } catch (error) {
    console.error(`Failed to write auth audit log for "${action}":`, error);
  }
}

export async function writeAuditLog(
  request: NextRequest,
  user: TokenPayload,
  action: AuditAction,
  details: Record<string, unknown>
): Promise<void> {
  try {
    const userId = getUserId(user);
    if (!userId) return;

    await prisma.auditlogs.create({
      data: {
        userId,
        action,
        details: {
          ...details,
          role: user.role,
          email: user.email,
        },
        ipAddress:
          request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
          request.headers.get('x-real-ip') ??
          null,
        userAgent: request.headers.get('user-agent') ?? null,
      },
    });
  } catch (error) {
    console.error(`Failed to write audit log for action "${action}":`, error);
  }
}
