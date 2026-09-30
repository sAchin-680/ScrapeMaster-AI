import 'server-only';
import nodemailer, { type Transporter } from 'nodemailer';
import { env, isEmailConfigured } from '@/lib/env';
import type { EmailContent } from '@/types';

export { generateEmailBody } from './templates';

let transporter: Transporter | null = null;

function getTransporter() {
  transporter ??= nodemailer.createTransport({
    pool: true,
    maxConnections: 2,
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
  });
  return transporter;
}

export async function sendEmail(content: EmailContent, recipients: string[]) {
  if (!recipients.length) return;
  if (!isEmailConfigured) {
    console.warn('[mail] SMTP is not configured, skipping email:', content.subject);
    return;
  }

  // BCC keeps subscriber addresses private from each other.
  await getTransporter().sendMail({
    from: env.EMAIL_FROM ?? env.SMTP_USER,
    to: env.EMAIL_FROM ?? env.SMTP_USER,
    bcc: recipients,
    subject: content.subject,
    html: content.body,
  });
}
