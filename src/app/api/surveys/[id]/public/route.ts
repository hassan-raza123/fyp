import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

// POST /api/surveys/[id]/public
// Generates (or returns existing) a public token link for alumni/employer surveys.
// Requires admin auth.
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const survey = await prisma.surveys.findUnique({
      where: { id: Number(params.id) },
      select: { id: true, type: true, status: true, publicToken: true },
    });

    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    if (!['alumni', 'employer', 'program_exit'].includes(survey.type)) {
      return NextResponse.json(
        { error: 'Public links are only available for alumni, employer, and program_exit surveys' },
        { status: 400 }
      );
    }

    // Return existing token if already generated
    if (survey.publicToken) {
      return NextResponse.json({ token: survey.publicToken });
    }

    // Generate a secure random token
    const token = randomBytes(32).toString('hex');

    await prisma.surveys.update({
      where: { id: Number(params.id) },
      data: { publicToken: token },
    });

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error generating public survey token:', error);
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
  }
}

// GET /api/surveys/[id]/public — fetch survey data by token (no auth required)
// Used by the public survey page at /surveys/[token]
