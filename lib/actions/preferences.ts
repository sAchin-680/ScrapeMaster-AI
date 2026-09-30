'use server';

import { cookies } from 'next/headers';
import { z } from 'zod';
import { COUNTRIES, CURRENCIES, PREFERENCES_COOKIE } from '@/lib/locale';

const schema = z.object({
  country: z.enum(COUNTRIES.map((c) => c.code) as [string, ...string[]]),
  currency: z.enum(['original', ...Object.keys(CURRENCIES)] as [string, ...string[]]),
});

export async function savePreferences(input: { country: string; currency: string }) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: 'Invalid preferences' };

  (await cookies()).set(PREFERENCES_COOKIE, JSON.stringify(parsed.data), {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  return { ok: true as const };
}
