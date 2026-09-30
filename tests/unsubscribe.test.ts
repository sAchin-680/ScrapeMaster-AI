import { describe, expect, it } from 'vitest';
import { unsubscribeUrl, verifyUnsubscribe } from '@/lib/unsubscribe';

describe('unsubscribe links', () => {
  const id = '66f0c1a2b3c4d5e6f7a8b9c0';

  it('verifies its own signature', () => {
    const url = new URL(unsubscribeUrl(id, 'Buyer@Example.com'));
    const q = url.searchParams;
    expect(url.pathname).toBe('/unsubscribe');
    expect(verifyUnsubscribe(q.get('p')!, q.get('e')!, q.get('t')!)).toBe(true);
  });

  it('rejects tampered emails, products and tokens', () => {
    const t = new URL(unsubscribeUrl(id, 'buyer@example.com')).searchParams.get('t')!;
    expect(verifyUnsubscribe(id, 'someone@example.com', t)).toBe(false);
    expect(verifyUnsubscribe('66f0c1a2b3c4d5e6f7a8b9c1', 'buyer@example.com', t)).toBe(
      false,
    );
    expect(verifyUnsubscribe(id, 'buyer@example.com', `${t.slice(0, -1)}x`)).toBe(false);
  });
});
