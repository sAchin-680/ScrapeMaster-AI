import 'server-only';
import { cookies, headers } from 'next/headers';
import { getCountry, parsePreferences, PREFERENCES_COOKIE, type Preferences } from '@/lib/locale';

/** Viewer preferences from the cookie, falling back to the geo/language hint. */
export async function getPreferences(): Promise<Preferences> {
  const stored = (await cookies()).get(PREFERENCES_COOKIE)?.value;
  if (stored) return parsePreferences(stored);

  const h = await headers();
  const geo = h.get('x-vercel-ip-country') ?? h.get('cf-ipcountry');
  const language = h.get('accept-language')?.match(/^[a-z]{2}-([A-Z]{2})/)?.[1];
  return { country: getCountry(geo ?? language).code, currency: 'original' };
}
