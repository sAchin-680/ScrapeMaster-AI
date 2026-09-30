// Seed a local database with demo products and synthetic price history.
//
//   npm run seed            upsert demo products
//   npm run seed -- --reset delete all products first
//
// Demo products link to a store search for their exact title rather than a
// product id, so every "View on store" link shows the right item. Track real
// products by pasting their links in the app.
import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI is required');
  process.exit(1);
}

const IMG = 'https://m.media-amazon.com/images/I';

// [title, category, image, mrp, current price, Flipkart price or null]
const products = [
  ['Apple iPhone 15 (128 GB) - Black', 'Smartphones', `${IMG}/71657TiFeHL._SL1500_.jpg`, 79900, 65999, 64999],
  ['Sony WH-1000XM5 Wireless Noise Cancelling Headphones', 'Headphones', `${IMG}/61vJtKbAssL._AC_SL1500_.jpg`, 34990, 26990, 27490],
  ['Apple AirPods Pro (2nd Generation) with MagSafe Case (USB-C)', 'Headphones', `${IMG}/61SUj2aKoEL._AC_SL1500_.jpg`, 24900, 18990, 19900],
  ['Logitech MX Master 3S Wireless Performance Mouse', 'Computer Accessories', `${IMG}/61ni3t1ryQL._AC_SL1500_.jpg`, 10995, 8995, 9299],
  ['Apple 2023 MacBook Pro (14-inch, M2 Pro, 16GB RAM, 512GB SSD)', 'Laptops', `${IMG}/61lsexTCOhL._AC_SL1500_.jpg`, 199900, 169990, 172990],
  ['Kindle Paperwhite (16 GB) – 7" display, adjustable warm light', 'E-readers', `${IMG}/61Ww4abGclL._AC_SL1000_.jpg`, 16999, 13999, null],
  ['Echo Dot (4th Gen) Smart speaker with Alexa - Charcoal', 'Smart Home', `${IMG}/714Rq4k05UL._AC_SL1000_.jpg`, 4499, 2449, null],
  ['Instant Pot Duo 7-in-1 Electric Pressure Cooker, 5.7 L', 'Kitchen Appliances', `${IMG}/71V1LrY1MSL._AC_SL1500_.jpg`, 12999, 8499, 8999],
];

const amazonSearch = (title) => `https://www.amazon.in/s?k=${encodeURIComponent(title)}`;
const flipkartSearch = (title) => `https://www.flipkart.com/search?q=${encodeURIComponent(title)}`;

/** Random walk from around the MRP down to today's price. */
function history(mrp, current, days = 45) {
  const points = [];
  let price = mrp * 0.92;
  for (let i = days; i >= 0; i--) {
    const drift = (current - price) / Math.max(i, 1);
    price = Math.max(current * 0.97, price + drift + (Math.random() - 0.5) * mrp * 0.03);
    points.push({ price: i === 0 ? current : Math.round(price), date: new Date(Date.now() - i * 86_400_000) });
  }
  return points;
}

await mongoose.connect(uri);
const collection = mongoose.connection.collection('products');

if (process.argv.includes('--reset')) {
  const { deletedCount } = await collection.deleteMany({});
  console.log(`Removed ${deletedCount} products`);
}

for (const [i, [title, category, image, mrp, current, flipkartPrice]] of products.entries()) {
  const priceHistory = history(mrp, current);
  const prices = priceHistory.map((p) => p.price);
  const url = amazonSearch(title);

  const offers = [{ store: 'amazon', storeName: 'Amazon', title, url, price: current, currency: '₹', image }];
  if (flipkartPrice) {
    offers.push({ store: 'flipkart', storeName: 'Flipkart', title, url: flipkartSearch(title), price: flipkartPrice, currency: '₹', image });
  }
  offers.sort((a, b) => a.price - b.price);

  // Stagger creation times so the grid has a stable, meaningful order.
  const createdAt = new Date(Date.now() - (products.length - i) * 3_600_000);

  await collection.updateOne(
    { url },
    {
      $set: {
        title,
        category,
        image,
        store: 'amazon',
        storeName: 'Amazon',
        currency: '₹',
        currentPrice: current,
        originalPrice: mrp,
        discountRate: Math.round(((mrp - current) / mrp) * 100),
        priceHistory,
        lowestPrice: Math.min(...prices),
        highestPrice: Math.max(...prices),
        averagePrice: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
        description: `${title}\nDemo listing with synthetic price history`,
        stars: 4.2 + Math.round(Math.random() * 6) / 10,
        reviewsCount: 500 + Math.round(Math.random() * 30_000),
        isOutOfStock: false,
        offers,
        offersCheckedAt: new Date(),
        updatedAt: new Date(),
      },
      $setOnInsert: { users: [], createdAt },
    },
    { upsert: true },
  );
}

console.log(`Seeded ${products.length} products`);
await mongoose.disconnect();
