import 'server-only';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import axios, { type AxiosRequestConfig } from 'axios';
import { USER_AGENT } from './agent';
import { kindForStatus, ScrapeError } from './errors';
import { throttle } from './throttle';

export { ScrapeError };

const PRIVATE_V4 = [
  /^0\./,
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
];

export function isPrivateAddress(address: string) {
  if (isIP(address) === 6) {
    const a = address.toLowerCase();
    if (a.startsWith('::ffff:')) return isPrivateAddress(a.slice(7));
    return (
      a === '::1' ||
      a === '::' ||
      a.startsWith('fc') ||
      a.startsWith('fd') ||
      a.startsWith('fe80')
    );
  }
  return PRIVATE_V4.some((range) => range.test(address));
}

/**
 * Only allow public http(s) targets on standard ports so user-supplied URLs
 * can't be used to reach internal services (SSRF).
 */
export async function assertPublicURL(input: string | URL) {
  const url = new URL(input);
  if (url.protocol !== 'https:' && url.protocol !== 'http:')
    throw new ScrapeError('Only http(s) links are supported', 'disallowed');
  if (url.port && url.port !== '80' && url.port !== '443')
    throw new ScrapeError('Unsupported port', 'disallowed');
  if (url.username || url.password)
    throw new ScrapeError('Links with credentials are not supported', 'disallowed');

  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal')) {
    throw new ScrapeError('That address is not allowed', 'disallowed');
  }

  const addresses = isIP(host)
    ? [{ address: host }]
    : await lookup(host, { all: true }).catch(() => []);
  if (!addresses.length)
    throw new ScrapeError('Could not resolve that website', 'not-found');
  if (addresses.some(({ address }) => isPrivateAddress(address)))
    throw new ScrapeError('That address is not allowed', 'disallowed');
  return url;
}

const REQUEST_CONFIG: AxiosRequestConfig = {
  timeout: 20_000,
  maxRedirects: 3,
  maxContentLength: 8 * 1024 * 1024,
  responseType: 'text',
  headers: {
    'User-Agent': USER_AGENT,
    'Accept-Language': 'en-US,en;q=0.9',
    Accept: 'text/html,application/xhtml+xml',
  },
  beforeRedirect: (options) => {
    const host = String(options.hostname ?? '');
    if (host === 'localhost' || (isIP(host) && isPrivateAddress(host))) {
      throw new ScrapeError('Redirect to a private address was blocked', 'disallowed');
    }
  },
};

export async function fetchHtml(url: string) {
  await assertPublicURL(url);
  await throttle(url);
  try {
    const response = await axios.get<string>(url, REQUEST_CONFIG);
    return response.data;
  } catch (error) {
    if (error instanceof ScrapeError) throw error;
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    const timedOut = axios.isAxiosError(error) && error.code === 'ECONNABORTED';
    throw new ScrapeError(
      status === 403 || status === 503
        ? 'The store blocked the request. Try again shortly.'
        : timedOut
          ? 'The store took too long to respond.'
          : `Could not load the page${status ? ` (HTTP ${status})` : ''}`,
      timedOut ? 'timeout' : status === 503 ? 'blocked' : kindForStatus(status),
    );
  }
}
