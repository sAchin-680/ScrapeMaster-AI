import type { PriceHistoryItem } from '@/types';

export type DealVerdict = {
  level: 'great' | 'good' | 'fair' | 'wait' | 'new';
  label: string;
  reason: string;
  /** 0–100, higher is a better time to buy. */
  score: number;
};

type Input = {
  currentPrice: number;
  lowestPrice: number;
  highestPrice: number;
  averagePrice: number;
  priceHistory: PriceHistoryItem[];
};

/** Judge the current price against the product's own history. */
export function getDealVerdict(p: Input): DealVerdict {
  if (p.priceHistory.length < 3 || p.highestPrice <= p.lowestPrice) {
    return {
      level: 'new',
      label: 'Collecting data',
      reason: 'Not enough price history yet to judge this price.',
      score: 50,
    };
  }

  const range = p.highestPrice - p.lowestPrice;
  const score = Math.round(
    Math.min(100, Math.max(0, ((p.highestPrice - p.currentPrice) / range) * 100)),
  );
  const vsAverage = Math.round(
    ((p.averagePrice - p.currentPrice) / p.averagePrice) * 100,
  );

  if (p.currentPrice <= p.lowestPrice * 1.02) {
    return {
      level: 'great',
      label: 'Great deal',
      reason: 'At or near the lowest price we have recorded.',
      score,
    };
  }
  if (vsAverage >= 3) {
    return {
      level: 'good',
      label: 'Good price',
      reason: `${vsAverage}% below its usual price.`,
      score,
    };
  }
  if (vsAverage > -3) {
    return {
      level: 'fair',
      label: 'Fair price',
      reason: 'Close to its typical price.',
      score,
    };
  }
  return {
    level: 'wait',
    label: 'Consider waiting',
    reason: `${Math.abs(vsAverage)}% above its usual price. Set an alert for a drop.`,
    score,
  };
}
