import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '@/lib/env';
import { siteConfig } from '@/lib/site';

function sign(productId: string, email: string) {
  const secret = env.APP_SECRET ?? env.CRON_SECRET ?? 'development-only-secret';
  return createHmac('sha256', secret).update(`${productId}:${email.toLowerCase()}`).digest('base64url');
}

/** Signed one-click unsubscribe link, so nobody can remove someone else's alert. */
export function unsubscribeUrl(productId: string, email: string) {
  const params = new URLSearchParams({ p: productId, e: email, t: sign(productId, email) });
  return `${siteConfig.url}/unsubscribe?${params}`;
}

export function verifyUnsubscribe(productId: string, email: string, token: string) {
  const expected = Buffer.from(sign(productId, email));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
