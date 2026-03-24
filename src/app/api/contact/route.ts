import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sendContactEmails } from '@/lib/email-utils';

// Email validation schema
const emailSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  subject: z.string().min(5).max(100),
  message: z.string().min(10).max(1000),
});


// Rate limiting setup
const rateLimit = new Map();
const RATE_LIMIT_WINDOW = 3600000; // 1 hour
const MAX_REQUESTS = 5;

export async function POST(req: Request) {
  try {
    // Get form data from request
    const body = await req.json();

    // Validate email format and content
    const validatedData = emailSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid form data. Please check your inputs.' },
        { status: 400 }
      );
    }

    const { name, email, subject, message } = validatedData.data;

    // Rate limiting check
    const now = Date.now();
    const userRequests = rateLimit.get(email) || [];
    const recentRequests = userRequests.filter(
      (time: number) => now - time < RATE_LIMIT_WINDOW
    );

    if (recentRequests.length >= MAX_REQUESTS) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    recentRequests.push(now);
    rateLimit.set(email, recentRequests);

    // Send both emails using email-utils
    await sendContactEmails({ name, email, subject, message });

    return NextResponse.json(
      { message: 'Emails sent successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending emails:', error);
    return NextResponse.json(
      { error: 'Failed to send emails. Please try again later.' },
      { status: 500 }
    );
  }
}
