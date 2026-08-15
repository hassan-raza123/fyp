import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';
import { authorize, canAccessSurvey, forbiddenResponse } from '@/lib/authz';

/**
 * POST /api/surveys/[id]/public
 *
 * Mints (or returns) the public link token for an alumni/employer survey.
 *
 * The comment here used to say "Requires admin auth" while the handler checked
 * nothing, and `proxy.ts` listed the path as public — so any anonymous caller
 * could ask for the token of any survey by id, then use it to read the survey
 * and submit responses. Those responses feed indirect PLO attainment, which is
 * an accreditation figure.
 *
 * Handing out the credential is a staff action. Using it is not, which is why
 * the respond endpoints stay public and verify the token instead.
 */
export async function POST(request: NextRequest, { params: _params }: { params: Promise<{ id: string }> }) {
  const params = await _params;
  try {
    const auth = await authorize(request, ['super_admin', 'admin', 'faculty']);
    if (!auth.ok) return auth.response;

    // Being staff is not a claim on another department's survey. The token
    // this mints lets its holder read the survey and submit responses that
    // feed indirect PLO attainment.
    if (!(await canAccessSurvey(request, auth.user, Number(params.id)))) {
      return forbiddenResponse();
    }

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
