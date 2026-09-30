import * as cheerio from 'cheerio';

export type SaleSignal = {
  store: string;
  storeName: string;
  text: string;
  status: 'live' | 'upcoming';
  url: string;
  /** When the store homepage was checked (ISO). */
  detectedAt?: string;
};

// Known marketplace events, plus generic sale wording on banners.
const EVENT =
  /(big billion days|great indian festival|prime day|prime big deal days|big saving days|big bachat days|republic day sale|independence day sale|diwali sale|festive sale|big fashion festival|end of reason sale|black friday|cyber monday|mega sale|early (?:bird|deals?)[\w ]*|sale price live|[\w ]{0,20}\bdeals? (?:are )?live(?: now)?|\b[\w ]{0,24}\bsale\b)/i;
const UPCOMING =
  /(upcoming|coming soon|starts|launching|get ready|save the date|early access)/i;
const LIVE = /(\blive\b|\bnow\b|\bshop\b|ends|last day|today)/i;

/**
 * Read sale announcements from a store homepage: banner alt text, labels
 * and titles. Returns de-duplicated, human-readable signals.
 */
export function parseSaleSignals(
  html: string,
  store: { id: string; name: string; url: string },
): SaleSignal[] {
  const $ = cheerio.load(html);
  const seen = new Set<string>();
  const signals: SaleSignal[] = [];

  $('img[alt], [aria-label], a[title], h1, h2').each((_, el) => {
    const node = $(el);
    const text = (
      node.attr('alt') ||
      node.attr('aria-label') ||
      node.attr('title') ||
      node.text()
    )
      .replace(/\s+/g, ' ')
      .trim();
    if (!text || text.length > 80 || !EVENT.test(text)) return;
    // Skip payment promos and evergreen slogans that aren't a specific event.
    if (
      /cashback|coupon|wholesale|bank|emi|exchange|\bevents\b|popular|exclusive offers/i.test(
        text,
      )
    )
      return;

    const key = text.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);

    signals.push({
      store: store.id,
      storeName: store.name,
      text,
      status:
        UPCOMING.test(text) && !/\blive\b/i.test(text)
          ? 'upcoming'
          : LIVE.test(text) || /sale|festival|days/i.test(text)
            ? 'live'
            : 'upcoming',
      url: store.url,
    });
  });

  return signals.slice(0, 4);
}
