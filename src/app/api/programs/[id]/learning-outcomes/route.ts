import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface ProgramLearningOutcome {
  id: number;
  programId: number;
  code: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const learningOutcomes = await prisma.$queryRaw<ProgramLearningOutcome[]>`
      SELECT * FROM program_learning_outcomes
      WHERE programId = ${parseInt(params.id)}
      ORDER BY code ASC
    `;

    return NextResponse.json({
      success: true,
      data: learningOutcomes,
    });
  } catch (error) {
    console.error('Error fetching program learning outcomes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch program learning outcomes' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      include: { userrole: { include: { role: true } } },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userRoles = user.userrole.map((ur) => ur.role.name);
    const allowedRoles = ['super_admin', 'sub_admin', 'department_admin'];

    if (!userRoles.some((role) => allowedRoles.includes(role))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { code, description } = body;

    // Validate required fields
    if (!code || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if program exists
    const program = await prisma.program.findUnique({
      where: { id: parseInt(params.id) },
    });

    if (!program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    // Check if PLO code is unique for this program
    const existingPLO = await prisma.$queryRaw<ProgramLearningOutcome[]>`
      SELECT * FROM program_learning_outcomes
      WHERE programId = ${parseInt(params.id)} AND code = ${code}
    `;

    if (existingPLO.length > 0) {
      return NextResponse.json(
        { error: 'PLO code already exists for this program' },
        { status: 400 }
      );
    }

    const learningOutcome = await prisma.$queryRaw<ProgramLearningOutcome[]>`
      INSERT INTO program_learning_outcomes (programId, code, description, createdAt, updatedAt)
      VALUES (${parseInt(params.id)}, ${code}, ${description}, NOW(), NOW())
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      data: learningOutcome[0],
    });
  } catch (error) {
    console.error('Error creating program learning outcome:', error);
    return NextResponse.json(
      { error: 'Failed to create program learning outcome' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      include: { userrole: { include: { role: true } } },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userRoles = user.userrole.map((ur) => ur.role.name);
    const allowedRoles = ['super_admin', 'sub_admin', 'department_admin'];

    if (!userRoles.some((role) => allowedRoles.includes(role))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { code, description } = body;

    // Check if PLO exists
    const existingPLO = await prisma.$queryRaw<ProgramLearningOutcome[]>`
      SELECT * FROM program_learning_outcomes
      WHERE programId = ${parseInt(params.id)} AND code = ${code}
    `;

    if (existingPLO.length === 0) {
      return NextResponse.json(
        { error: 'Program learning outcome not found' },
        { status: 404 }
      );
    }

    const updatedLearningOutcome = await prisma.$queryRaw<
      ProgramLearningOutcome[]
    >`
      UPDATE program_learning_outcomes
      SET description = ${description}, updatedAt = NOW()
      WHERE programId = ${parseInt(params.id)} AND code = ${code}
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      data: updatedLearningOutcome[0],
    });
  } catch (error) {
    console.error('Error updating program learning outcome:', error);
    return NextResponse.json(
      { error: 'Failed to update program learning outcome' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      include: { userrole: { include: { role: true } } },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userRoles = user.userrole.map((ur) => ur.role.name);
    const allowedRoles = ['super_admin', 'sub_admin', 'department_admin'];

    if (!userRoles.some((role) => allowedRoles.includes(role))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { error: 'PLO code is required' },
        { status: 400 }
      );
    }

    // Check if PLO exists
    const existingPLO = await prisma.$queryRaw<ProgramLearningOutcome[]>`
      SELECT * FROM program_learning_outcomes
      WHERE programId = ${parseInt(params.id)} AND code = ${code}
    `;

    if (existingPLO.length === 0) {
      return NextResponse.json(
        { error: 'Program learning outcome not found' },
        { status: 404 }
      );
    }

    await prisma.$queryRaw`
      DELETE FROM program_learning_outcomes
      WHERE programId = ${parseInt(params.id)} AND code = ${code}
    `;

    return NextResponse.json({
      success: true,
      message: 'Program learning outcome deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting program learning outcome:', error);
    return NextResponse.json(
      { error: 'Failed to delete program learning outcome' },
      { status: 500 }
    );
  }
}
