import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit-log';
import { authorize, canAccessProgram, forbiddenResponse } from '@/lib/authz';

// DELETE /api/peo-plo-mappings/[id]
export async function DELETE(request: NextRequest, { params: _params }: { params: Promise<{ id: string }> }) {
  const params = await _params;
  try {
    const auth = await authorize(request, ['super_admin', 'admin']);
    if (!auth.ok) return auth.response;

    // Resolved through the PEO's programme. A mapping carries the weight the
    // PEO attainment rollup divides by, so deleting one silently changes
    // another department's accreditation figures.
    const mapping = await prisma.peoplomappings.findUnique({
      where: { id: Number(params.id) },
      select: { peoId: true, ploId: true, peo: { select: { programId: true } } },
    });
    if (!mapping) {
      return NextResponse.json({ error: 'Mapping not found' }, { status: 404 });
    }
    if (!(await canAccessProgram(request, auth.user, mapping.peo.programId))) {
      return forbiddenResponse();
    }

    await prisma.peoplomappings.delete({ where: { id: Number(params.id) } });

    await writeAuditLog(request, auth.user, 'peo_plo_mapping.delete', {
      mappingId: Number(params.id),
      peoId: mapping.peoId,
      ploId: mapping.ploId,
      programId: mapping.peo.programId,
    });

    return NextResponse.json({ success: true, message: 'Mapping removed' });
  } catch (error) {
    console.error('Error deleting PEO-PLO mapping:', error);
    return NextResponse.json({ error: 'Failed to delete mapping' }, { status: 500 });
  }
}
