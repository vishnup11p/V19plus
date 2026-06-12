import nodemailer from 'nodemailer';
import { logger } from './logger';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = `"V19+" <${process.env.SMTP_USER || 'noreply@v19plus.com'}>`;

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  try {
    await transporter.sendMail({
      from: FROM,
      to: email,
      subject: 'Verify your V19+ account',
      html: `
        <div style="background:#0A0A0A;color:#F5F5F0;padding:40px;font-family:Segoe UI,sans-serif;">
          <h1 style="color:#FF6B1A;">V19<span style="color:#FF6B1A;">+</span></h1>
          <h2>Verify your email</h2>
          <p>Click the button below to verify your email address.</p>
          <a href="${verifyUrl}" style="display:inline-block;background:#FF6B1A;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;margin:20px 0;">
            Verify Email
          </a>
          <p style="color:#9A9A94;font-size:12px;">This link expires in 24 hours.</p>
        </div>
      `,
    });
    logger.info(`Verification email sent to ${email}`);
  } catch (error) {
    logger.error('Failed to send verification email:', error);
  }
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  try {
    await transporter.sendMail({
      from: FROM,
      to: email,
      subject: 'Reset your V19+ password',
      html: `
        <div style="background:#0A0A0A;color:#F5F5F0;padding:40px;font-family:Segoe UI,sans-serif;">
          <h1 style="color:#FF6B1A;">V19<span style="color:#FF6B1A;">+</span></h1>
          <h2>Reset your password</h2>
          <p>Click the button below to reset your password.</p>
          <a href="${resetUrl}" style="display:inline-block;background:#FF6B1A;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;margin:20px 0;">
            Reset Password
          </a>
          <p style="color:#9A9A94;font-size:12px;">This link expires in 1 hour.</p>
        </div>
      `,
    });
    logger.info(`Password reset email sent to ${email}`);
  } catch (error) {
    logger.error('Failed to send password reset email:', error);
  }
}
