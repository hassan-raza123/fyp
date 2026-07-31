import { NextRequest, NextResponse } from 'next/server';
import { authorize, canAccessSection, canManageCourseOffering } from '@/lib/authz';
import {
  getSectionAttendanceSummary,
  getCourseOfferingAttendance,
} from '@/lib/attendance';

/**
 * Attendance summary for a section or a whole course offering.
 *
 * GET /api/attendance/summary?sectionId=
 * GET /api/attendance/summary?courseOfferingId=
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authorize(request, ['admin', 'super_admin', 'faculty']);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const sectionIdParam = searchParams.get('sectionId');
    const courseOfferingIdParam = searchParams.get('courseOfferingId');

    if (sectionIdParam) {
      const sectionId = parseInt(sectionIdParam, 10);
      if (Number.isNaN(sectionId)) {
        return NextResponse.json(
          { success: false, error: 'sectionId must be a number' },
          { status: 400 }
        );
      }

      if (!(await canAccessSection(request, auth.user, sectionId))) {
        return NextResponse.json(
          { success: false, error: 'You do not have access to this section' },
          { status: 403 }
        );
      }

      const summary = await getSectionAttendanceSummary(sectionId);
      return NextResponse.json({ success: true, data: summary });
    }

    if (courseOfferingIdParam) {
      const courseOfferingId = parseInt(courseOfferingIdParam, 10);
      if (Number.isNaN(courseOfferingId)) {
        return NextResponse.json(
          { success: false, error: 'courseOfferingId must be a number' },
          { status: 400 }
        );
      }

      if (
        !(await canManageCourseOffering(request, auth.user, courseOfferingId))
      ) {
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
          defaulterCount: students.filter((s) => s.verdict === 'ineligible')
            .length,
        },
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Either sectionId or courseOfferingId is required',
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error building attendance summary:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to build attendance summary' },
      { status: 500 }
    );
  }
}
