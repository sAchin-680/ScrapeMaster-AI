import 'server-only';
import type { Browser } from 'puppeteer-core';
import { env } from '@/lib/env';
import { kindForStatus, ScrapeError } from './errors';
import { assertRobotsAllowed } from './robots';
import { throttle } from './throttle';
import { USER_AGENT } from './agent';

const MAX_PAGES = 3;
const NAV_TIMEOUT_MS = 30_000;
const SETTLE_MS = 1_500;
const PIXEL = Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64');

// Inside the Next.js server (NEXT_RUNTIME is set) a browser would sit on a
// visitor's request path, so it is off unless explicitly enabled. Scheduled
// jobs and scripts run outside Next.js and keep using it.
const onRequestPath = Boolean(process.env.NEXT_RUNTIME);
const allowOnRequestPath = process.env.BROWSER_ON_REQUEST === 'true';

export const isBrowserConfigured =
  Boolean(env.BROWSER_WS_ENDPOINT || env.CHROME_EXECUTABLE_PATH) &&
  (!onRequestPath || allowOnRequestPath);

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
export async function renderHtml(
  url: string,
  { settleMs = SETTLE_MS, scroll = false }: { settleMs?: number; scroll?: boolean } = {},
) {
  if (!isBrowserConfigured) {
    throw new ScrapeError(
      'This store needs browser rendering. Set CHROME_EXECUTABLE_PATH or BROWSER_WS_ENDPOINT.',
      'unsupported',
    );
  }

  await assertRobotsAllowed(url);
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
      throw new ScrapeError(
        `Could not load the page (HTTP ${response.status()})`,
        kindForStatus(response.status()),
      );
    }
    if (scroll) {
      // Trigger lazily rendered banners and carousels further down the page.
      await page
        .evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2))
        .catch(() => {});
    }
    await new Promise((resolve) => setTimeout(resolve, settleMs));
    return await page.content();
  } catch (error) {
    if (error instanceof ScrapeError) throw error;
    throw new ScrapeError(
      'The page took too long to load. Try again shortly.',
      'timeout',
    );
  } finally {
    await page.close().catch(() => {});
    release();
  }
}
