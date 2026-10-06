import { beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
vi.mock('axios', () => ({ default: { get } }));

const { assertRobotsAllowed, clearRobotsCache, isAllowed, parseRobots } =
  await import('@/lib/scraper/robots');

// Shaped like a real store file: several `*` groups that must be merged.
const STORE = `
User-agent: Mediapartners-Google
Disallow:

# cart
User-agent: *
Disallow: /viewcart

User-agent: Storebot-Google
Allow: /viewcart

User-agent: *
Disallow: /*?sort=
Disallow: */reviews/*
Disallow: /search?
Allow: /search?q=allowed
Disallow: /*.pdf$
`;

describe('parseRobots / isAllowed', () => {
  const rules = parseRobots(STORE);

  it('merges every * group', () => {
    expect(isAllowed(rules, '/viewcart')).toBe(false);
    expect(isAllowed(rules, '/search?q=phone')).toBe(false);
  });

  it('allows paths no rule matches', () => {
    expect(isAllowed(rules, '/')).toBe(true);
    expect(isAllowed(rules, '/apple-iphone/p/itm123?pid=X')).toBe(true);
    expect(isAllowed(rules, '/search')).toBe(true);
  });

  it('supports * wildcards and the $ end anchor', () => {
    expect(isAllowed(rules, '/phones?sort=price')).toBe(false);
    expect(isAllowed(rules, '/x/reviews/1')).toBe(false);
    expect(isAllowed(rules, '/guide.pdf')).toBe(false);
    expect(isAllowed(rules, '/guide.pdf?x=1')).toBe(true);
  });

  it('lets the longest match win', () => {
    expect(isAllowed(rules, '/search?q=allowed-thing')).toBe(true);
  });

  it('lets allow win a tie', () => {
    const tie = parseRobots('User-agent: *\nDisallow: /a\nAllow: /a');
    expect(isAllowed(tie, '/a')).toBe(true);
  });

  it('uses only the group naming our crawler when there is one', () => {
    const ours = parseRobots(
      'User-agent: *\nDisallow: /\n\nUser-agent: ScrapeMasterBot\nDisallow: /private',
    );
    expect(isAllowed(ours, '/products')).toBe(true);
    expect(isAllowed(ours, '/private/1')).toBe(false);
  });

  it('treats an empty disallow as allow-all', () => {
    expect(isAllowed(parseRobots('User-agent: *\nDisallow:'), '/anything')).toBe(true);
  });
});

describe('assertRobotsAllowed', () => {
  beforeEach(() => {
    clearRobotsCache();
    get.mockReset();
  });

  it('blocks disallowed pages with a permanent error and caches the file', async () => {
    get.mockResolvedValue({ status: 200, data: STORE });
    await expect(
      assertRobotsAllowed('https://shop.test/search?q=x'),
    ).rejects.toMatchObject({
      kind: 'disallowed',
    });
    await expect(assertRobotsAllowed('https://shop.test/p/1')).resolves.toBeUndefined();
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('allows everything when there is no robots.txt', async () => {
    get.mockResolvedValue({ status: 404, data: '' });
    await expect(
      assertRobotsAllowed('https://shop.test/search?q=x'),
    ).resolves.toBeUndefined();
  });

  it('stays away while robots.txt is unreachable', async () => {
    get.mockRejectedValue(new Error('ECONNRESET'));
    await expect(assertRobotsAllowed('https://shop.test/')).rejects.toMatchObject({
      kind: 'disallowed',
    });
  });
});
