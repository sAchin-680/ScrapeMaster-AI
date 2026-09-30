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
