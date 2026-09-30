import 'server-only';
import { z } from 'zod';

const schema = z.object({
  MONGODB_URI: z.string().url().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
  BRIGHTDATA_USERNAME: z.string().optional(),
  BRIGHTDATA_PASSWORD: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(465),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  // Browser rendering for stores that block plain HTTP clients (e.g. Flipkart).
  CHROME_EXECUTABLE_PATH: z.string().optional(),
  BROWSER_WS_ENDPOINT: z.string().url().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment configuration');
}

export const env = parsed.data;

export const isEmailConfigured = Boolean(
  env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD,
);
export const isProxyConfigured = Boolean(
  env.BRIGHTDATA_USERNAME && env.BRIGHTDATA_PASSWORD,
);
