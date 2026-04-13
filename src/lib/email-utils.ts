import nodemailer from 'nodemailer';
import { getDefaultPassword } from './password-utils';

// Application name - update this if project name changes
const APPLICATION_NAME = 'EduTrack - OBE Management System';

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// Export transporter for use in other files if needed
export { transporter };

interface AdminAssignmentEmailData {
  email: string;
  firstName: string;
  lastName: string;
  departmentName: string;
  departmentCode: string;
  loginUrl?: string;
  password?: string; // Optional password, will use role-based default if not provided
  role?: 'super_admin' | 'admin' | 'faculty' | 'student'; // Role for password generation
}

export async function sendAdminAssignmentEmail(
  data: AdminAssignmentEmailData
): Promise<void> {
  const { email, firstName, lastName, departmentName, departmentCode, loginUrl, password, role } = data;
  
  // Use provided password or generate role-based password
  let defaultPassword = password;
  if (!defaultPassword && role) {
    defaultPassword = getDefaultPassword(role);
  } else if (!defaultPassword) {
    // Fallback for admin (most common case)
    defaultPassword = getDefaultPassword('admin');
  }
  const username = email.split('@')[0];
  const loginLink = loginUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`;

  const mailOptions = {
    from: {
      name: APPLICATION_NAME,
      address: process.env.GMAIL_USER!,
    },
    to: email,
    subject: `Department Admin Account - ${departmentName} - ${APPLICATION_NAME}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #6B46C1; margin: 0;">${APPLICATION_NAME}</h1>
          <p style="color: #4B5563; margin: 5px 0;">Department Admin Account Assignment</p>
        </div>

        <div style="background: #F9FAFB; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="color: #111827; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">Dear ${firstName} ${lastName},</p>
          
          <p style="color: #4B5563; line-height: 1.6; margin: 0 0 15px 0;">
            Congratulations! You have been assigned as the Department Admin for <strong>${departmentName} (${departmentCode})</strong> on the ${APPLICATION_NAME} platform.
          </p>

          <p style="color: #4B5563; line-height: 1.6; margin: 0 0 20px 0;">
            Your admin account has been created successfully. Please use the following credentials to log in:
          </p>

          <div style="background: #FFFFFF; border: 2px solid #E5E7EB; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #111827; margin: 0 0 15px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Your Login Credentials</h3>
            
            <div style="margin-bottom: 15px;">
              <p style="color: #6B7280; margin: 0 0 5px 0; font-size: 12px; font-weight: 600;">Email / Username:</p>
              <p style="color: #111827; margin: 0; font-size: 16px; font-weight: 600; font-family: monospace; background: #F3F4F6; padding: 8px; border-radius: 4px;">${email}</p>
            </div>

            <div style="margin-bottom: 15px;">
              <p style="color: #6B7280; margin: 0 0 5px 0; font-size: 12px; font-weight: 600;">Username (Alternative):</p>
              <p style="color: #111827; margin: 0; font-size: 16px; font-weight: 600; font-family: monospace; background: #F3F4F6; padding: 8px; border-radius: 4px;">${username}</p>
            </div>

            <div>
              <p style="color: #6B7280; margin: 0 0 5px 0; font-size: 12px; font-weight: 600;">Default Password:</p>
              <p style="color: #111827; margin: 0; font-size: 16px; font-weight: 600; font-family: monospace; background: #F3F4F6; padding: 8px; border-radius: 4px;">${defaultPassword}</p>
            </div>
          </div>

          <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="color: #92400E; margin: 0; font-size: 14px; line-height: 1.5;">
              <strong>⚠️ Security Notice:</strong> Please change your password immediately after your first login for security purposes.
            </p>
          </div>

          <div style="margin: 25px 0;">
            <a href="${loginLink}" style="display: inline-block; background: #6B46C1; color: #FFFFFF; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600; text-align: center;">
              Login to Your Account
            </a>
          </div>

          <div style="background: #EFF6FF; border-left: 4px solid #3B82F6; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="color: #1E40AF; margin: 0 0 10px 0; font-size: 14px; font-weight: 600;">What's Next?</p>
            <ul style="color: #1E40AF; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
              <li>Log in using the credentials provided above</li>
              <li>Change your password to a secure one</li>
              <li>Explore your department dashboard</li>
              <li>Start managing your department's activities</li>
            </ul>
          </div>

          <p style="color: #4B5563; line-height: 1.6; margin: 20px 0 0 0;">
            If you have any questions or need assistance, please don't hesitate to contact our support team.
          </p>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB; text-align: center; color: #6B7280; font-size: 12px;">
          <p style="margin: 5px 0;">This is an automated email. Please do not reply to this message.</p>
          <p style="margin: 5px 0; color: #6B46C1; font-weight: 500;">${APPLICATION_NAME}</p>
          <p style="margin: 5px 0;">© ${new Date().getFullYear()} All rights reserved</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending admin assignment email:', error);
    throw error;
  }
}

