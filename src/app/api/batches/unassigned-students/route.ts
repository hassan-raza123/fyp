import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/api-utils';

// GET /api/batches/unassigned-students - Get students not assigned to any batch
export async function GET(request: NextRequest) {
  try {
    // Authentication and authorization check
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const roleResult = requireRole(request, ['admin']);
    if (!roleResult.success) {
      return NextResponse.json({ error: roleResult.error }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('programId');
    const departmentId = searchParams.get('departmentId');
    const search = searchParams.get('search');

    // Build query conditions
    let whereClause = 'WHERE s.batchId IS NULL';
    const params: any[] = [];

    if (programId) {
      whereClause += ' AND s.programId = ?';
      params.push(parseInt(programId));
    }

    if (departmentId) {
      whereClause += ' AND s.departmentId = ?';
      params.push(parseInt(departmentId));
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
      JOIN user u ON s.userId = u.id
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
