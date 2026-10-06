import type { Metadata } from 'next';
import LegalPage from '@/components/legal/LegalPage';
import { REPO_URL } from '@/components/nav-links';
import { BOT_TOKEN } from '@/lib/scraper/agent';
import { siteConfig } from '@/lib/site';

export const metadata: Metadata = {
  title: 'About our crawler',
  description: `How ${BOT_TOKEN} collects public prices, and how site owners can opt out.`,
  alternates: { canonical: '/bot' },
};

export default function BotPage() {
  return (
    <LegalPage title={`About ${BOT_TOKEN}`} updated="6 October 2026">
      <section>
        <h2>What it is</h2>
        <p>
          {BOT_TOKEN} is the crawler behind {siteConfig.name}. It reads public product
          pages to record prices, so shoppers can see price history and get an alert when
          a price drops. Its user agent ends with{' '}
          <code>
            {BOT_TOKEN}/1.0 (+{siteConfig.url}/bot)
          </code>
          .
        </p>
      </section>
      <section>
        <h2>How it behaves</h2>
        <ul>
          <li>
            It reads <code>robots.txt</code> before fetching anything and follows it (RFC
            9309). Rules for <code>{BOT_TOKEN}</code> take priority over rules for all
            crawlers.
          </li>
          <li>
            It waits at least 1.2 seconds between requests to the same site, and most
            pages are visited at most once every 30 minutes.
          </li>
          <li>
            It backs off after errors, and pauses a site for two hours after repeated
            failures instead of retrying.
          </li>
          <li>
            Where a store offers an official data feed (such as the Flipkart Affiliate
            API), that is used instead of its web pages.
          </li>
          <li>
            It reads only public information such as titles, prices and images. It never
            logs in, adds to carts or places orders, and uses no proxies.
          </li>
        </ul>
      </section>
      <section>
        <h2>Opting out</h2>
        <p>
          To stop {BOT_TOKEN} visiting your site, add this to your <code>robots.txt</code>
          . It takes effect within a day:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg border border-line bg-paper p-4 font-mono text-sm text-ink">
          {`User-agent: ${BOT_TOKEN}\nDisallow: /`}
        </pre>
        <p className="mt-3">
          For anything else, <a href={`${REPO_URL}/issues`}>open an issue</a> and we will
          respond promptly.
        </p>
      </section>
    </LegalPage>
  );
}
