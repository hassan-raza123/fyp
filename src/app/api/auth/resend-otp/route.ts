import { NextRequest, NextResponse } from 'next/server';
import { randomInt } from 'crypto';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import { sendOTPEmail } from '@/lib/email-utils';
// Use the shared client: instantiating PrismaClient per module opens a separate
// connection pool on every serverless instance and exhausts DB connections.
import { prisma } from '@/lib/prisma';
import { captureOtp } from '@/lib/e2e-otp-store';
import { consumeRateLimit, getClientIp } from '@/lib/rate-limit';

// Resend limits — this endpoint sends email, so it is also a spam vector
const RESEND_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_RESENDS_PER_EMAIL = 5;
const MAX_RESENDS_PER_IP = 20;

const resendOTPSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email format')
    .min(1, 'Email cannot be empty')
    .max(255, 'Email is too long')
    .trim()
    .toLowerCase(),
  userType: z.enum(['student', 'faculty', 'admin'] as const, {
    required_error: 'User type is required',
    invalid_type_error: 'Invalid user type',
  }),
});

// Math.random() is not cryptographically secure and its output is predictable
// from prior values — an OTP must come from a CSPRNG, matching the login route.
function generateOTP(): string {
  return randomInt(100000, 1000000).toString();
}


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = resendOTPSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors,
        },
        { status: 400 }
      );
    }

    const { email, userType } = validationResult.data;

    const [emailLimit, ipLimit] = await Promise.all([
      consumeRateLimit({
        key: `resend-otp:${email}`,
        limit: MAX_RESENDS_PER_EMAIL,
        windowMs: RESEND_WINDOW,
      }),
      consumeRateLimit({
        key: `resend-otp-ip:${getClientIp(request)}`,
        limit: MAX_RESENDS_PER_IP,
        windowMs: RESEND_WINDOW,
      }),
    ]);

    if (!emailLimit.allowed || !ipLimit.allowed) {
      const retryAfter = Math.max(
        emailLimit.retryAfterSeconds,
        ipLimit.retryAfterSeconds
      );
      return NextResponse.json(
        {
          success: false,
          message: `Too many code requests. Please try again in ${Math.ceil(
            retryAfter / 60
          )} minute(s).`,
        },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      );
    }

    // Check if user exists
    const user = await prisma.users.findUnique({
      where: {
        email,
        status: 'active',
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found',
        },
        { status: 404 }
      );
    }

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    // Delete any existing OTPs for this user
    await prisma.$executeRaw`
      DELETE FROM otps 
      WHERE email = ${email} 
      AND userType = ${userType} 
      AND isUsed = false
    `;

    // Save OTP to database.
    // The code must be hashed: verify-otp checks it with bcrypt.compare, so a
    // plaintext row can never match and every resent code was rejected.
    const hashedOTP = await hash(otp, 10);

    await prisma.otps.create({
      data: {
        email,
        userType,
        code: hashedOTP,
        expiresAt,
        isUsed: false,
      },
    });

    // Send OTP via email
    // Inert unless E2E_TEST_MODE is on
    captureOtp(email, otp);

    try {
      await sendOTPEmail(email, otp);
    } catch (mailError) {
      // The code is already stored; a mail outage must not 500 the request
      console.error(`Failed to email OTP to ${email}:`, mailError);
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[dev] OTP for ${email} is ${otp} — email is not configured.`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'New OTP sent successfully. Please check your email.',
      data: {
        email: email,
        userType: userType,
      },
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while sending OTP',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
