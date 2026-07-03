import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email';
import { logger } from '../utils/logger';

interface EmailJob {
  type: 'verification' | 'password-reset';
  email: string;
  token: string;
}

const queue: EmailJob[] = [];
let processing = false;

async function processQueue() {
  if (processing || queue.length === 0) return;
  processing = true;

  while (queue.length > 0) {
    const job = queue.shift()!;
    try {
      if (job.type === 'verification') {
        await sendVerificationEmail(job.email, job.token);
      } else {
        await sendPasswordResetEmail(job.email, job.token);
      }
    } catch (err) {
      logger.error(`Email job failed for ${job.email}:`, err);
    }
  }

  processing = false;
}

export function enqueueEmail(job: EmailJob) {
  queue.push(job);
  processQueue().catch((err) => logger.error('Email queue error:', err));
}
