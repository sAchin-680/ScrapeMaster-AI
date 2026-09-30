import 'server-only';
import { cookies } from 'next/headers';
import { DEFAULT_PREFERENCES, parsePreferences, PREFERENCES_COOKIE, type Preferences } from '@/lib/locale';

/** Viewer preferences from the cookie; India and INR by default. */
export async function getPreferences(): Promise<Preferences> {
  const stored = (await cookies()).get(PREFERENCES_COOKIE)?.value;
  return stored ? parsePreferences(stored) : DEFAULT_PREFERENCES;
}
