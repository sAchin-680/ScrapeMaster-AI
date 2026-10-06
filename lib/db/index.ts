import 'server-only';
import { attachDatabasePool } from '@vercel/functions';
import mongoose from 'mongoose';
import { env } from '@/lib/env';

type Cache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  failedAt?: number;
  error?: unknown;
};

// After a failed connection, fail fast for a while instead of making every
// query wait on the same unreachable database.
const RETRY_AFTER_MS = 30_000;

// Reuse the connection across hot reloads and serverless invocations.
const globalForMongoose = globalThis as unknown as { mongooseCache?: Cache };
const cache: Cache = (globalForMongoose.mongooseCache ??= { conn: null, promise: null });

export async function connectDB() {
  if (!env.MONGODB_URI) throw new Error('MONGODB_URI is not defined');
  // readyState 1 = connected. A closed connection (0) is discarded and re-opened.
  if (cache.conn && mongoose.connection.readyState === 1) return cache.conn;
  if (cache.failedAt && Date.now() - cache.failedAt < RETRY_AFTER_MS) throw cache.error;
  if (mongoose.connection.readyState === 0) {
    cache.conn = null;
    cache.promise = null;
  }

  mongoose.set('strictQuery', true);
  cache.promise ??= mongoose.connect(env.MONGODB_URI, {
    bufferCommands: false,
    maxPoolSize: 10,
    // Release idle sockets instead of holding them while an instance sleeps.
    maxIdleTimeMS: 60_000,
    appName: 'scrapemaster',
    serverSelectionTimeoutMS: 10_000,
  });

  try {
    cache.conn = await cache.promise;
    cache.failedAt = undefined;
    // On Vercel, let the platform keep this pool alive across invocations of
    // the same function instance instead of reconnecting each time.
    if (process.env.VERCEL) attachDatabasePool(cache.conn.connection.getClient());
  } catch (error) {
    cache.promise = null;
    cache.failedAt = Date.now();
    cache.error = error;
    throw error;
  }

  return cache.conn;
}
