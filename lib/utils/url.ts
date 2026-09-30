const AMAZON_HOST =
  /(^|\.)amazon\.(com|in|co\.uk|de|fr|it|es|ca|com\.au|co\.jp|com\.mx|com\.br|nl|se|pl|sg|ae|sa)$/i;
const ASIN_PATTERN = /\/(?:dp|gp\/product|gp\/aw\/d)\/([A-Z0-9]{10})/i;

export function isValidAmazonProductURL(input: string) {
  try {
    const url = new URL(input.trim());
    return (
      (url.protocol === 'https:' || url.protocol === 'http:') &&
      AMAZON_HOST.test(url.hostname) &&
      ASIN_PATTERN.test(url.pathname)
    );
  } catch {
    return false;
  }
}

/**
 * Cheap client-side check that the input looks like a product page on a
 * public website. The server does full validation and SSRF checks.
 */
export function isValidProductURL(input: string) {
  try {
    const url = new URL(input.trim());
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(url.hostname)) return false;
    if (AMAZON_HOST.test(url.hostname)) return ASIN_PATTERN.test(url.pathname);
    return url.pathname.length > 1;
  } catch {
    return false;
  }
}

/** Reduce an Amazon URL to its canonical `/dp/<ASIN>` form. */
export function normalizeAmazonURL(input: string) {
  const url = new URL(input.trim());
  const asin = url.pathname.match(ASIN_PATTERN)?.[1];
  if (!asin) return url.toString();
  return `https://${url.hostname.toLowerCase()}/dp/${asin.toUpperCase()}`;
}
