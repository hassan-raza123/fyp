import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// DELETE /api/peo-plo-mappings/[id]
export async function DELETE(request: NextRequest, { params: _params }: { params: Promise<{ id: string }> }) {
  try {
  const params = await _params;
    const auth = await requireAuth(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!['admin', 'super_admin'].includes(auth.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.peoplomappings.delete({ where: { id: Number(params.id) } });
    return NextResponse.json({ success: true, message: 'Mapping removed' });
  } catch (error) {
    console.error('Error deleting PEO-PLO mapping:', error);
    return NextResponse.json({ error: 'Failed to delete mapping' }, { status: 500 });
  }
}
