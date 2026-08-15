import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit-log';
import { requireAuth } from '@/lib/auth';
import type { TokenPayload } from '@/types/auth';
import { report_status } from '@prisma/client';
import { canAccessProgram, forbiddenResponse } from '@/lib/authz';

/**
 * An OBE report is the accreditation artefact for a programme. All three
 * handlers checked only for an admin role, so any department admin could read,
 * amend the status of, or delete another department's reports. Ownership
 * resolves through the programme the report was generated for.
 *
 * `programId` is nullable — a report with no programme is university-wide, so
 * only a super admin may touch it.
 */
async function assertOwnsReport(
  request: NextRequest,
  user: TokenPayload,
  reportId: number
): Promise<NextResponse | null> {
  const report = await prisma.obereports.findUnique({
    where: { id: reportId },
    select: { programId: true },
  });
  if (!report) {
    return NextResponse.json(
      { success: false, error: 'Report not found' },
      { status: 404 }
    );
  }
  if (report.programId === null) {
    return user.role === 'super_admin' ? null : forbiddenResponse();
  }
  if (!(await canAccessProgram(request, user, report.programId))) {
    return forbiddenResponse();
  }
  return null;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { success, user, error } = await requireAuth(request);
    if (!success || !user) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // A signed-in user refused for lack of privilege is 403, not 401. Clients
    // read 401 as an expired session and bounce the user to /login, which
    // turns a permissions error into an apparent logout.
    if (!['admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const reportId = parseInt(id);

    const denied = await assertOwnsReport(request, user, reportId);
    if (denied) return denied;

    const report = await prisma.obereports.findUnique({
      where: { id: reportId },
      include: {
        program: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        semester: {
          select: {
            id: true,
            name: true,
          },
        },
        generator: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: report });
  } catch (error) {
    console.error('Error fetching OBE report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch report' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { success, user, error } = await requireAuth(request);
    if (!success || !user) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // A signed-in user refused for lack of privilege is 403, not 401. Clients
    // read 401 as an expired session and bounce the user to /login, which
    // turns a permissions error into an apparent logout.
    if (!['admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const reportId = parseInt(id);

    const denied = await assertOwnsReport(request, user, reportId);
    if (denied) return denied;
    const body = await request.json();
    const { status, filePath } = body;

    const updateData: any = {};
    if (status) {
      updateData.status = status as report_status;
    }
    if (filePath !== undefined) {
      updateData.filePath = filePath;
    }

    const report = await prisma.obereports.update({
      where: { id: reportId },
      data: updateData,
      include: {
        program: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        semester: {
          select: {
            id: true,
            name: true,
          },
        },
        generator: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    await writeAuditLog(request, user, 'report.update', {
      reportId,
      programId: report.programId,
      changed: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'Report updated successfully',
      data: report,
    });
  } catch (error) {
    console.error('Error updating OBE report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update report' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { success, user, error } = await requireAuth(request);
    if (!success || !user) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // A signed-in user refused for lack of privilege is 403, not 401. Clients
    // read 401 as an expired session and bounce the user to /login, which
    // turns a permissions error into an apparent logout.
    if (!['admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const reportId = parseInt(id);

    const denied = await assertOwnsReport(request, user, reportId);
    if (denied) return denied;

    // Captured before the delete: an accreditation report is evidence, and
    // "which report was destroyed" is the question afterwards.
    const doomed = await prisma.obereports.findUnique({
      where: { id: reportId },
      select: { programId: true, reportType: true, title: true },
    });

    await prisma.obereports.delete({
      where: { id: reportId },
    });

    await writeAuditLog(request, user, 'report.delete', {
      reportId,
      programId: doomed?.programId,
      reportType: doomed?.reportType,
      title: doomed?.title,
    });

    return NextResponse.json({
      success: true,
      message: 'Report deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting OBE report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete report' },
      { status: 500 }
    );
  }
}
