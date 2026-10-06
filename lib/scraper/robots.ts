import axios from 'axios';
import { BOT_TOKEN, USER_AGENT } from './agent';
import { ScrapeError } from './errors';

/**
 * robots.txt support following RFC 9309: the groups naming our crawler are
 * used if there are any, otherwise every `*` group (merged). The longest
 * matching rule decides, and `allow` wins a tie.
 */

type Rule = { allow: boolean; pattern: string };

export function parseRobots(text: string, token = BOT_TOKEN): Rule[] {
  const groups: { agents: string[]; rules: Rule[] }[] = [];
  let current: (typeof groups)[number] | undefined;
  let lastWasAgent = false;

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, '').trim();
    const match = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!match) continue;
    const key = match[1].toLowerCase();
    const value = match[2].trim();

    if (key === 'user-agent') {
      // Consecutive user-agent lines share one group.
      if (!lastWasAgent || !current) groups.push((current = { agents: [], rules: [] }));
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
    } else if ((key === 'allow' || key === 'disallow') && current) {
      // An empty disallow means "allow everything" and adds no rule.
      if (value) current.rules.push({ allow: key === 'allow', pattern: value });
      lastWasAgent = false;
    } else {
      lastWasAgent = false;
    }
  }

  const ours = groups.filter((g) => g.agents.includes(token.toLowerCase()));
  const chosen = ours.length ? ours : groups.filter((g) => g.agents.includes('*'));
  return chosen.flatMap((g) => g.rules);
}

function toRegExp(pattern: string) {
  const anchored = pattern.endsWith('$');
  const body = (anchored ? pattern.slice(0, -1) : pattern)
    .split('*')
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
    .join('.*');
  return new RegExp(`^${body}${anchored ? '$' : ''}`);
}

/** Whether `path` (pathname plus query) may be fetched under these rules. */
export function isAllowed(rules: Rule[], path: string) {
  if (path === '/robots.txt') return true;
  let best: Rule | undefined;
  for (const rule of rules) {
    if (!toRegExp(rule.pattern).test(path)) continue;
    const longer = !best || rule.pattern.length > best.pattern.length;
    const tieAllow = best && rule.pattern.length === best.pattern.length && rule.allow;
    if (longer || tieAllow) best = rule;
  }
  return best?.allow ?? true;
}

const ALLOW_ALL: Rule[] = [];
const DISALLOW_ALL: Rule[] = [{ allow: false, pattern: '/' }];
const CACHE_MS = 24 * 60 * 60_000;
// An unreachable robots.txt is retried sooner than a successful one is refreshed.
const RETRY_MS = 15 * 60_000;
const cache = new Map<string, { rules: Promise<Rule[]>; expires: number }>();

async function fetchRules(origin: string): Promise<{ rules: Rule[]; ttl: number }> {
  try {
    const response = await axios.get<string>(`${origin}/robots.txt`, {
      timeout: 10_000,
      maxRedirects: 5,
      maxContentLength: 512 * 1024,
      responseType: 'text',
      headers: { 'User-Agent': USER_AGENT },
      validateStatus: () => true,
    });
    const { status } = response;
    if (status >= 200 && status < 300)
      return { rules: parseRobots(String(response.data)), ttl: CACHE_MS };
    // No robots.txt (4xx): everything is allowed.
    if (status >= 400 && status < 500) return { rules: ALLOW_ALL, ttl: CACHE_MS };
    // Server error: treat the site as fully disallowed for now (RFC 9309 §2.3.1.4).
    return { rules: DISALLOW_ALL, ttl: RETRY_MS };
  } catch {
    return { rules: DISALLOW_ALL, ttl: RETRY_MS };
  }
}

function rulesFor(origin: string) {
  const cached = cache.get(origin);
  if (cached && cached.expires > Date.now()) return cached.rules;
  const entry = { rules: Promise.resolve(ALLOW_ALL), expires: Date.now() + RETRY_MS };
  entry.rules = fetchRules(origin).then(({ rules, ttl }) => {
    entry.expires = Date.now() + ttl;
    return rules;
  });
  cache.set(origin, entry);
  return entry.rules;
}

/** Throw a permanent error if the site's robots.txt does not allow this URL. */
export async function assertRobotsAllowed(input: string | URL) {
  const url = new URL(input);
  const rules = await rulesFor(url.origin);
  if (!isAllowed(rules, url.pathname + url.search)) {
    throw new ScrapeError(
      `${url.hostname} asks crawlers not to visit this page`,
      'disallowed',
    );
  }
}

/** For tests. */
export function clearRobotsCache() {
  cache.clear();
}
