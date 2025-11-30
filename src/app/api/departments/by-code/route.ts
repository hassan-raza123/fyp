import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET /api/departments/by-code?code=CS
// Simple endpoint to get department ID by code
export async function GET(request: NextRequest) {
  try {
    const { success } = requireAuth(request);
    if (!success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { error: 'Department code is required' },
        { status: 400 }
      );
    }

    const department = await prisma.departments.findUnique({
      where: { code },
      select: { id: true },
    });

    if (!department) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ id: department.id });
  } catch (error) {
    console.error('Error fetching department by code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

