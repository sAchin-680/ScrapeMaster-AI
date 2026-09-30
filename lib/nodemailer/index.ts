import 'server-only';
import nodemailer, { type Transporter } from 'nodemailer';
import { env, isEmailConfigured } from '@/lib/env';
import type { EmailContent } from '@/types';
import { oneClickUnsubscribeUrl, unsubscribeUrl } from '@/lib/unsubscribe';
import { UNSUBSCRIBE_PLACEHOLDER } from './templates';

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

/**
 * Send one message per recipient so each gets a personal unsubscribe link
 * (required by anti-spam rules) and addresses are never shared.
 */
export async function sendEmail(
  content: EmailContent,
  recipients: string[],
  productId: string,
) {
  if (!recipients.length) return;
  if (!isEmailConfigured) {
    console.warn('[mail] SMTP is not configured, skipping email:', content.subject);
    return;
  }

  const results = await Promise.allSettled(
    recipients.map((to) => {
      const link = unsubscribeUrl(productId, to);
      return getTransporter().sendMail({
        from: env.EMAIL_FROM ?? env.SMTP_USER,
        to,
        subject: content.subject,
        html: content.body.replaceAll(UNSUBSCRIBE_PLACEHOLDER, link),
        headers: {
          'List-Unsubscribe': `<${oneClickUnsubscribeUrl(productId, to)}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      });
    }),
  );
  const failed = results.filter((r) => r.status === 'rejected').length;
  if (failed)
    console.error(
      `[mail] ${failed}/${recipients.length} emails failed:`,
      content.subject,
    );
}
