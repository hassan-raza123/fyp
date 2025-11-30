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
    console.log(`Admin assignment email sent successfully to ${email}`);
  } catch (error) {
    console.error('Error sending admin assignment email:', error);
    throw error;
  }
}

