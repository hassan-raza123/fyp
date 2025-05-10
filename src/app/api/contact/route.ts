import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { z } from 'zod';

/**
 * @swagger
 * /api/contact:
 *   post:
 *     summary: Send contact form message
 *     description: Send a message through the contact form
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - subject
 *               - message
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *               email:
 *                 type: string
 *                 format: email
 *               subject:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 100
 *               message:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 1000
 *     responses:
 *       200:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid form data
 *       429:
 *         description: Too many requests
 *       500:
 *         description: Internal server error
 */

// Email validation schema
const emailSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  subject: z.string().min(5).max(100),
  message: z.string().min(10).max(1000),
});

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
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
      (time) => now - time < RATE_LIMIT_WINDOW
    );

    if (recentRequests.length >= MAX_REQUESTS) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    recentRequests.push(now);
    rateLimit.set(email, recentRequests);

    // Email content for support team
    const supportMailOptions = {
      from: {
        name: 'UniTrack360 Support',
        address: process.env.GMAIL_USER!,
      },
      to: process.env.GMAIL_USER,
      replyTo: {
        name: name,
        address: email,
      },
      subject: `📬 New Contact Request: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #6B46C1; margin: 0;">UniTrack360</h1>
            <p style="color: #4B5563; margin: 5px 0;">New Contact Form Submission</p>
          </div>
          
          <div style="background: #F9FAFB; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #374151; margin: 0 0 15px 0; font-size: 18px;">Contact Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6B7280; width: 100px;">Name:</td>
                <td style="padding: 8px 0; color: #111827; font-weight: 500;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6B7280;">Email:</td>
                <td style="padding: 8px 0; color: #111827;">
                  <a href="mailto:${email}" style="color: #6B46C1; text-decoration: none;">${email}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6B7280;">Subject:</td>
                <td style="padding: 8px 0; color: #111827; font-weight: 500;">${subject}</td>
              </tr>
            </table>
          </div>

          <div style="background: #F9FAFB; padding: 20px; border-radius: 8px;">
            <h2 style="color: #374151; margin: 0 0 15px 0; font-size: 18px;">Message</h2>
            <div style="color: #111827; line-height: 1.5; white-space: pre-wrap;">${message}</div>
          </div>

          <div style="margin-top: 20px; text-align: center;">
            <a href="mailto:${email}" style="display: inline-block; background: #6B46C1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reply to ${name}</a>
          </div>
        </div>
      `,
    };

    // Email content for user acknowledgment
    const userMailOptions = {
      from: {
        name: 'UniTrack360 Support',
        address: process.env.GMAIL_USER!,
      },
      to: email,
      subject: 'Thank you for contacting UniTrack360',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #6B46C1; margin: 0;">UniTrack360</h1>
            <p style="color: #4B5563; margin: 5px 0;">Thank you for reaching out!</p>
          </div>

          <div style="background: #F9FAFB; padding: 20px; border-radius: 8px;">
            <p style="color: #111827; margin: 0 0 15px 0;">Dear ${name},</p>
            <p style="color: #4B5563; line-height: 1.5;">Thank you for contacting UniTrack360. We have received your message and our support team will review it shortly.</p>
            <p style="color: #4B5563; line-height: 1.5;">We typically respond within 24-48 hours during business days.</p>
            <p style="color: #4B5563; line-height: 1.5;">If you have any urgent queries, please feel free to call us at our support number.</p>
          </div>

          <div style="margin-top: 20px; text-align: center; color: #6B7280; font-size: 14px;">
            <p>Best regards,</p>
            <p style="margin: 5px 0; color: #6B46C1; font-weight: 500;">The UniTrack360 Team</p>
          </div>
        </div>
      `,
    };

    // Send both emails
    const [supportInfo, userInfo] = await Promise.all([
      transporter.sendMail(supportMailOptions),
      transporter.sendMail(userMailOptions),
    ]);

    console.log('Support email sent successfully:', supportInfo);
    console.log('User acknowledgment email sent successfully:', userInfo);

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
