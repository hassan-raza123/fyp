import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize, canManageCourseOffering, getUserId } from '@/lib/authz';
import { writeAuditLog } from '@/lib/audit-log';
import { getCourseOfferingAttendance } from '@/lib/attendance';

/**
 * Exam eligibility derived from attendance, plus the admin override.
 *
 * GET   /api/attendance/eligibility?courseOfferingId=
 * PATCH /api/attendance/eligibility   — set or clear an override
 *
 * The override exists because attendance alone cannot decide eligibility:
 * hospitalisation, university sport, bereavement are all cases a department
 * condones. Recording the decision (with a reason and who made it) is what
 * makes it auditable rather than an off-system arrangement.
 */

export async function GET(request: NextRequest) {
  try {
    const auth = await authorize(request, ['admin', 'super_admin', 'faculty']);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const param = searchParams.get('courseOfferingId');

    if (!param) {
      return NextResponse.json(
        { success: false, error: 'courseOfferingId is required' },
        { status: 400 }
      );
    }

    const courseOfferingId = parseInt(param, 10);
    if (Number.isNaN(courseOfferingId)) {
      return NextResponse.json(
        { success: false, error: 'courseOfferingId must be a number' },
        { status: 400 }
      );
    }

    if (!(await canManageCourseOffering(request, auth.user, courseOfferingId))) {
      return NextResponse.json(
        {
          success: false,
          error: 'You do not have access to this course offering',
        },
        { status: 403 }
      );
    }

    const students = await getCourseOfferingAttendance(courseOfferingId);

    return NextResponse.json({
      success: true,
      data: {
        courseOfferingId,
        students,
        counts: {
          eligible: students.filter((s) => s.verdict === 'eligible').length,
          atRisk: students.filter((s) => s.verdict === 'at_risk').length,
          ineligible: students.filter((s) => s.verdict === 'ineligible').length,
          condoned: students.filter((s) => s.verdict === 'condoned').length,
          barred: students.filter((s) => s.verdict === 'barred').length,
          noData: students.filter((s) => s.verdict === 'no_data').length,
        },
      },
    });
  } catch (error) {
    console.error('Error building eligibility report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to build eligibility report' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Only staff may condone a shortfall — a faculty member overriding their
    // own section's eligibility defeats the purpose of the check.
    const auth = await authorize(request, ['admin', 'super_admin']);
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const { studentId, sectionId, override, remarks } = body;

    if (!studentId || !sectionId) {
      return NextResponse.json(
        { success: false, error: 'studentId and sectionId are required' },
        { status: 400 }
      );
    }

    if (!['none', 'eligible', 'ineligible'].includes(override)) {
      return NextResponse.json(
        {
          success: false,
          error: 'override must be "none", "eligible" or "ineligible"',
        },
        { status: 400 }
      );
    }

    // A condonation without a stated reason is not auditable, which is the
    // whole reason for recording it in the system.
    if (override !== 'none' && !remarks?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'A reason is required when overriding exam eligibility',
        },
        { status: 400 }
      );
    }

    const parsedStudentId = parseInt(String(studentId), 10);
    const parsedSectionId = parseInt(String(sectionId), 10);

    if (Number.isNaN(parsedStudentId) || Number.isNaN(parsedSectionId)) {
      return NextResponse.json(
        { success: false, error: 'studentId and sectionId must be numbers' },
        { status: 400 }
      );
    }

    const enrollment = await prisma.studentsections.findUnique({
      where: {
        studentId_sectionId: {
          studentId: parsedStudentId,
          sectionId: parsedSectionId,
        },
      },
      select: {
        id: true,
        section: { select: { courseOfferingId: true } },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: 'Student is not enrolled in this section' },
        { status: 404 }
      );
    }

    if (
      !(await canManageCourseOffering(
        request,
        auth.user,
        enrollment.section.courseOfferingId
      ))
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'You do not have access to this course offering',
        },
        { status: 403 }
      );
    }

    const userId = getUserId(auth.user);
    const clearing = override === 'none';

    const updated = await prisma.studentsections.update({
      where: { id: enrollment.id },
      data: {
        eligibilityOverride: override,
        eligibilityRemarks: clearing ? null : remarks.trim(),
        eligibilitySetBy: clearing ? null : userId,
        eligibilitySetAt: clearing ? null : new Date(),
      },
    });

    await writeAuditLog(request, auth.user, 'eligibility.override', {
      studentId: parsedStudentId,
      sectionId: parsedSectionId,
      courseOfferingId: enrollment.section.courseOfferingId,
      override,
      remarks: clearing ? null : remarks.trim(),
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error setting eligibility override:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to set eligibility override' },
      { status: 500 }
    );
  }
}
