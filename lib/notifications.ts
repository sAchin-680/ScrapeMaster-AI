import type { NotificationType, PriceHistoryItem } from '@/types';
import { getLowestPrice } from '@/lib/utils/price';

export const Notification = {
  WELCOME: 'WELCOME',
  CHANGE_OF_STOCK: 'CHANGE_OF_STOCK',
  LOWEST_PRICE: 'LOWEST_PRICE',
  THRESHOLD_MET: 'THRESHOLD_MET',
} as const satisfies Record<NotificationType, NotificationType>;

export const THRESHOLD_PERCENTAGE = 40;

type Snapshot = {
  currentPrice: number;
  discountRate: number;
  isOutOfStock: boolean;
};

/** Decide which alert (if any) a fresh scrape should trigger. */
export function getEmailNotifType(
  scraped: Snapshot,
  previous: { priceHistory: PriceHistoryItem[]; isOutOfStock: boolean; discountRate?: number },
): NotificationType | null {
  const lowestPrice = getLowestPrice(previous.priceHistory);

  if (lowestPrice && scraped.currentPrice > 0 && scraped.currentPrice < lowestPrice) {
    return Notification.LOWEST_PRICE;
  }
  if (!scraped.isOutOfStock && previous.isOutOfStock) {
    return Notification.CHANGE_OF_STOCK;
  }
  if (
    scraped.discountRate >= THRESHOLD_PERCENTAGE &&
    (previous.discountRate ?? 0) < THRESHOLD_PERCENTAGE
  ) {
    return Notification.THRESHOLD_MET;
  }
  return null;
}
