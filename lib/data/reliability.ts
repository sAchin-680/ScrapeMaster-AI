import 'server-only';
import { logDataError } from '@/lib/db';
import { summarizeReliability } from '@/lib/scraper/reliability';
import { readSourceHealth } from '@/lib/services/source-health';

/** Per-store success rates and last good refresh, from the refresh job's records. */
export async function getStoreReliability() {
  try {
    return summarizeReliability(await readSourceHealth());
  } catch (error) {
    logDataError('getStoreReliability', error);
    return [];
  }
}
