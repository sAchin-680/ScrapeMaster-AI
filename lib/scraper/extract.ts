import type { CheerioAPI } from 'cheerio';

type Selection = ReturnType<CheerioAPI>;

/** Parse a localized price string such as "₹1,299.00" or "1.299,00 €". */
export function parsePrice(raw: string) {
  const cleaned = raw.replace(/[^\d.,]/g, '');
  if (!cleaned) return 0;

  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');
  let normalized = cleaned;

  if (lastComma > lastDot && cleaned.length - lastComma === 3) {
    // European format: "1.299,00"
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
    normalized = cleaned.replace(/,/g, '');
  }

  // Duplicate nodes can concatenate values ("499.00499.00"); keep the first.
  const match = normalized.match(/^\d+(\.\d{1,2})?/);
  return match ? Number(match[0]) : 0;
}

export function extractPrice(...elements: Selection[]) {
  for (const element of elements) {
    const price = parsePrice(element.first().text().trim());
    if (price > 0) return price;
  }
  return 0;
}

export function extractCurrency(element: Selection) {
  return element.first().text().trim().slice(0, 1) || '$';
}

export function extractDescription($: CheerioAPI) {
  const selectors = ['#feature-bullets .a-list-item', '#productDescription p', '.a-expander-content p'];

  for (const selector of selectors) {
    const lines = $(selector)
      .map((_, el) => $(el).text().replace(/\s+/g, ' ').trim())
      .get()
      .filter(Boolean);
    if (lines.length) return lines.join('\n');
  }
  return '';
}

export function extractImage($: CheerioAPI) {
  const dynamic =
    $('#landingImage').attr('data-a-dynamic-image') ||
    $('#imgBlkFront').attr('data-a-dynamic-image');

  if (dynamic) {
    try {
      const urls = Object.keys(JSON.parse(dynamic));
      if (urls.length) return urls[urls.length - 1];
    } catch {
      // fall through to static attributes
    }
  }
  return $('#landingImage').attr('data-old-hires') || $('#landingImage').attr('src') || '';
}

export function extractRating($: CheerioAPI) {
  const stars = parseFloat($('#acrPopover').attr('title') ?? $('.a-icon-alt').first().text());
  const reviews = parsePrice($('#acrCustomerReviewText').first().text());
  return {
    stars: Number.isFinite(stars) ? stars : 0,
    reviewsCount: Math.round(reviews),
  };
}

export function extractCategory($: CheerioAPI) {
  const crumbs = $('#wayfinding-breadcrumbs_feature_div ul li a')
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean);
  return crumbs[crumbs.length - 1] || 'General';
}
