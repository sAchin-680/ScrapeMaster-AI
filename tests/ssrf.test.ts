import { describe, expect, it } from 'vitest';
import { assertPublicURL, isPrivateAddress } from '@/lib/scraper/http';

describe('SSRF protection', () => {
  it.each([
    '127.0.0.1',
    '10.1.2.3',
    '172.16.0.1',
    '192.168.1.1',
    '169.254.169.254',
    '::1',
    'fd00::1',
    '::ffff:10.0.0.1',
  ])('flags %s as private', (ip) => expect(isPrivateAddress(ip)).toBe(true));

  it('allows public addresses', () => {
    expect(isPrivateAddress('93.184.216.34')).toBe(false);
  });

  it.each([
    'http://localhost/admin',
    'http://127.0.0.1/',
    'http://169.254.169.254/latest/meta-data',
    'https://example.com:8080/',
    'file:///etc/passwd',
    'https://user:pass@example.com/',
  ])('rejects %s', async (url) => {
    await expect(assertPublicURL(url)).rejects.toThrow();
  });
});
