import 'server-only';
import { z } from 'zod';
import { siteConfig } from '@/lib/site';

/**
 * Every variable is optional so builds never fail on configuration; features
 * that need a missing value are disabled at runtime instead. Empty strings
 * count as unset (hosting dashboards often store blank values), and an
 * invalid value is ignored with a warning rather than crashing the app.
 */
const fields = {
  MONGODB_URI: z
    .string()
    .regex(/^mongodb(\+srv)?:\/\//, 'must start with mongodb:// or mongodb+srv://'),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  BRIGHTDATA_USERNAME: z.string(),
  BRIGHTDATA_PASSWORD: z.string(),
  SMTP_HOST: z.string(),
  SMTP_PORT: z.coerce.number().int().positive(),
  SMTP_USER: z.string(),
  SMTP_PASSWORD: z.string(),
  EMAIL_FROM: z.string(),
  CRON_SECRET: z.string(),
  // Signs unsubscribe links. Required in production.
  APP_SECRET: z.string().min(16, 'must be at least 16 characters'),
  // Bearer token for admin endpoints (sale calendar management).
  ADMIN_TOKEN: z.string().min(16, 'must be at least 16 characters'),
  // Browser rendering for stores that block plain HTTP clients (e.g. Flipkart).
  CHROME_EXECUTABLE_PATH: z.string(),
  BROWSER_WS_ENDPOINT: z.string().url(),
};

type Env = { [K in keyof typeof fields]?: z.infer<(typeof fields)[K]> };

function readEnv(source: Record<string, string | undefined>): Env {
  const env: Env = {};
  for (const [key, schema] of Object.entries(fields)) {
    const raw = source[key]?.trim();
    if (!raw) continue;
    const result = schema.safeParse(raw);
    if (result.success) {
      (env as Record<string, unknown>)[key] = result.data;
    } else {
      console.warn(
        `[env] Ignoring ${key}: ${result.error.issues[0]?.message ?? 'invalid value'}`,
      );
    }
  }
  return env;
}

const parsed = readEnv(process.env);

export const env = {
  ...parsed,
  NEXT_PUBLIC_SITE_URL: siteConfig.url,
  SMTP_PORT: parsed.SMTP_PORT ?? 465,
};

export const isEmailConfigured = Boolean(
  env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD,
);
export const isProxyConfigured = Boolean(
  env.BRIGHTDATA_USERNAME && env.BRIGHTDATA_PASSWORD,
);

export { readEnv };
