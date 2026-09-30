import type { EmailContent, EmailProductInfo, NotificationType } from '@/types';
import { THRESHOLD_PERCENTAGE } from '@/lib/notifications';
import { formatPrice, truncate } from '@/lib/utils/format';

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

function layout(heading: string, message: string, product: EmailProductInfo) {
  const title = escapeHtml(product.title);
  const url = escapeHtml(product.url);
  const price =
    product.currentPrice !== undefined
      ? `<p style="margin:0 0 20px;font:600 28px/1.2 ui-monospace,Menlo,monospace;color:#0a0a0a">${escapeHtml(
          formatPrice(product.currentPrice, product.currency),
        )}</p>`
      : '';
  const image = product.image
    ? `<img src="${escapeHtml(product.image)}" alt="" width="160" style="display:block;margin:0 0 20px;max-width:160px;height:auto;border-radius:12px" />`
    : '';

  return `<!doctype html>
<html><body style="margin:0;background:#f4f2ec;padding:32px 16px;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:20px;border:1px solid #e7e4dc">
    <tr><td style="padding:32px">
      <p style="margin:0 0 24px;font:700 13px/1 ui-monospace,Menlo,monospace;letter-spacing:.12em;text-transform:uppercase;color:#6b6b6b">ScrapeMaster</p>
      <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#0a0a0a">${heading}</h1>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#3d3d3d">${message}</p>
      ${image}
      <p style="margin:0 0 8px;font-size:15px;font-weight:600;color:#0a0a0a">${title}</p>
      ${price}
      <a href="${url}" style="display:inline-block;background:#0a0a0a;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600;font-size:14px">View on Amazon</a>
    </td></tr>
  </table>
  <p style="text-align:center;margin:20px 0 0;font-size:12px;color:#8a8a8a">You are receiving this because you asked to track this product.</p>
</body></html>`;
}

export function generateEmailBody(
  product: EmailProductInfo,
  type: NotificationType,
): EmailContent {
  const short = truncate(product.title, 40);

  switch (type) {
    case 'WELCOME':
      return {
        subject: `Now tracking: ${short}`,
        body: layout(
          'You are on the watchlist',
          'We check this product regularly and will email you when it hits a new low, comes back in stock, or drops significantly in price.',
          product,
        ),
      };
    case 'CHANGE_OF_STOCK':
      return {
        subject: `Back in stock: ${short}`,
        body: layout('It is back in stock', 'Grab it before it sells out again.', product),
      };
    case 'LOWEST_PRICE':
      return {
        subject: `Lowest price ever: ${short}`,
        body: layout(
          'New all-time low',
          'This product just dropped below every price we have recorded.',
          product,
        ),
      };
    case 'THRESHOLD_MET':
      return {
        subject: `${THRESHOLD_PERCENTAGE}%+ off: ${short}`,
        body: layout(
          'Big discount detected',
          `This product is now discounted by more than ${THRESHOLD_PERCENTAGE}%.`,
          product,
        ),
      };
  }
}
