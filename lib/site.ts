/** Explicit public URL, else the Vercel deployment URL, else localhost. */
function siteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return /^https?:\/\//.test(explicit) ? explicit : `https://${explicit}`;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  return vercel ? `https://${vercel}` : 'http://localhost:3000';
}

export const siteConfig = {
  name: 'ScrapeMaster',
  tagline: 'Real-time price tracker for any online store',
  description:
    'Track prices on Amazon, Flipkart, Walmart and any online store. See full price history, compare stores and get an email the moment it drops.',
  url: siteUrl(),
};
