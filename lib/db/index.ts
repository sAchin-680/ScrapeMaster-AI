import 'server-only';
import mongoose from 'mongoose';
import { env } from '@/lib/env';

type Cache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };

// Reuse the connection across hot reloads and serverless invocations.
const globalForMongoose = globalThis as unknown as { mongooseCache?: Cache };
const cache: Cache = (globalForMongoose.mongooseCache ??= { conn: null, promise: null });

export async function connectDB() {
  if (!env.MONGODB_URI) throw new Error('MONGODB_URI is not defined');
  if (cache.conn) return cache.conn;

  mongoose.set('strictQuery', true);
  cache.promise ??= mongoose.connect(env.MONGODB_URI, {
    bufferCommands: false,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10_000,
  });

  try {
    cache.conn = await cache.promise;
  } catch (error) {
    cache.promise = null;
    throw error;
  }

  return cache.conn;
}
