import type { Announcement } from '@/components/AnnouncementBar';
import type { PriceDrop, StoreWave } from '@/lib/data/signals';
import type { Sale, SaleStatus } from '@/lib/sales';
import { truncate } from '@/lib/utils/format';

/** Build announcement bar items from live sales and real price movements. */
export function buildAnnouncements(
  sales: (Sale & { status: SaleStatus })[],
  signals: { drops: PriceDrop[]; waves: StoreWave[] },
): Announcement[] {
  const items: Announcement[] = [];

  for (const sale of sales.slice(0, 2)) {
    items.push({
      id: `sale-${sale.id}`,
      text:
        sale.status === 'live'
          ? `🔥 ${sale.name} is live on ${sale.store}. Check the price history before you buy.`
          : `📅 ${sale.name} on ${sale.store} is coming up. Track products now to spot fake discounts.`,
      href: '/#sales',
      cta: sale.status === 'live' ? 'See sales' : 'View calendar',
    });
  }

  for (const wave of signals.waves) {
    items.push({
      id: `wave-${wave.storeName}`,
      text: `📉 Prices are falling on ${wave.storeName}: ${wave.dropped} of ${wave.tracked} tracked products dropped in the last 48 hours.`,
      href: '/#deals',
      cta: 'See deals',
    });
  }

  for (const drop of signals.drops.slice(0, 3)) {
    items.push({
      id: `drop-${drop.id}-${drop.to}`,
      text: `⬇️ ${truncate(drop.title, 48)} dropped ${drop.percent}% on ${drop.storeName}.`,
      href: `/products/${drop.id}`,
      cta: 'View',
    });
  }

  return items;
}
