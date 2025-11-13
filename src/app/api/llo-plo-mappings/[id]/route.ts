import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-utils';

// DELETE /api/llo-plo-mappings/[id]
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { success, user } = requireAuth(request);
    if (!success || user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

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
    });

    if (!existingMapping) {
      return NextResponse.json(
        { success: false, error: 'Mapping not found' },
        { status: 404 }
      );
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

