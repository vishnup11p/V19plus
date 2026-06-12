import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as nodemailer from 'nodemailer';

interface EmailJob {
  type: 'verification' | 'password-reset';
  email: string;
  token: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private transporter: nodemailer.Transporter;
  private FROM = `"V19+" <noreply@v19plus.com>`;

  // In-memory queue
  private emailQueue: EmailJob[] = [];
  private isProcessing = false;

  constructor(private readonly prisma: PrismaService) {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    if (process.env.SMTP_USER) {
      this.FROM = `"V19+" <${process.env.SMTP_USER}>`;
      this.logger.log('📧 Nodemailer transporter configured');
    } else {
      this.logger.log('📧 Nodemailer running in sandbox mode (logs only)');
    }
  }

  async sendPushNotification(userId: string, title: string, message: string) {
    // Save to database
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        title,
        message,
        isRead: false,
      },
    });

    // Mock FCM trigger
    this.logger.log(`📱 Push sent to User ${userId}: [${title}] ${message}`);
    return notification;
  }

  async listNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(userId: string, notificationId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  async enqueueEmail(job: EmailJob) {
    this.emailQueue.push(job);
    this.processQueue().catch((err) => this.logger.error('Email queue worker crash:', err));
  }

  private async processQueue() {
    if (this.isProcessing || this.emailQueue.length === 0) return;
    this.isProcessing = true;

    while (this.emailQueue.length > 0) {
      const job = this.emailQueue.shift()!;
      try {
        if (job.type === 'verification') {
          await this.sendVerificationEmail(job.email, job.token);
        } else {
          await this.sendPasswordResetEmail(job.email, job.token);
        }
      } catch (err) {
        this.logger.error(`Failed to send email to ${job.email}:`, err);
      }
    }

    this.isProcessing = false;
  }

  private async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
    if (!process.env.SMTP_USER) {
      this.logger.log(`[Email Sandbox] Send Verification link to ${email}: ${verifyUrl}`);
      return;
    }

    await this.transporter.sendMail({
      from: this.FROM,
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
    this.logger.log(`Verification email sent to ${email}`);
  }

  private async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    if (!process.env.SMTP_USER) {
      this.logger.log(`[Email Sandbox] Send Password Reset link to ${email}: ${resetUrl}`);
      return;
    }

    await this.transporter.sendMail({
      from: this.FROM,
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
    this.logger.log(`Password reset email sent to ${email}`);
  }
}
