export type PriceHistoryItem = {
  price: number;
  date?: Date | string;
};

export type User = {
  email: string;
};

export type Product = {
  _id: string;
  url: string;
  currency: string;
  image: string;
  title: string;
  currentPrice: number;
  originalPrice: number;
  priceHistory: PriceHistoryItem[];
  highestPrice: number;
  lowestPrice: number;
  averagePrice: number;
  discountRate: number;
  description: string;
  category: string;
  reviewsCount: number;
  stars: number;
  isOutOfStock: boolean;
  users?: User[];
  createdAt?: string;
  updatedAt?: string;
};

export type ScrapedProduct = Omit<
  Product,
  '_id' | 'priceHistory' | 'highestPrice' | 'lowestPrice' | 'averagePrice' | 'users'
>;

export type NotificationType = 'WELCOME' | 'CHANGE_OF_STOCK' | 'LOWEST_PRICE' | 'THRESHOLD_MET';

export type EmailContent = {
  subject: string;
  body: string;
};

export type EmailProductInfo = {
  title: string;
  url: string;
  image?: string;
  currency?: string;
  currentPrice?: number;
};

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type LiveProductUpdate = {
  id: string;
  currentPrice: number;
  currency: string;
  isOutOfStock: boolean;
  watchers: number;
  updatedAt: string;
};
