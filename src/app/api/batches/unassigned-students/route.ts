import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/auth';
import { getCurrentDepartmentId } from '@/lib/auth';

// GET /api/batches/unassigned-students - Get students not assigned to any batch
export async function GET(request: NextRequest) {
  try {
    // Authentication and authorization check
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const roleResult = await requireRole(request, ['super_admin', 'admin']);
    if (!roleResult.success) {
      return NextResponse.json({ error: roleResult.error }, { status: 403 });
    }

    // A super_admin belongs to no department by design, so demanding one here
    // locked the highest-privilege role out entirely.
    const isSuperAdmin = roleResult.user?.role === 'super_admin';
    const currentDepartmentId = isSuperAdmin
      ? null
      : await getCurrentDepartmentId(request);

    if (!isSuperAdmin && !currentDepartmentId) {
      return NextResponse.json(
        { error: 'Department not assigned. Please contact super admin.' },
        { status: 400 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('programId');
    const search = searchParams.get('search');

    // Build query conditions - scoped by department except for a super_admin
    let whereClause = 'WHERE s.batchId IS NULL';
    const params: any[] = [];

    if (currentDepartmentId) {
      whereClause += ' AND s.departmentId = ?';
      params.push(currentDepartmentId);
    }

    if (programId) {
      const programIdNum = parseInt(programId, 10);
      if (Number.isNaN(programIdNum)) {
        return NextResponse.json(
          { error: 'Invalid programId' },
          { status: 400 }
        );
      }
      whereClause += ' AND s.programId = ?';
      params.push(programIdNum);
    }

    if (search) {
      whereClause +=
        ' AND (s.rollNumber LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }

    // Get unassigned students
    const studentsQuery = `
      SELECT 
        s.id, 
        s.rollNumber, 
        s.status, 
        s.createdAt,
        s.updatedAt,
        s.programId,
        s.departmentId,
        u.first_name, 
        u.last_name, 
        u.email,
        p.name as program_name,
        p.code as program_code,
        d.name as department_name,
        d.code as department_code
      FROM students s
      JOIN users u ON s.userId = u.id
      JOIN programs p ON s.programId = p.id
      JOIN departments d ON s.departmentId = d.id
      ${whereClause}
      ORDER BY s.rollNumber
      LIMIT 100
    `;

    const students = await prisma.$queryRawUnsafe(studentsQuery, ...params);

    return NextResponse.json(students);
  } catch (error) {
    console.error('Error fetching unassigned students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unassigned students' },
      { status: 500 }
    );
  }
}
