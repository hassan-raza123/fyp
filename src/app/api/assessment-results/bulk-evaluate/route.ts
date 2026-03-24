import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFacultyIdFromRequest } from '@/lib/auth';

// POST - Bulk evaluate multiple student results
export async function POST(req: NextRequest) {
  try {
    const facultyId = await getFacultyIdFromRequest(req);
    if (!facultyId) {
      return NextResponse.json(
        { success: false, error: 'Faculty not found or unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { resultIds, remarks, status, action } = body; // action: 'approve', 'reject', 'evaluate'

    if (!resultIds || !Array.isArray(resultIds) || resultIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Result IDs are required' },
        { status: 400 }
      );
    }

    // Verify all results belong to faculty's assessments
    const results = await prisma.studentassessmentresults.findMany({
      where: {
        id: {
          in: resultIds.map((id: number | string) =>
            typeof id === 'string' ? parseInt(id) : id
          ),
        },
      },
      include: {
        assessment: {
          select: {
            id: true,
            conductedBy: true,
          },
        },
      },
    });

    // Check authorization
    const unauthorizedResults = results.filter(
      (r) => r.assessment.conductedBy !== facultyId
    );
    if (unauthorizedResults.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Some results do not belong to you',
        },
        { status: 403 }
      );
    }

    // Determine status based on action
    let finalStatus = status;
    if (action === 'approve') {
      finalStatus = 'evaluated';
    } else if (action === 'reject') {
      finalStatus = 'pending';
    } else if (action === 'publish') {
      finalStatus = 'published';
    }

    // Update all results
    const updatedResults = await prisma.$transaction(
      results.map((result) =>
        prisma.studentassessmentresults.update({
          where: { id: result.id },
          data: {
            ...(remarks && { remarks }),
            ...(finalStatus && {
              status: finalStatus as any,
              ...(finalStatus === 'evaluated' && { evaluatedAt: new Date() }),
            }),
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: `Successfully ${action || 'updated'} ${
        updatedResults.length
      } result(s)`,
      data: updatedResults,
    });
  } catch (error) {
    console.error('Error in bulk evaluation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to perform bulk evaluation' },
      { status: 500 }
    );
  }
}
