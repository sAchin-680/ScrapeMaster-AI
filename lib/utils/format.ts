export function formatNumber(value = 0) {
  return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export function formatPrice(value: number | undefined, currency = '$') {
  return `${currency}${formatNumber(value ?? 0)}`;
}

export function formatRelativeTime(date: Date | string | undefined, now = Date.now()) {
  if (!date) return '';
  const seconds = Math.round((now - new Date(date).getTime()) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
  ];
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return rtf.format(-Math.round(seconds / size), unit);
  }
  return 'just now';
}

export function truncate(text: string, length: number) {
  return text.length > length ? `${text.slice(0, length).trimEnd()}…` : text;
}

/**
 * Ask the retailer's image CDN for a smaller rendition. Amazon and Flipkart
 * encode the size in the URL; other hosts are returned unchanged.
 */
export function sizedImageUrl(url: string, px: number) {
  if (/media-amazon\.com|ssl-images-amazon\.com/.test(url)) {
    return url.replace(/\._[A-Z0-9_,]+_\.(jpg|jpeg|png|webp)$/i, `._AC_SL${px}_.$1`);
  }
  if (/rukmini\w*\.flixcart\.com\/image\/\d+\/\d+\//.test(url)) {
    return url.replace(/\/image\/\d+\/\d+\//, `/image/${px}/${px}/`);
  }
  return url;
}
