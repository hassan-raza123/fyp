import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize, canAccessCourse, forbiddenResponse } from '@/lib/authz';

// DELETE /api/llo-plo-mappings/[id]
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorize(request, ['super_admin', 'admin']);
    if (!auth.ok) return auth.response;

    const { id } = await context.params;
    const mappingId = parseInt(id);

    if (isNaN(mappingId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid mapping ID' },
        { status: 400 }
      );
    }

    // Check if mapping exists
    const existingMapping = await prisma.lloplomappings.findUnique({
      where: { id: mappingId },
      select: { id: true, llo: { select: { courseId: true } } },
    });

    if (!existingMapping) {
      return NextResponse.json(
        { success: false, error: 'Mapping not found' },
        { status: 404 }
      );
    }

    // Resolved through the LLO's course. The mapping carries the weight the
    // PLO rollup divides by, so deleting one changes another department's
    // attainment figures without touching a row it owns directly.
    if (
      !(await canAccessCourse(request, auth.user, existingMapping.llo.courseId))
    ) {
      return forbiddenResponse();
    }

    // Delete mapping
    await prisma.lloplomappings.delete({
      where: { id: mappingId },
    });

    return NextResponse.json({
      success: true,
      message: 'Mapping deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting LLO-PLO mapping:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete mapping' },
      { status: 500 }
    );
  }
}
