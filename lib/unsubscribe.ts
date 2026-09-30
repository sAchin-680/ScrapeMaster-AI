import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '@/lib/env';
import { siteConfig } from '@/lib/site';

function sign(productId: string, email: string) {
  const secret = env.APP_SECRET ?? env.CRON_SECRET ?? 'development-only-secret';
  return createHmac('sha256', secret)
    .update(`${productId}:${email.toLowerCase()}`)
    .digest('base64url');
}

function params(productId: string, email: string) {
  return new URLSearchParams({ p: productId, e: email, t: sign(productId, email) });
}

/** Signed unsubscribe page link, so nobody can remove someone else's alert. */
export function unsubscribeUrl(productId: string, email: string) {
  return `${siteConfig.url}/unsubscribe?${params(productId, email)}`;
}

/** RFC 8058 one-click endpoint used by mail clients' built-in unsubscribe button. */
export function oneClickUnsubscribeUrl(productId: string, email: string) {
  return `${siteConfig.url}/api/unsubscribe?${params(productId, email)}`;
}

/** Remove an email from a product's watchers when the signature is valid. */
export async function unsubscribe(productId: string, email: string, token: string) {
  if (!/^[a-f\d]{24}$/i.test(productId) || !email || !token) return false;
  if (!verifyUnsubscribe(productId, email, token)) return false;
  const [{ connectDB }, { default: ProductModel }] = await Promise.all([
    import('@/lib/db'),
    import('@/lib/models/product.model'),
  ]);
  await connectDB();
  await ProductModel.updateOne(
    { _id: productId },
    { $pull: { users: { email: email.toLowerCase() } } },
  );
  return true;
}

export function verifyUnsubscribe(productId: string, email: string, token: string) {
  const expected = Buffer.from(sign(productId, email));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
