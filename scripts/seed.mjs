// Seed a local database with demo products and synthetic price history.
// Usage: MONGODB_URI=mongodb://localhost:27017/scrapemaster npm run seed
import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI is required');
  process.exit(1);
}

const products = [
  ['B0CHX1W1XY', 'Apple iPhone 15 (128 GB) - Black', 'Smartphones', 'https://m.media-amazon.com/images/I/71657TiFeHL._SL1500_.jpg', 799, 699],
  ['B0BSHF7WHW', 'Apple 2023 MacBook Pro Laptop M2 Pro chip with 12‑core CPU', 'Laptops', 'https://m.media-amazon.com/images/I/61lsexTCOhL._AC_SL1500_.jpg', 1999, 1749],
  ['B09XS7JWHH', 'Sony WH-1000XM5 Wireless Industry Leading Noise Canceling Headphones', 'Headphones', 'https://m.media-amazon.com/images/I/61vJtKbAssL._AC_SL1500_.jpg', 399, 248],
  ['B0BDHWDR12', 'Apple AirPods Pro (2nd Generation) Wireless Ear Buds with USB-C', 'Headphones', 'https://m.media-amazon.com/images/I/61SUj2aKoEL._AC_SL1500_.jpg', 249, 189],
  ['B08N5WRWNW', 'Echo Dot (4th Gen) Smart speaker with Alexa - Charcoal', 'Smart Home', 'https://m.media-amazon.com/images/I/714Rq4k05UL._AC_SL1000_.jpg', 49, 27],
  ['B0CX23V2ZK', 'Kindle Paperwhite (16 GB) – Our fastest Kindle ever', 'E-readers', 'https://m.media-amazon.com/images/I/71gNmsZE6lL._AC_SL1500_.jpg', 159, 139],
  ['B07FZ8S74R', 'Instant Pot Duo 7-in-1 Electric Pressure Cooker, 6 Quart', 'Kitchen', 'https://m.media-amazon.com/images/I/71V1LrY1MSL._AC_SL1500_.jpg', 99, 79],
  ['B0B3PSRHHN', 'Logitech MX Master 3S Wireless Performance Mouse', 'Accessories', 'https://m.media-amazon.com/images/I/61ni3t1ryQL._AC_SL1500_.jpg', 99, 89],
];

function history(original, current, days = 30) {
  const points = [];
  let price = original * 0.95;
  for (let i = days; i >= 0; i--) {
    const drift = (current - price) / Math.max(i, 1);
    price = Math.max(current * 0.9, price + drift + (Math.random() - 0.5) * original * 0.04);
    points.push({ price: Math.round(i === 0 ? current : price), date: new Date(Date.now() - i * 86_400_000) });
  }
  return points;
}

await mongoose.connect(uri);
const collection = mongoose.connection.collection('products');

for (const [asin, title, category, image, original, current] of products) {
  const priceHistory = history(original, current);
  const prices = priceHistory.map((p) => p.price);
  await collection.updateOne(
    { url: `https://www.amazon.com/dp/${asin}` },
    {
      $set: {
        title,
        category,
        image,
        currency: '$',
        currentPrice: current,
        originalPrice: original,
        discountRate: Math.round(((original - current) / original) * 100),
        priceHistory,
        lowestPrice: Math.min(...prices),
        highestPrice: Math.max(...prices),
        averagePrice: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
        description: `${title}\nFree returns within 30 days\nShips from and sold by Amazon`,
        stars: 4 + Math.round(Math.random() * 9) / 10,
        reviewsCount: Math.round(Math.random() * 40_000),
        isOutOfStock: false,
        updatedAt: new Date(),
      },
      $setOnInsert: { users: [], createdAt: new Date() },
    },
    { upsert: true },
  );
}

console.log(`Seeded ${products.length} products`);
await mongoose.disconnect();
