import { siteConfig } from '@/lib/site';

/** Product token stores can address in robots.txt. */
export const BOT_TOKEN = 'ScrapeMasterBot';

/**
 * A normal browser string, so stores serve their regular pages, followed by
 * our own token and a link explaining what we fetch and how to opt out.
 */
export const USER_AGENT = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36 ${BOT_TOKEN}/1.0 (+${siteConfig.url}/bot)`;