// ============================================================================
// OTP Email Functions
// ============================================================================

/**
 * Send OTP verification email
 */
export async function sendOTPEmail(email: string, otp: string): Promise<void> {
  const mailOptions = {
    from: {
      name: APPLICATION_NAME,
      address: process.env.GMAIL_USER!,
    },
    to: email,
    subject: `Your Login Verification Code - ${APPLICATION_NAME}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #6B46C1; margin: 0;">${APPLICATION_NAME}</h1>
          <p style="color: #4B5563; margin: 5px 0;">Login Verification Code</p>
        </div>

        <div style="background: #F9FAFB; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="color: #111827; margin: 0 0 15px 0;">Hello,</p>
          <p style="color: #4B5563; line-height: 1.5;">Your verification code for ${APPLICATION_NAME} login is:</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 8px;">
            ${otp}
          </div>

          <p style="color: #4B5563; line-height: 1.5;">This code will expire in 5 minutes.</p>
          <p style="color: #4B5563; line-height: 1.5;">If you didn't request this code, please ignore this email.</p>
        </div>

        <div style="margin-top: 20px; text-align: center; color: #6B7280; font-size: 14px;">
          <p>If you have any questions, please contact our support team.</p>
          <p style="margin: 5px 0; color: #6B46C1; font-weight: 500;">The ${APPLICATION_NAME} Team</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw error;
  }
}

// ============================================================================
// Password Reset Email Functions
// ============================================================================

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string
): Promise<void> {
  const mailOptions = {
    from: {
      name: APPLICATION_NAME,
      address: process.env.GMAIL_USER!,
    },
    to: email,
    subject: `Password Reset Request - ${APPLICATION_NAME}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #6B46C1; margin: 0;">${APPLICATION_NAME}</h1>
          <p style="color: #4B5563; margin: 5px 0;">Password Reset Request</p>
        </div>

        <div style="background: #F9FAFB; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="color: #111827; margin: 0 0 15px 0;">Hello,</p>
          <p style="color: #4B5563; line-height: 1.5;">We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
          <p style="color: #4B5563; line-height: 1.5;">To reset your password, click the button below:</p>
          
          <div style="margin: 20px 0; text-align: center;">
            <a href="${resetUrl}" style="display: inline-block; background: #6B46C1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
              Reset Password
            </a>
          </div>

          <p style="color: #4B5563; line-height: 1.5;">Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #6B7280; background: #F3F4F6; padding: 10px; border-radius: 4px; font-size: 14px;">${resetUrl}</p>
          
          <p style="color: #4B5563; line-height: 1.5; margin-top: 15px;">This link will expire in 30 minutes.</p>
        </div>

        <div style="margin-top: 20px; text-align: center; color: #6B7280; font-size: 14px;">
          <p>If you have any questions, please contact our support team.</p>
          <p style="margin: 5px 0; color: #6B46C1; font-weight: 500;">The ${APPLICATION_NAME} Team</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
}

// ============================================================================
// Survey Invitation Email Functions
// ============================================================================

interface SurveyInvitationData {
  to: string;
  surveyTitle: string;
  surveyDescription?: string;
  surveyUrl: string;
  dueDate?: string;
  customMessage?: string;
  senderName?: string;
}

/**
 * Send a survey invitation email with a unique survey link.
 * Used for alumni, employer, and external stakeholder surveys.
 */
export async function sendSurveyInvitation(data: SurveyInvitationData): Promise<void> {
  const {
    to,
    surveyTitle,
    surveyDescription,
    surveyUrl,
    dueDate,
    customMessage,
    senderName,
  } = data;

  const mailOptions = {
    from: {
      name: APPLICATION_NAME,
      address: process.env.GMAIL_USER!,
    },
    to,
    subject: `Survey Invitation: ${surveyTitle} — ${APPLICATION_NAME}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #6B46C1; margin: 0;">${APPLICATION_NAME}</h1>
          <p style="color: #4B5563; margin: 5px 0;">Survey Invitation</p>
        </div>

        <div style="background: #F9FAFB; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="color: #111827; margin: 0 0 15px 0;">Dear Participant,</p>

          ${customMessage ? `<p style="color: #4B5563; line-height: 1.6; margin: 0 0 15px 0;">${customMessage}</p>` : ''}

          <p style="color: #4B5563; line-height: 1.6; margin: 0 0 15px 0;">
            ${senderName ? `<strong>${senderName}</strong> has invited you` : 'You have been invited'} to participate in the following survey:
          </p>

          <div style="background: #FFFFFF; border: 2px solid #E5E7EB; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h2 style="color: #111827; margin: 0 0 10px 0; font-size: 18px;">${surveyTitle}</h2>
            ${surveyDescription ? `<p style="color: #6B7280; margin: 0 0 10px 0; line-height: 1.5;">${surveyDescription}</p>` : ''}
            ${dueDate ? `<p style="color: #F59E0B; margin: 0; font-size: 13px;"><strong>Due Date:</strong> ${dueDate}</p>` : ''}
          </div>

          <p style="color: #4B5563; line-height: 1.6; margin: 0 0 20px 0;">
            Your feedback is valuable and helps us improve our program quality. The survey is anonymous and should take only a few minutes to complete.
          </p>

          <div style="margin: 25px 0; text-align: center;">
            <a href="${surveyUrl}" style="display: inline-block; background: #6B46C1; color: #FFFFFF; text-decoration: none; padding: 14px 35px; border-radius: 6px; font-weight: 600; font-size: 16px;">
              Take Survey
            </a>
          </div>

          <p style="color: #9CA3AF; font-size: 12px; line-height: 1.5; margin: 0;">
            Or copy and paste this link into your browser:<br/>
            <span style="word-break: break-all; color: #6B7280;">${surveyUrl}</span>
          </p>
        </div>

        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #E5E7EB; text-align: center; color: #6B7280; font-size: 12px;">
          <p style="margin: 5px 0;">This survey link is unique to your invitation. Please do not share it.</p>
          <p style="margin: 5px 0; color: #6B46C1; font-weight: 500;">${APPLICATION_NAME}</p>
          <p style="margin: 5px 0;">© ${new Date().getFullYear()} All rights reserved</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error(`Error sending survey invitation to ${to}:`, error);
    throw error;
  }
}

// ============================================================================
// Contact Form Email Functions
// ============================================================================

interface ContactEmailData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

/**
 * Send contact form emails (to support and user acknowledgment)
 */
export async function sendContactEmails(data: ContactEmailData): Promise<void> {
  const { name, email, subject, message } = data;

  // Email content for support team
  const supportMailOptions = {
    from: {
      name: APPLICATION_NAME,
      address: process.env.GMAIL_USER!,
    },
    to: process.env.GMAIL_USER!,
    replyTo: {
      name: name,
      address: email,
    },
    subject: `📬 New Contact Request: ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #6B46C1; margin: 0;">${APPLICATION_NAME}</h1>
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
      name: APPLICATION_NAME,
      address: process.env.GMAIL_USER!,
    },
    to: email,
    subject: `Thank you for contacting ${APPLICATION_NAME}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #6B46C1; margin: 0;">${APPLICATION_NAME}</h1>
          <p style="color: #4B5563; margin: 5px 0;">Thank you for reaching out!</p>
        </div>

        <div style="background: #F9FAFB; padding: 20px; border-radius: 8px;">
          <p style="color: #111827; margin: 0 0 15px 0;">Dear ${name},</p>
          <p style="color: #4B5563; line-height: 1.5;">Thank you for contacting ${APPLICATION_NAME}. We have received your message and our support team will review it shortly.</p>
          <p style="color: #4B5563; line-height: 1.5;">We typically respond within 24-48 hours during business days.</p>
          <p style="color: #4B5563; line-height: 1.5;">If you have any urgent queries, please feel free to call us at our support number.</p>
        </div>

        <div style="margin-top: 20px; text-align: center; color: #6B7280; font-size: 14px;">
          <p>Best regards,</p>
          <p style="margin: 5px 0; color: #6B46C1; font-weight: 500;">The ${APPLICATION_NAME} Team</p>
        </div>
      </div>
    `,
  };

  try {
    await Promise.all([
      transporter.sendMail(supportMailOptions),
      transporter.sendMail(userMailOptions),
    ]);
  } catch (error) {
    console.error('Error sending contact emails:', error);
    throw error;
  }
}

