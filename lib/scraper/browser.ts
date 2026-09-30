import 'server-only';
import type { Browser } from 'puppeteer-core';
import { env } from '@/lib/env';
import { ScrapeError } from './errors';
import { throttle } from './throttle';

const MAX_PAGES = 3;
const NAV_TIMEOUT_MS = 30_000;
const SETTLE_MS = 1_500;
const PIXEL = Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64');

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36';

export const isBrowserConfigured = Boolean(
  env.BROWSER_WS_ENDPOINT || env.CHROME_EXECUTABLE_PATH,
);

const globalForBrowser = globalThis as unknown as { browser?: Promise<Browser> };
let openPages = 0;
const queue: (() => void)[] = [];

async function getBrowser() {
  const existing =
    globalForBrowser.browser && (await globalForBrowser.browser.catch(() => null));
  if (existing?.connected) return existing;

  const { default: puppeteer } = await import('puppeteer-core');
  globalForBrowser.browser = env.BROWSER_WS_ENDPOINT
    ? puppeteer.connect({ browserWSEndpoint: env.BROWSER_WS_ENDPOINT })
    : puppeteer.launch({
        executablePath: env.CHROME_EXECUTABLE_PATH,
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--lang=en-IN',
        ],
      });
  return globalForBrowser.browser;
}

async function acquire() {
  if (openPages >= MAX_PAGES) await new Promise<void>((resolve) => queue.push(resolve));
  openPages++;
}

function release() {
  openPages--;
  queue.shift()?.();
}

/** Render a page in a real browser engine for stores that block plain HTTP clients. */
export async function renderHtml(url: string) {
  if (!isBrowserConfigured) {
    throw new ScrapeError(
      'This store needs browser rendering. Set CHROME_EXECUTABLE_PATH or BROWSER_WS_ENDPOINT.',
    );
  }

  await throttle(url);
  await acquire();
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setUserAgent(USER_AGENT);
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-IN,en;q=0.9' });
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const type = request.resourceType();
      // Answer images with a 1x1 pixel instead of aborting: lazy loaders then
      // swap placeholders for real image URLs without downloading them.
      if (type === 'image')
        request.respond({ status: 200, contentType: 'image/gif', body: PIXEL });
      else if (type === 'font' || type === 'media') request.abort();
      else request.continue();
    });

    const response = await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: NAV_TIMEOUT_MS,
    });
    if (response && response.status() >= 400) {
      throw new ScrapeError(`Could not load the page (HTTP ${response.status()})`);
    }
    await new Promise((resolve) => setTimeout(resolve, SETTLE_MS));
    return await page.content();
  } catch (error) {
    if (error instanceof ScrapeError) throw error;
    throw new ScrapeError('The page took too long to load. Try again shortly.');
  } finally {
    await page.close().catch(() => {});
    release();
  }
}
