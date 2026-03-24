import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { sendSurveyInvitation } from '@/lib/email-utils';

const MAX_EMAILS_PER_REQUEST = 200;

/**
 * POST /api/surveys/[id]/send-invitations
 * Sends survey invitation emails to a list of email addresses.
 * The survey must be active and have a publicToken.
 * Admin or Faculty only.
 */
export async function POST(
  request: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  try {
    const { success, user, error } = await requireAuth(request);
    if (!success) return NextResponse.json({ success: false, error }, { status: 401 });
    if (user?.role === 'student') {
      return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });
    }

    const surveyId = parseInt(params.id);
    if (isNaN(surveyId)) {
      return NextResponse.json({ success: false, error: 'Invalid survey ID' }, { status: 400 });
    }

    const body = await request.json();
    const { emails, customMessage } = body as {
      emails: string[];
      customMessage?: string;
    };

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ success: false, error: 'emails array is required' }, { status: 400 });
    }

    if (emails.length > MAX_EMAILS_PER_REQUEST) {
      return NextResponse.json(
        { success: false, error: `Maximum ${MAX_EMAILS_PER_REQUEST} emails per request` },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emails.filter((e) => !emailRegex.test(e.trim()));
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        { success: false, error: `Invalid email addresses: ${invalidEmails.slice(0, 5).join(', ')}` },
        { status: 400 }
      );
    }

    // Fetch survey
    const survey = await prisma.surveys.findUnique({
      where: { id: surveyId },
      include: {
        program: { select: { name: true } },
        courseOffering: {
          include: { course: { select: { name: true, code: true } } },
        },
      },
    });

    if (!survey) {
      return NextResponse.json({ success: false, error: 'Survey not found' }, { status: 404 });
    }

    if (survey.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Survey must be active to send invitations' },
        { status: 400 }
      );
    }

    if (!survey.publicToken) {
      return NextResponse.json(
        { success: false, error: 'Survey does not have a public token. Please publish it first.' },
        { status: 400 }
      );
    }

    // Check due date
    if (survey.dueDate && new Date(survey.dueDate) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Survey due date has passed' },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const surveyUrl = `${appUrl}/surveys/${survey.publicToken}`;
    const dueDateStr = survey.dueDate
      ? new Date(survey.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : undefined;

    // Send emails concurrently (batch of 10 to avoid rate limits)
    const sent: string[] = [];
    const failed: string[] = [];

    const cleanEmails = emails.map((e) => e.trim().toLowerCase());
    const batchSize = 10;

    for (let i = 0; i < cleanEmails.length; i += batchSize) {
      const batch = cleanEmails.slice(i, i + batchSize);
      await Promise.allSettled(
        batch.map(async (email) => {
          try {
            await sendSurveyInvitation({
              to: email,
              surveyTitle: survey.title,
              surveyDescription: survey.description ?? undefined,
              surveyUrl,
              dueDate: dueDateStr,
              customMessage: customMessage ?? undefined,
            });
            sent.push(email);
          } catch {
            failed.push(email);
          }
        })
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        sent: sent.length,
        failed,
        total: cleanEmails.length,
        surveyUrl,
      },
    });
  } catch (err) {
    console.error('[SEND_SURVEY_INVITATIONS]', err);
    return NextResponse.json(
      { success: false, error: 'Failed to send invitations' },
      { status: 500 }
    );
  }
}
