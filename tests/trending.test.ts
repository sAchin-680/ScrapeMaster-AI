import { describe, expect, it } from 'vitest';
import { parseAmazonBestsellers } from '@/lib/scraper/stores/amazon';
import { parseSaleSignals } from '@/lib/scraper/sale-signals';

describe('parseAmazonBestsellers', () => {
  it('reads rank, title, price and product link', () => {
    const html = `
      <div id="gridItemRoot"><span class="zg-bdg-text">#1</span>
        <a href="/Portronics-Earphones/dp/B0DDHM6D3L/ref=zg_bs_g_1"><img alt="Portronics Conch Theta C Earphones" src="https://images-eu.ssl-images-amazon.com/a.jpg" /></a>
        <span><span class="_cDEzb_p13n-sc-price_3mJ9Z">₹311.00</span></span>
      </div>
      <div id="gridItemRoot"><span class="zg-bdg-text">#2</span><img alt="No link item" /></div>`;
    expect(
      parseAmazonBestsellers(html, 'https://www.amazon.in/gp/bestsellers/electronics/'),
    ).toEqual([
      expect.objectContaining({
        rank: 1,
        price: 311,
        url: 'https://www.amazon.in/dp/B0DDHM6D3L',
        title: 'Portronics Conch Theta C Earphones',
      }),
    ]);
  });
});

describe('parseSaleSignals', () => {
  const store = { id: 'flipkart', name: 'Flipkart', url: 'https://www.flipkart.com/' };

  it('detects live and upcoming events from real banner text', () => {
    const html = `
      <img alt="Upcoming Big Billion Days" /><img alt="Early Bird Offers Live" />
      <img alt="Lowest prices on Amazon + Extra 15% cashback - See all deals" /><img alt="Mobiles" /><img alt="Get Exclusive Offers and Deals in Popular Sale Events" />`;
    expect(parseSaleSignals(html, store).map((s) => [s.text, s.status])).toEqual([
      ['Upcoming Big Billion Days', 'upcoming'],
      ['Early Bird Offers Live', 'live'],
    ]);
  });

  it('ignores pages without sale wording', () => {
    expect(parseSaleSignals('<img alt="Electronics" /><h1>Welcome</h1>', store)).toEqual(
      [],
    );
  });
});
