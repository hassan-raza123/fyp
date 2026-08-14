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
  // structural configuration
  | 'section.delete'
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
