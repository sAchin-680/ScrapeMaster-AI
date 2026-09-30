import type { PriceHistoryItem } from '@/types';

export function getHighestPrice(history: PriceHistoryItem[]) {
  return history.length ? Math.max(...history.map((item) => item.price)) : 0;
}

export function getLowestPrice(history: PriceHistoryItem[]) {
  return history.length ? Math.min(...history.map((item) => item.price)) : 0;
}

export function getAveragePrice(history: PriceHistoryItem[]) {
  if (!history.length) return 0;
  const sum = history.reduce((acc, item) => acc + item.price, 0);
  return Math.round((sum / history.length) * 100) / 100;
}

export function getPriceStats(history: PriceHistoryItem[]) {
  return {
    lowestPrice: getLowestPrice(history),
    highestPrice: getHighestPrice(history),
    averagePrice: getAveragePrice(history),
  };
}

/** Percentage change between two prices, negative when the price dropped. */
export function getPriceChange(previous: number, current: number) {
  if (!previous) return 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

/** Limit stored history so documents never grow unbounded. */
export const MAX_HISTORY_ENTRIES = 365;

export function appendPrice(history: PriceHistoryItem[], price: number) {
  return [...history, { price, date: new Date() }].slice(-MAX_HISTORY_ENTRIES);
}
