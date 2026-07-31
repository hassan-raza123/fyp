import { NextRequest } from 'next/server';
import { prisma } from './prisma';
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
  | 'report.generate';

/**
 * Record an audited action. Never throws — a failure to write the audit row
 * must not fail the user's request, but it is logged to the server console so
 * the gap is visible in production logs.
 */
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
